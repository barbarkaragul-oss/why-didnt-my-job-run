/**
 * Evaluate job and step conditions with GitHub's own expression engine (@actions/expressions).
 * We add only what the runner adds around the engine: the job-status functions (success, failure,
 * cancelled, always) computed from the results of the jobs in `needs`, a stand-in for hashFiles,
 * and a tracing evaluator that remembers the value of every sub-expression so the UI can show
 * why a condition came out the way it did.
 */
import { Lexer, Parser, Evaluator, data, ExpressionError, ExpressionEvaluationError } from '@actions/expressions';
import type { Expr } from '@actions/expressions';
import { Binary, ContextAccess, FunctionCall, Grouping, IndexAccess, Literal, Logical, Unary } from '@actions/expressions/ast';
import type { FunctionDefinition, FunctionInfo } from '@actions/expressions/funcs/info';
import type { Json } from './context.js';
import { kindStr } from '@actions/expressions/data/expressiondata';

export type JobResult = 'success' | 'failure' | 'cancelled' | 'skipped';

export const CONTEXT_NAMES = ['github', 'needs', 'inputs', 'vars', 'secrets', 'env', 'matrix', 'strategy', 'runner', 'job', 'steps'];

export interface EvaluationOptions {
  /** Results of the jobs this job depends on (direct `needs`). */
  needs: Record<string, { result: JobResult; outputs?: Record<string, string> }>;
  /** Whether the workflow run was cancelled (affects cancelled() and success()). */
  cancelled?: boolean;
  /** Extra contexts: inputs, vars, env, matrix, steps, job, runner. */
  contexts?: Partial<Record<string, Json>>;
}

export interface SubValue {
  /** Source text of the sub-expression, reconstructed from the tokens. */
  text: string;
  value: string;
  kind: string;
  /** Depth in the tree, for indentation in the UI. */
  depth: number;
}

export interface EvaluationResult {
  ok: true;
  /** Final value coerced to a boolean the way the runner does for `if:`. */
  truthy: boolean;
  value: string;
  kind: string;
  subValues: SubValue[];
  /** Short human explanation of the decisive part of the expression. */
  reason: string;
}

export interface EvaluationFailure {
  ok: false;
  error: string;
}

const toData = (obj: unknown): data.ExpressionData => JSON.parse(JSON.stringify(obj ?? null), data.reviver);
const bool = (b: boolean) => new data.BooleanData(b);

export function statusFunctions(opts: EvaluationOptions): Map<string, FunctionDefinition> {
  const results = Object.values(opts.needs).map((n) => n.result);
  const cancelled = Boolean(opts.cancelled);
  const defs: FunctionDefinition[] = [
    // "success(): none of the previous jobs have failed or been cancelled" (skipped needs count as not successful)
    { name: 'success', minArgs: 0, maxArgs: 0, call: () => bool(!cancelled && results.every((r) => r === 'success')) },
    { name: 'failure', minArgs: 0, maxArgs: 0, call: () => bool(results.some((r) => r === 'failure')) },
    { name: 'cancelled', minArgs: 0, maxArgs: 0, call: () => bool(cancelled) },
    { name: 'always', minArgs: 0, maxArgs: 0, call: () => bool(true) },
    { name: 'hashFiles', minArgs: 1, maxArgs: 255, call: () => new data.StringData('') },
  ];
  return new Map(defs.map((d) => [d.name, d]));
}

class TracingEvaluator extends Evaluator {
  readonly trace: Array<{ node: Expr; value: data.ExpressionData }> = [];
  protected override eval(n: Expr): data.ExpressionData {
    const v = super.eval(n);
    this.trace.push({ node: n, value: v });
    return v;
  }
}

export function parseExpression(expression: string, functions: Map<string, FunctionDefinition>): Expr {
  const tokens = new Lexer(expression).lex().tokens;
  const infos: FunctionInfo[] = [...functions.values()].map(({ name, minArgs, maxArgs }) => ({ name, minArgs, maxArgs }));
  return new Parser(tokens, CONTEXT_NAMES, infos).parse();
}

export function evaluateCondition(expression: string, github: Json, opts: EvaluationOptions): EvaluationResult | EvaluationFailure {
  const functions = statusFunctions(opts);
  let ast: Expr;
  try {
    ast = parseExpression(expression, functions);
  } catch (e) {
    return { ok: false, error: `Invalid expression: ${(e as Error).message}` };
  }
  const needsCtx: Json = {};
  for (const [id, n] of Object.entries(opts.needs)) needsCtx[id] = { result: n.result, outputs: n.outputs ?? {} };
  const contexts: Record<string, Json> = { github, needs: needsCtx, inputs: {}, vars: {}, secrets: {}, env: {}, matrix: {}, strategy: {}, runner: {}, job: {}, steps: {}, ...(opts.contexts as Record<string, Json> | undefined) };
  const dict = new data.Dictionary(...Object.entries(contexts).map(([key, value]) => ({ key, value: toData(value) })));
  const ev = new TracingEvaluator(ast, dict, functions);
  let value: data.ExpressionData;
  try {
    value = ev.evaluate();
  } catch (e) {
    const msg = e instanceof ExpressionEvaluationError || e instanceof ExpressionError ? e.message : (e as Error).message;
    return { ok: false, error: `Evaluation failed: ${msg}` };
  }
  const subValues = ev.trace
    .filter((t) => !(t.node instanceof Literal))
    .map((t) => ({ text: exprText(t.node), value: displayValue(t.value), kind: kindStr(t.value.kind), depth: 0 }));
  const truthy = isTruthy(value);
  return { ok: true, truthy, value: displayValue(value), kind: kindStr(value.kind), subValues, reason: explain(ast, ev.trace, truthy) };
}

/** Runner truthiness for `if:`: false, null, 0, '' are false; everything else (objects too) is true. */
export function isTruthy(v: data.ExpressionData): boolean {
  switch (v.kind) {
    case data.Kind.Boolean: return (v as data.BooleanData).value;
    case data.Kind.Null: return false;
    case data.Kind.Number: return v.number() !== 0;
    case data.Kind.String: return v.coerceString() !== '';
    default: return true;
  }
}

export function displayValue(v: data.ExpressionData): string {
  switch (v.kind) {
    case data.Kind.String: return JSON.stringify(v.coerceString());
    case data.Kind.Null: return 'null';
    case data.Kind.Boolean:
    case data.Kind.Number: return v.coerceString();
    case data.Kind.Array: return `[array of ${(v as data.Array).values().length}]`;
    default: return '{object}';
  }
}

/** Reconstructs readable source for an AST node (the parser does not keep source spans per node). */
export function exprText(n: Expr): string {
  if (n instanceof Literal) return n.token.lexeme;
  if (n instanceof ContextAccess) return n.name.lexeme;
  if (n instanceof IndexAccess) {
    const idx = n.index;
    if (idx instanceof Literal && idx.token.type === 18 /* STRING */ && /^[A-Za-z_][\w-]*$/.test(String(idx.literal.coerceString()))) return `${exprText(n.expr)}.${idx.literal.coerceString()}`;
    if (idx.constructor.name === 'Star') return `${exprText(n.expr)}.*`;
    return `${exprText(n.expr)}[${exprText(idx)}]`;
  }
  if (n instanceof FunctionCall) return `${n.functionName.lexeme}(${n.args.map(exprText).join(', ')})`;
  if (n instanceof Unary) return `${n.operator.lexeme}${exprText(n.expr)}`;
  if (n instanceof Binary) return `${exprText(n.left)} ${n.operator.lexeme} ${exprText(n.right)}`;
  if (n instanceof Logical) return n.args.map(exprText).join(` ${n.operator.lexeme} `);
  if (n instanceof Grouping) return `(${exprText(n.group)})`;
  return '…';
}

/**
 * Finds the decisive sub-expression: for a false `&&` chain the first false operand, for a true
 * `||` chain the first true operand, descending into groupings, and phrases it.
 */
function explain(root: Expr, trace: Array<{ node: Expr; value: data.ExpressionData }>, truthy: boolean): string {
  const valueOf = (n: Expr) => trace.find((t) => t.node === n)?.value;
  let node: Expr = root;
  for (let guard = 0; guard < 50; guard++) {
    if (node instanceof Grouping) { node = node.group; continue; }
    if (node instanceof Logical) {
      const wantFalse = node.operator.lexeme === '&&' && !truthy;
      const wantTrue = node.operator.lexeme === '||' && truthy;
      if (wantFalse || wantTrue) {
        const hit = node.args.find((a) => { const v = valueOf(a); return v ? isTruthy(v) === wantTrue : false; });
        if (hit) { node = hit; continue; }
      }
    }
    break;
  }
  const v = valueOf(node);
  const text = exprText(node);
  if (node === root) return truthy ? `${text} is ${v ? displayValue(v) : 'true'}` : `${text} is ${v ? displayValue(v) : 'false'}`;
  if (node instanceof Binary && v) {
    const l = valueOf(node.left); const r = valueOf(node.right);
    return `${exprText(node.left)} is ${l ? displayValue(l) : '?'}, ${exprText(node.right)} is ${r ? displayValue(r) : '?'} → ${text} is ${displayValue(v)}`;
  }
  return `${text} is ${v ? displayValue(v) : (truthy ? 'true' : 'false')}`;
}
