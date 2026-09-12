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
  /** Results of the jobs this job depends on (direct `needs`); this is the needs context. */
  needs: Record<string, { result: JobResult; outputs?: Record<string, string> }>;
  /**
   * Results of every job upstream of this one, transitively. Recorded runs (fixture-chain, fixture-chain2) show the
   * job-level status functions look at all of them: success() is false when any ancestor was skipped, failed or
   * cancelled, even three hops away and even when the direct need succeeded; failure() is true when any ancestor
   * failed, even when the direct need was skipped. Defaults to `needs`.
   */
  ancestors?: Record<string, { result: JobResult }>;
  /** Whether the workflow run was cancelled (affects cancelled() and success()). */
  cancelled?: boolean;
  /**
   * For a step condition: the status of the job's own previous steps. Recorded runs (fixture-steps) show step-level
   * success()/failure() look at the job's steps, not at needs: in an always() job after a failed need, a step with
   * if: failure() is skipped and one with if: success() runs.
   */
  stepStatus?: 'success' | 'failure';
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
  const results = Object.values(opts.ancestors ?? opts.needs).map((n) => n.result);
  const cancelled = Boolean(opts.cancelled);
  // Job level: every ancestor must be success for success(); any failed ancestor makes failure() true (verified by runs).
  // Step level: the job's own step status (all previous steps assumed to have succeeded unless told otherwise).
  const success = opts.stepStatus ? !cancelled && opts.stepStatus === 'success' : !cancelled && results.every((r) => r === 'success');
  const failure = opts.stepStatus ? opts.stepStatus === 'failure' : results.some((r) => r === 'failure');
  const defs: FunctionDefinition[] = [
    { name: 'success', minArgs: 0, maxArgs: 0, call: () => bool(success) },
    { name: 'failure', minArgs: 0, maxArgs: 0, call: () => bool(failure) },
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
  let reason = explain(ast, ev.trace, truthy);
  // Status functions are only as informative as the needs behind them: say which job did it.
  const m = /^(success|failure|cancelled)\(\) is (true|false)$/.exec(reason);
  if (m) {
    const scope = opts.ancestors ?? opts.needs;
    const bad = Object.entries(scope).filter(([, n]) => n.result !== 'success').map(([id, n]) => `${id}${id in opts.needs ? '' : ' (upstream)'} ${n.result === 'skipped' ? 'was skipped' : n.result === 'failure' ? 'failed' : 'was cancelled'}`);
    if (opts.stepStatus) {
      if (m[1] === 'success') reason = m[2] === 'true' ? 'success() is true: no previous step of this job failed' : 'success() is false: a previous step of this job failed';
      else if (m[1] === 'failure') reason = m[2] === 'true' ? 'failure() is true: a previous step of this job failed' : 'failure() is false: no previous step of this job failed (step-level status functions ignore needs)';
    }
    else if (m[1] === 'success' && m[2] === 'false') reason = opts.cancelled ? 'success() is false because the run was cancelled' : bad.length ? `success() is false because ${bad.join(', ')}` : reason;
    else if (m[1] === 'failure' && m[2] === 'true') reason = `failure() is true because ${bad.filter((b) => b.endsWith('failed')).join(', ') || bad.join(', ')}`;
    else if (m[1] === 'failure' && m[2] === 'false') reason = Object.keys(scope).length ? 'failure() is false: no job upstream failed' : 'failure() is false: the job needs nothing that could have failed';
    else if (m[1] === 'success' && m[2] === 'true') reason = Object.keys(scope).length ? 'success() is true: every job upstream succeeded' : 'success() is true: the job needs nothing';
  }
  return { ok: true, truthy, value: displayValue(value), kind: kindStr(value.kind), subValues, reason };
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
    // dot access is parsed as an index with a literal key (`github.ref` -> github['ref'])
    if (idx instanceof Literal && idx.literal.kind === data.Kind.String && /^[A-Za-z_][\w-]*$/.test(idx.literal.coerceString())) return `${exprText(n.expr)}.${idx.literal.coerceString()}`;
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
 * Finds the decisive sub-expression and phrases it. For a false `&&` chain that is the first false
 * operand; for a true `||` chain the first true operand; for a true `&&` chain the last operand that
 * is not a bare status function (so `success() && (x == y)` explains `x == y`). Comparisons are
 * phrased with both sides' values, and a note is added when GitHub's loose equality coerced types.
 */
function explain(root: Expr, trace: Array<{ node: Expr; value: data.ExpressionData }>, truthy: boolean): string {
  const valueOf = (n: Expr) => trace.find((t) => t.node === n)?.value;
  const isStatusCall = (n: Expr) => n instanceof FunctionCall && ['success', 'failure', 'cancelled', 'always'].includes(n.functionName.lexeme.toLowerCase());
  let node: Expr = root;
  for (let guard = 0; guard < 50; guard++) {
    if (node instanceof Grouping) { node = node.group; continue; }
    if (node instanceof Logical) {
      const and = node.operator.lexeme === '&&';
      let hit: Expr | undefined;
      if (and && !truthy) hit = node.args.find((a) => { const v = valueOf(a); return v ? !isTruthy(v) : false; });
      else if (!and && truthy) hit = node.args.find((a) => { const v = valueOf(a); return v ? isTruthy(v) : false; });
      else if (and && truthy) hit = [...node.args].reverse().find((a) => !isStatusCall(a)) ?? node.args[node.args.length - 1];
      if (hit && hit !== node) { node = hit; continue; }
    }
    break;
  }
  const v = valueOf(node);
  const text = exprText(node);
  const shown = v ? displayValue(v) : truthy ? 'true' : 'false';
  if (node instanceof Binary && v) {
    const sides = [node.left, node.right].filter((s) => !(s instanceof Literal)).map((s) => { const sv = valueOf(s); return `${exprText(s)} is ${sv ? displayValue(sv) : '?'}`; });
    const l = valueOf(node.left); const r = valueOf(node.right);
    let hint = '';
    if (l && r && (node.operator.lexeme === '==' || node.operator.lexeme === '!=') && l.kind !== r.kind) {
      hint = ` (loose equality: ${kindStr(l.kind).toLowerCase()} and ${kindStr(r.kind).toLowerCase()} are compared as numbers, null/false/'' count as 0)`;
    } else if (l && r && l.kind === data.Kind.String && r.kind === data.Kind.String && (node.operator.lexeme === '==' || node.operator.lexeme === '!=') && l.coerceString() !== r.coerceString() && l.coerceString().toLowerCase() === r.coerceString().toLowerCase()) {
      hint = ' (string comparison is case-insensitive)';
    }
    return `${sides.join(', ')}${sides.length ? ' → ' : ''}${text} is ${displayValue(v)}${hint}`;
  }
  if (node instanceof FunctionCall && v && node.functionName.lexeme.toLowerCase() === 'contains' && node.args.length === 2) {
    const a = valueOf(node.args[0]!);
    return `${exprText(node.args[0]!)} is ${a ? displayValue(a) : '?'} → ${text} is ${displayValue(v)}`;
  }
  return `${text} is ${shown}`;
}
