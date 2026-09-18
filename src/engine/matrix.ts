/**
 * Matrix expansion: which jobs GitHub creates for a job with `strategy.matrix`, and what each one is called.
 *
 * @actions/workflow-parser keeps `strategy` as a raw token and stops there. The expansion lives in GitHub's C#
 * workflow parser, published under src/Sdk/WorkflowParser in the MIT-licensed actions/runner repository
 * (MatrixBuilder.cs, IdBuilder.cs, JobNameBuilder.cs and ConvertToStrategy in WorkflowTemplateConverter.cs).
 * This module is a port of that code, checked against a recorded run.
 *
 * GitHub's code here: every `${{ }}` in the strategy is evaluated by @actions/expressions, the values are that
 * package's data types (so a number prints the way GitHub prints it), and include/exclude entries are compared
 * the way MatrixBuilder compares them: one `matrix[key] == value` expression per leaf value, evaluated by
 * @actions/expressions, so its loose equality applies ('20' == 20; strings compare case-insensitively).
 * Ours: the port of the cross product, the include/exclude rules, names and ids, and one decision GitHub never
 * has to make: a matrix that reads a job output nobody has given us is unknown, not guessed.
 *
 * The rules, as MatrixBuilder implements them and fixture-matrix recorded them:
 *   - the cross product of the keys, first key outermost: os [linux, mac] x node [20, 22] gives (linux, 20),
 *     (linux, 22), (mac, 20), (mac, 22);
 *   - an exclude entry removes every combination that matches all of its values;
 *   - an include entry is split into the keys the matrix already has and new keys. Its new keys are added to every
 *     combination of the cross product whose values it does not contradict (an entry with only new keys fits them
 *     all); a later entry may overwrite a value an earlier entry added, never an original one. An entry that fits
 *     no combination becomes a combination of its own, and other entries never add to those;
 *   - the name is the job name and, in brackets, the combination's values: for a cross-product combination only
 *     the original keys' values in declaration order ("include_exclude (apple, cat)", although that job also has a
 *     color and a shape); for a combination an include entry created, all of the entry's values
 *     ("matrix_job (24, true)", "whole_json (1)");
 *   - an empty list (`target: []`) or a matrix with no keys and an empty include (`{"include": []}`) is an error
 *     inside GitHub's parser. The recorded run shows what that means for the run: no job is created at all (not
 *     a failed one, not a skipped one), the API does not list one, no annotation says why, and the jobs that need
 *     it see needs.<id>.result == 'failure'.
 */
import { data, Lexer, Parser, Evaluator } from '@actions/expressions';
import type { Expr } from '@actions/expressions';
import { Binary, ContextAccess, FunctionCall, Grouping, IndexAccess, Literal, Logical, Unary } from '@actions/expressions/ast';
import { isBasicExpression, isBoolean, isMapping, isNumber, isSequence, isString } from '@actions/workflow-parser';
import { TemplateToken } from '@actions/workflow-parser/templates/tokens/template-token';
import { TokenType } from '@actions/workflow-parser/templates/tokens/types';
import type { ParsedJob, ParsedWorkflow } from './workflow.js';
import type { Json } from './context.js';
import { isTruthy, CONTEXT_NAMES, parseExpression, statusFunctions, type JobResult } from './evaluate.js';
import { collectNames } from './availability.js';

/** A read of `needs.<job>.outputs.<output>`. */
export interface OutputRef {
  job: string;
  output: string;
}

export interface OutputRead extends OutputRef {
  /** The value the expression sees; undefined when the simulation does not know it. */
  value: string | null | undefined;
  /**
   * given: the user typed it. skipped: that job did not run, so it has no outputs. undeclared: that job declares no
   * such output, so it is null on GitHub too. not-needed: the job is not in `needs`, so needs.<job> is null.
   * unknown: whatever the job writes at run time.
   */
  source: 'given' | 'skipped' | 'undeclared' | 'not-needed' | 'unknown';
}

export interface MatrixCombination {
  /** The name GitHub lists the job under: "plain (linux, 20)". */
  name: string;
  /** Configuration id. GitHub's fail-fast annotation names a combination as <job id>.<id>, e.g. "failfast._2". */
  id: string;
  /** This job's matrix context, keys in GitHub's order (original keys first, then the ones include entries added). */
  matrix: Json;
  /** product: from the cross product (maybe extended by include entries). include: created by an include entry. */
  origin: 'product' | 'include';
}

export interface StrategySettings {
  failFast: boolean;
  /** Read and shown; it limits how many combinations run at once, which changes no outcome this page decides. */
  maxParallel: number | undefined;
}

export type MatrixExpansion =
  | { kind: 'none' }
  | { kind: 'combinations'; settings: StrategySettings; combinations: MatrixCombination[]; reads: OutputRead[] }
  /**
   * recorded: an empty list or an empty include, which fixture-matrix recorded. false: exclude removed every
   * combination, which GitHub's parser does not treat as an error and no run here recorded.
   */
  | { kind: 'empty'; settings: StrategySettings; reason: string; reads: OutputRead[]; recorded: boolean }
  | { kind: 'unknown'; reason: string; reads: OutputRead[] }
  | { kind: 'error'; reason: string; reads: OutputRead[] };

export interface MatrixContexts {
  github: Json;
  inputs: Json;
  vars: Json;
  /** The needs context: each needed job's result and the outputs the simulation was told. */
  needs: Record<string, { result: JobResult; outputs?: Record<string, string> }>;
  /** Output names each job declares under `outputs:`, to tell "not given" from "does not exist". */
  declaredOutputs?: Record<string, string[] | undefined>;
}

/** GitHub documents a limit of 256 jobs per matrix. */
export const MAX_COMBINATIONS = 256;

/** Key for SimulationInput.forcedResults that marks one combination: the form GitHub's fail-fast annotation uses. */
export function combinationKey(jobId: string, combination: Pick<MatrixCombination, 'id'>): string {
  return `${jobId}.${combination.id}`;
}

/** Whether a job's strategy has (or, when it is an expression, may have) a matrix. */
export function hasMatrix(strategy: TemplateToken | undefined): boolean {
  if (!strategy) return false;
  if (isBasicExpression(strategy)) return true;
  if (!isMapping(strategy)) return false;
  for (const pair of strategy) if (isBasicExpression(pair.key) || keyText(pair.key) === 'matrix') return true;
  return false;
}

class StrategyError extends Error {}

const STRATEGY_CONTEXTS = ['github', 'needs', 'vars', 'inputs'];

/**
 * Expands a job's matrix with the contexts GitHub allows in `strategy` (github, needs, vars, inputs). Call it only
 * for a job whose own condition is true: GitHub decides `if:` first and expands afterwards, so a skipped matrix job
 * stays one skipped job (fixture-matrix, skipped_matrix).
 */
export function expandMatrix(job: Pick<ParsedJob, 'id' | 'name' | 'strategy'>, ctx: MatrixContexts): MatrixExpansion {
  const strategy = job.strategy;
  if (!strategy || !hasMatrix(strategy)) return { kind: 'none' };
  const reads = uniqueRefs(collectOutputRefs(strategy)).map((r) => readOutput(r, ctx));
  const missing = reads.filter((r) => r.source === 'unknown');
  if (missing.length) {
    const names = missing.map((r) => `needs.${r.job}.outputs.${r.output}`);
    return { kind: 'unknown', reads, reason: `the combinations come from ${names.join(' and ')}, which ${names.length === 1 ? 'is' : 'are'} whatever ${uniq(missing.map((r) => r.job)).join(' and ')} writes at run time` };
  }
  const contexts = contextDictionary(ctx);
  const evaluate = (expression: string): data.ExpressionData => {
    let ast: Expr;
    try {
      ast = new Parser(new Lexer(expression).lex().tokens, STRATEGY_CONTEXTS, []).parse();
    } catch (e) {
      throw new StrategyError(`\${{ ${expression} }} cannot be parsed here: ${(e as Error).message}`);
    }
    try {
      return new Evaluator(ast, contexts).evaluate();
    } catch (e) {
      throw new StrategyError(`evaluating \${{ ${expression} }} fails: ${(e as Error).message}`);
    }
  };
  try {
    const { settings, matrix } = readStrategy(toData(strategy, evaluate));
    if (!matrix) return { kind: 'none' };
    const built = build(matrix);
    if ('empty' in built) return { kind: 'empty', settings, reason: built.empty, reads, recorded: built.recorded };
    nameCombinations(job, built.combinations, settings, ctx);
    return { kind: 'combinations', settings, combinations: built.combinations.map(({ name, id, matrix: m, origin }) => ({ name, id, matrix: m, origin })), reads };
  } catch (e) {
    if (e instanceof StrategyError) return { kind: 'error', reason: e.message, reads };
    throw e;
  }
}

// ---------- evaluating the strategy token ----------

function contextDictionary(ctx: MatrixContexts): data.Dictionary {
  const needs: Json = {};
  for (const [id, n] of Object.entries(ctx.needs)) needs[id] = { result: n.result, outputs: n.result === 'skipped' ? {} : { ...(n.outputs ?? {}) } };
  const plain: Record<string, unknown> = { github: ctx.github, needs, vars: ctx.vars, inputs: ctx.inputs };
  return new data.Dictionary(...Object.entries(plain).map(([key, value]) => ({ key, value: JSON.parse(JSON.stringify(value ?? null), data.reviver) as data.ExpressionData })));
}

/** The strategy token with every expression replaced by its value, as GitHub's template evaluator does before ConvertToStrategy. */
function toData(token: TemplateToken, evaluate: (expression: string) => data.ExpressionData): data.ExpressionData {
  if (isBasicExpression(token)) return evaluate(token.expression);
  if (isString(token)) return new data.StringData(token.value);
  if (isNumber(token)) return new data.NumberData(token.value);
  if (isBoolean(token)) return new data.BooleanData(token.value);
  if (token.templateTokenType === TokenType.Null) return new data.Null();
  if (isSequence(token)) {
    const out = new data.Array();
    for (const item of token) out.add(toData(item, evaluate));
    return out;
  }
  if (isMapping(token)) {
    const out = new data.Dictionary();
    for (const pair of token) out.add(isBasicExpression(pair.key) ? evaluate(pair.key.expression).coerceString() : keyText(pair.key), toData(pair.value, evaluate));
    return out;
  }
  throw new StrategyError(`${token.typeName()} inside a strategy is not simulated`);
}

function readStrategy(value: data.ExpressionData): { settings: StrategySettings; matrix: data.Dictionary | undefined } {
  if (!(value instanceof data.Dictionary)) throw new StrategyError(`strategy must be a mapping, but it is ${describe(value)}${fromJsonHint(value)}`);
  const settings: StrategySettings = { failFast: true, maxParallel: undefined };
  let matrix: data.Dictionary | undefined;
  for (const { key, value: v } of value.pairs()) {
    if (key === 'fail-fast') {
      if (!(v instanceof data.BooleanData)) throw new StrategyError(`fail-fast must be true or false, but it is ${describe(v)}`);
      settings.failFast = v.value;
    } else if (key === 'max-parallel') {
      if (!(v instanceof data.NumberData)) throw new StrategyError(`max-parallel must be a number, but it is ${describe(v)}`);
      settings.maxParallel = Math.trunc(v.number());
    } else if (key === 'matrix') {
      if (!(v instanceof data.Dictionary)) throw new StrategyError(`matrix must be a mapping, but it is ${describe(v)}${fromJsonHint(v)}`);
      matrix = v;
    } else {
      throw new StrategyError(`unexpected strategy key '${key}'`);
    }
  }
  return { settings, matrix };
}

// ---------- MatrixBuilder ----------

type Pair = { key: string; value: data.ExpressionData };
interface Built { name: string; id: string; matrix: Json; origin: 'product' | 'include'; segments: string[] }

function build(matrix: data.Dictionary): { empty: string; recorded: boolean } | { combinations: Built[] } {
  const vectors: Array<{ key: string; values: data.ExpressionData[] }> = [];
  const empties: string[] = [];
  let includeItems: data.ExpressionData[] = [];
  let excludeItems: data.ExpressionData[] = [];
  let hasCrossProductVector = false;
  let hasIncludeVector = false;
  for (const { key, value } of matrix.pairs()) {
    if (key === 'include') {
      if (!(value instanceof data.Array)) throw new StrategyError(`matrix include must be a list, but it is ${describe(value)}${fromJsonHint(value)}`);
      includeItems = value.values();
      hasIncludeVector = includeItems.length > 0;
    } else if (key === 'exclude') {
      if (!(value instanceof data.Array)) throw new StrategyError(`matrix exclude must be a list, but it is ${describe(value)}${fromJsonHint(value)}`);
      excludeItems = value.values();
    } else {
      hasCrossProductVector = true;
      if (!(value instanceof data.Array)) throw new StrategyError(`matrix key '${key}' must be a list, but it is ${describe(value)}${fromJsonHint(value)}`);
      // GitHub's parser: "Matrix vector '<key>' does not contain any values"
      if (value.values().length === 0) empties.push(key);
      else vectors.push({ key, values: value.values() });
    }
  }
  if (empties.length) return { empty: `${empties.map((k) => `'${k}'`).join(' and ')} ${empties.length === 1 ? 'is an empty list' : 'are empty lists'}`, recorded: true };
  // GitHub's parser: "Matrix must define at least one vector"
  if (!hasCrossProductVector && !hasIncludeVector) return { empty: 'it has no keys and nothing in include', recorded: true };

  const vectorKeys = new Set(vectors.map((v) => v.key.toLowerCase()));
  const includes = includeItems.map((item, i) => {
    if (!(item instanceof data.Dictionary)) throw new StrategyError(`include entry ${i + 1} must be a mapping, but it is ${describe(item)}`);
    const filter: Pair[] = [];
    const extra: Pair[] = [];
    for (const p of item.pairs()) (vectorKeys.has(p.key.toLowerCase()) ? filter : extra).push(p);
    if (!filter.length && !extra.length) throw new StrategyError(`include entry ${i + 1} is empty ("Matrix include mapping does not contain any values")`);
    return { filter, extra, tests: leafTests(filter), matched: false };
  });
  const excludes = excludeItems.map((item, i) => {
    if (!(item instanceof data.Dictionary)) throw new StrategyError(`exclude entry ${i + 1} must be a mapping, but it is ${describe(item)}`);
    if (!item.pairs().length) throw new StrategyError(`exclude entry ${i + 1} is empty ("Matrix exclude filter must not be empty")`);
    for (const p of item.pairs()) if (!vectorKeys.has(p.key.toLowerCase())) throw new StrategyError(`Matrix exclude key '${p.key}' does not match any key within the matrix`);
    return leafTests(item.pairs());
  });

  const out: Built[] = [];
  const ids = new IdBuilder();
  const productSize = vectors.length ? vectors.reduce((n, v) => n * v.values.length, 1) : 0;
  // Excludes may bring a larger product under the limit, so the limit is checked on the result; this guard only
  // keeps the page responsive when a product is hopelessly large.
  if (productSize > 65536) throw new StrategyError(`the cross product has ${productSize} combinations; GitHub allows ${MAX_COMBINATIONS} jobs per matrix`);
  for (let index = 0; index < productSize; index++) {
    const pairs: Pair[] = [];
    let blockSize = productSize;
    for (const v of vectors) {
      blockSize = blockSize / v.values.length;
      pairs.push({ key: v.key, value: v.values[Math.floor(index / blockSize) % v.values.length]! });
    }
    const combination = new data.Dictionary(...pairs);
    if (excludes.some((tests) => matches(tests, combination))) continue;
    // Every include entry that fits adds its new keys; a later one overwrites what an earlier one added.
    const extra = new Map<string, Pair>();
    for (const inc of includes) {
      if (!matches(inc.tests, combination)) continue;
      inc.matched = true;
      for (const p of inc.extra) extra.set(p.key.toLowerCase(), p);
    }
    out.push(configuration(ids, pairs, [...extra.values()], 'product'));
  }
  // Entries that fit no combination become combinations of their own: the entry's matrix keys first, then the rest.
  for (const inc of includes) if (!inc.matched) out.push(configuration(ids, [...inc.filter, ...inc.extra], [], 'include'));
  if (out.length > MAX_COMBINATIONS) throw new StrategyError(`the matrix makes ${out.length} jobs; GitHub allows ${MAX_COMBINATIONS} jobs per matrix`);
  // MatrixBuilder raises no error here, it just builds nothing; what GitHub then does with the job is not recorded.
  if (!out.length) return { empty: 'exclude removes every combination', recorded: false };
  return { combinations: out };
}

/** MatrixFilter: `matrix[key][...] == <literal>` for every leaf of the entry, parsed once. */
function leafTests(pairs: Pair[]): Expr[] {
  const tests: Expr[] = [];
  const walk = (path: string, v: data.ExpressionData): void => {
    if (v instanceof data.Dictionary) for (const p of v.pairs()) walk(`${path}[${quote(p.key)}]`, p.value);
    else if (v instanceof data.Array) v.values().forEach((x, i) => walk(`${path}[${i}]`, x));
    else tests.push(new Parser(new Lexer(`${path} == ${literal(v)}`).lex().tokens, ['matrix'], []).parse());
  };
  for (const p of pairs) walk(`matrix[${quote(p.key)}]`, p.value);
  return tests;
}

function matches(tests: Expr[], combination: data.Dictionary): boolean {
  const context = new data.Dictionary({ key: 'matrix', value: combination });
  return tests.every((t) => isTruthy(new Evaluator(t, context).evaluate()));
}

function configuration(ids: IdBuilder, namePairs: Pair[], extra: Pair[], origin: Built['origin']): Built {
  // The name and id come from the values before include entries add theirs (CreateConfiguration).
  const segments = namePairs.flatMap((p) => segmentsOf(p.value));
  const matrix = plain(new data.Dictionary(...namePairs, ...extra)) as Json;
  return { name: '', id: ids.build(segments), matrix, origin, segments };
}

/** Values that name a combination: every string, number and boolean, depth first; empty strings and nulls are left out. */
function segmentsOf(v: data.ExpressionData): string[] {
  if (v instanceof data.StringData) return v.coerceString() ? [v.coerceString()] : [];
  if (v instanceof data.NumberData) return [v.coerceString()];
  if (v instanceof data.BooleanData) return [v.value ? 'true' : 'false'];
  if (v instanceof data.Array) return v.values().flatMap(segmentsOf);
  if (v instanceof data.Dictionary) return v.values().flatMap(segmentsOf);
  return [];
}

/** IdBuilder.cs: letters, digits, '_' and '-' kept, anything else becomes '_', segments joined by '_', unique per job. */
class IdBuilder {
  private readonly used = new Set<string>();
  build(segments: string[], maxLength = 100): string {
    let name = '';
    for (const value of segments) {
      if (!value) continue;
      if (!name.length) { if (/^[0-9-]/.test(value)) name += '_'; } else name += '_';
      name += value.replace(/[^A-Za-z0-9_-]/g, '_');
    }
    let original = name.length ? name : 'job';
    if (original.startsWith('__')) original = `_${original.replace(/^_+/, '')}`;
    for (let attempt = 1; attempt < 1000; attempt++) {
      const suffix = attempt === 1 ? '' : original === '_' ? String(attempt) : `_${attempt}`;
      const candidate = original.slice(0, Math.max(0, maxLength - suffix.length)) + suffix;
      if (!this.used.has(candidate.toLowerCase())) { this.used.add(candidate.toLowerCase()); return candidate; }
    }
    throw new StrategyError('unable to create a unique id for a combination');
  }
}

/**
 * JobNameBuilder.cs: "<job name> (<values>)", cut to 100 characters. When the job's own `name:` reads the matrix,
 * the evaluated name is used as it is, without the values: that is what public repositories' check names show
 * (e.g. "ubuntu-latest / 3.12"); no recording here covers it.
 */
function nameCombinations(job: Pick<ParsedJob, 'id' | 'name'>, combos: Built[], settings: StrategySettings, ctx: MatrixContexts): void {
  const raw = job.name && job.name !== job.id ? job.name : job.id;
  const expr = /^\$\{\{\s*([\s\S]*?)\s*\}\}$/.exec(raw)?.[1];
  let ast: Expr | undefined;
  if (expr) {
    try { ast = new Parser(new Lexer(expr).lex().tokens, [...STRATEGY_CONTEXTS, 'matrix', 'strategy'], []).parse(); } catch { ast = undefined; }
  }
  const names = { contexts: new Set<string>(), functions: new Set<string>() };
  if (ast) collectNames(ast, names);
  const readsMatrix = names.contexts.has('matrix') || names.contexts.has('strategy');
  const base = contextDictionary(ctx);
  combos.forEach((c, i) => {
    let jobName = raw;
    if (ast) {
      const dict = new data.Dictionary(...base.pairs(),
        { key: 'matrix', value: JSON.parse(JSON.stringify(c.matrix), data.reviver) as data.ExpressionData },
        { key: 'strategy', value: JSON.parse(JSON.stringify(strategyContext(settings, i, combos.length)), data.reviver) as data.ExpressionData });
      try { jobName = new Evaluator(ast, dict).evaluate().coerceString(); } catch { jobName = raw; }
    }
    let name = readsMatrix || !c.segments.length ? jobName : `${jobName} (${c.segments.join(', ')})`;
    if (name.length > 100) name = `${name.slice(0, 97)}...`;
    c.name = name;
  });
}

/** The strategy context a combination's steps see (ConvertToStrategy). */
export function strategyContext(settings: StrategySettings, index: number, total: number): Json {
  return { 'fail-fast': settings.failFast, 'job-index': index, 'job-total': total, 'max-parallel': settings.maxParallel && settings.maxParallel > 0 ? settings.maxParallel : total };
}

// ---------- job outputs a matrix reads ----------

/** Every needs.<job>.outputs.<name> read by an expression inside the token (keys included). */
export function collectOutputRefs(token: TemplateToken): OutputRef[] {
  const out: OutputRef[] = [];
  for (const [, t] of TemplateToken.traverse(token)) {
    if (!isBasicExpression(t)) continue;
    let ast: Expr;
    try { ast = new Parser(new Lexer(t.expression).lex().tokens, CONTEXT_NAMES, []).parse(); } catch { continue; }
    refsIn(ast, out);
  }
  return out;
}

/** Every needs.<job>.outputs.<name> read by one expression (a job or step condition). */
export function outputRefsInExpression(expression: string): OutputRef[] {
  const out: OutputRef[] = [];
  // Conditions call the status functions and hashFiles, which the parser has to know to parse them.
  try { refsIn(parseExpression(expression, statusFunctions({ needs: {} })), out); } catch { /* not an expression the parser takes: nothing is read */ }
  return uniqueRefs(out);
}

function refsIn(n: Expr, out: OutputRef[]): void {
  const ref = asOutputRef(n);
  if (ref) { out.push(ref); return; }
  if (n instanceof IndexAccess) { refsIn(n.expr, out); refsIn(n.index, out); }
  else if (n instanceof FunctionCall) n.args.forEach((a) => refsIn(a, out));
  else if (n instanceof Binary) { refsIn(n.left, out); refsIn(n.right, out); }
  else if (n instanceof Logical) n.args.forEach((a) => refsIn(a, out));
  else if (n instanceof Unary) refsIn(n.expr, out);
  else if (n instanceof Grouping) refsIn(n.group, out);
}

/** needs.<job>.outputs.<name>, also written with brackets: IndexAccess(IndexAccess(IndexAccess(needs, job), 'outputs'), name). */
function asOutputRef(n: Expr): OutputRef | undefined {
  if (!(n instanceof IndexAccess)) return undefined;
  const output = literalString(n.index);
  const outputs = n.expr;
  if (output === undefined || !(outputs instanceof IndexAccess) || literalString(outputs.index)?.toLowerCase() !== 'outputs') return undefined;
  const jobAccess = outputs.expr;
  if (!(jobAccess instanceof IndexAccess) || !(jobAccess.expr instanceof ContextAccess) || jobAccess.expr.name.lexeme.toLowerCase() !== 'needs') return undefined;
  const job = literalString(jobAccess.index);
  return job === undefined ? undefined : { job, output };
}

const literalString = (n: Expr): string | undefined => (n instanceof Literal && n.literal.kind === data.Kind.String ? n.literal.coerceString() : undefined);

function readOutput(ref: OutputRef, ctx: MatrixContexts): OutputRead {
  const needId = Object.keys(ctx.needs).find((k) => k.toLowerCase() === ref.job.toLowerCase());
  const need = needId === undefined ? undefined : ctx.needs[needId];
  if (!need) return { ...ref, value: null, source: 'not-needed' };
  if (need.result === 'skipped') return { ...ref, value: null, source: 'skipped' };
  const givenKey = Object.keys(need.outputs ?? {}).find((k) => k.toLowerCase() === ref.output.toLowerCase());
  if (givenKey !== undefined) return { ...ref, value: need.outputs![givenKey]!, source: 'given' };
  const declared = ctx.declaredOutputs?.[needId!];
  if (declared && !declared.some((d) => d.toLowerCase() === ref.output.toLowerCase())) return { ...ref, value: null, source: 'undeclared' };
  return { ...ref, value: undefined, source: 'unknown' };
}

function uniqueRefs(refs: OutputRef[]): OutputRef[] {
  const seen = new Set<string>();
  return refs.filter((r) => { const k = `${r.job.toLowerCase()}.${r.output.toLowerCase()}`; if (seen.has(k)) return false; seen.add(k); return true; });
}

export interface MatrixOutputField extends OutputRef {
  /** The jobs whose strategy reads it. */
  readBy: string[];
  /** Read as the whole matrix (or strategy), so "empty" is {"include":[]} rather than []. */
  wholeMatrix: boolean;
  /** A literal value the workflow itself gives: the output as written, or what its step echoes into $GITHUB_OUTPUT. */
  example: string | undefined;
}

/** The job outputs that decide some matrix in this workflow, for the page to ask about. */
export function matrixOutputFields(workflow: ParsedWorkflow): MatrixOutputField[] {
  const fields: MatrixOutputField[] = [];
  for (const job of workflow.jobs) {
    if (!job.strategy || !hasMatrix(job.strategy)) continue;
    const whole = new Set<string>();
    const wholeTokens = isBasicExpression(job.strategy) ? [job.strategy] : isMapping(job.strategy) ? [...job.strategy].filter((p) => keyText(p.key) === 'matrix' && isBasicExpression(p.value)).map((p) => p.value) : [];
    for (const t of wholeTokens) for (const r of collectOutputRefs(t)) whole.add(`${r.job.toLowerCase()}.${r.output.toLowerCase()}`);
    for (const ref of uniqueRefs(collectOutputRefs(job.strategy))) {
      const key = `${ref.job.toLowerCase()}.${ref.output.toLowerCase()}`;
      const existing = fields.find((f) => `${f.job.toLowerCase()}.${f.output.toLowerCase()}` === key);
      if (existing) { if (!existing.readBy.includes(job.id)) existing.readBy.push(job.id); existing.wholeMatrix ||= whole.has(key); continue; }
      const producer = workflow.jobs.find((j) => j.id.toLowerCase() === ref.job.toLowerCase());
      fields.push({ job: producer?.id ?? ref.job, output: ref.output, readBy: [job.id], wholeMatrix: whole.has(key), example: producer ? outputExample(producer, ref.output) : undefined });
    }
  }
  return fields;
}

/** A literal example of a job output from the file: `outputs: {x: '[1]'}`, or `x: ${{ steps.s.outputs.x }}` and step s echoing `x=...`. */
export function outputExample(job: Pick<ParsedJob, 'outputs' | 'steps'>, output: string): string | undefined {
  const key = Object.keys(job.outputs ?? {}).find((k) => k.toLowerCase() === output.toLowerCase());
  if (key === undefined) return undefined;
  const source = job.outputs![key]!.trim();
  if (!source.includes('${{')) return source;
  const m = /^\$\{\{\s*steps\.([\w-]+)\.outputs\.([\w-]+)\s*\}\}$/.exec(source);
  if (!m) return undefined;
  const step = job.steps.find((s) => s.id === m[1]);
  return step?.run ? echoedOutput(step.run, m[2]!) : undefined;
}

/** `echo 'name=value' >> "$GITHUB_OUTPUT"` and its usual spellings. A value the shell would expand is not an example. */
export function echoedOutput(script: string, name: string): string | undefined {
  for (const raw of script.split('\n')) {
    const line = raw.trim();
    if (!line.includes('GITHUB_OUTPUT')) continue;
    const m = /^echo\s+(?:-[a-zA-Z]+\s+)*(['"]?)([A-Za-z_][\w-]*)=(.*?)\1\s*>>\s*"?\$\{?GITHUB_OUTPUT\}?"?$/.exec(line);
    if (!m || m[2] !== name) continue;
    const q = m[1];
    let value = m[3]!;
    if (q !== "'" && /[$`]/.test(value)) continue;
    if (q === '"') value = value.replace(/\\(["\\$`])/g, '$1');
    return value;
  }
  return undefined;
}

// ---------- the strategy in one line, and what GitHub rejects before any run ----------

/** `matrix: os [linux, mac] × node [20, 22], include: 4 entries · fail-fast: true (default)` */
export function describeStrategy(token: TemplateToken | undefined): string {
  if (!token) return '';
  if (isBasicExpression(token)) return `strategy: \${{ ${token.expression} }}`;
  if (!isMapping(token)) return `strategy: ${flow(token)}`;
  let matrix = '';
  let failFast = 'fail-fast: true (default)';
  const rest: string[] = [];
  for (const p of token) {
    const key = isBasicExpression(p.key) ? `\${{ ${p.key.expression} }}` : keyText(p.key);
    if (key === 'matrix') matrix = describeMatrix(p.value);
    else if (key === 'fail-fast') failFast = `fail-fast: ${flow(p.value)}`;
    else if (key === 'max-parallel') rest.push(`max-parallel: ${flow(p.value)} (how many run at once; no outcome depends on it)`);
    else rest.push(`${key}: ${flow(p.value)}`);
  }
  return [matrix, failFast, ...rest].filter(Boolean).join(' · ');
}

function describeMatrix(v: TemplateToken): string {
  if (!isMapping(v)) return `matrix: ${flow(v)}`;
  const vectors: string[] = [];
  const filters: string[] = [];
  for (const p of v) {
    const key = isBasicExpression(p.key) ? `\${{ ${p.key.expression} }}` : keyText(p.key);
    if ((key === 'include' || key === 'exclude') && isSequence(p.value)) filters.push(`${key}: ${p.value.count} entr${p.value.count === 1 ? 'y' : 'ies'}`);
    else if (key === 'include' || key === 'exclude') filters.push(`${key}: ${flow(p.value)}`);
    else vectors.push(`${key} ${flow(p.value)}`);
  }
  return `matrix: ${[vectors.join(' × '), ...filters].filter(Boolean).join(', ')}`;
}

function flow(t: TemplateToken): string {
  if (isBasicExpression(t)) return `\${{ ${t.expression} }}`;
  if (isString(t)) return t.value;
  if (isNumber(t) || isBoolean(t)) return String(t.value);
  if (t.templateTokenType === TokenType.Null) return 'null';
  if (isSequence(t)) return `[${[...t].map(flow).join(', ')}]`;
  if (isMapping(t)) return `{${[...t].map((p) => `${isBasicExpression(p.key) ? flow(p.key) : keyText(p.key)}: ${flow(p.value)}`).join(', ')}}`;
  return t.typeName();
}

/**
 * What GitHub's parser reports when it loads the file (ConvertToStrategy with isEarlyValidation), for the parts of a
 * strategy written without expressions. @actions/workflow-parser does not check these; GitHub rejects the file,
 * which (like the recorded hashFiles and filter-both files) means a failed run with no jobs. Not recorded here.
 */
export function strategyFileProblems(job: Pick<ParsedJob, 'id' | 'strategy'>): string[] {
  const strategy = job.strategy;
  if (!strategy || !isMapping(strategy)) return [];
  const problems: string[] = [];
  const at = (t: TemplateToken) => `jobs.${job.id}.strategy${t.line ? ` (line ${t.line})` : ''}`;
  let hasExpressions = false;
  let matrixToken: TemplateToken | undefined;
  const vectors = new Set<string>();
  let includeToken: TemplateToken | undefined;
  let excludeToken: TemplateToken | undefined;
  for (const pair of strategy) {
    if (isBasicExpression(pair.key)) { hasExpressions = true; continue; }
    const key = keyText(pair.key);
    if ((key === 'fail-fast' || key === 'max-parallel') && isBasicExpression(pair.value)) hasExpressions = true;
    if (key !== 'matrix') continue;
    if (isBasicExpression(pair.value)) { hasExpressions = true; continue; }
    if (!isMapping(pair.value)) continue;
    matrixToken = pair.value;
    if ([...TemplateToken.traverse(pair.value)].some(([, t]) => isBasicExpression(t))) hasExpressions = true;
    let hasCrossProductVector = false;
    let hasIncludeVector = false;
    for (const mp of pair.value) {
      if (isBasicExpression(mp.key)) { hasCrossProductVector = true; continue; }
      const mk = keyText(mp.key);
      const dynamic = [...TemplateToken.traverse(mp.value)].some(([, t]) => isBasicExpression(t));
      if (mk === 'include') {
        if (dynamic) { hasIncludeVector = true; continue; }
        if (isSequence(mp.value)) { hasIncludeVector = mp.value.count > 0; includeToken = mp.value; }
      } else if (mk === 'exclude') {
        if (!dynamic && isSequence(mp.value)) excludeToken = mp.value;
      } else {
        hasCrossProductVector = true;
        if (dynamic || !isSequence(mp.value)) continue;
        if (mp.value.count === 0) problems.push(`${at(mp.value)}: Matrix vector '${mk}' does not contain any values`);
        else vectors.add(mk.toLowerCase());
      }
    }
    if (!hasCrossProductVector && !hasIncludeVector) problems.push(`${at(pair.value)}: Matrix must define at least one vector`);
  }
  // The include and exclude checks run while the matrix is built, which GitHub does at load time only when the
  // strategy has no expressions at all.
  if (matrixToken && !hasExpressions) {
    if (includeToken && isSequence(includeToken)) for (const item of includeToken) if (isMapping(item) && item.count === 0) problems.push(`${at(item)}: Matrix include mapping does not contain any values`);
    if (excludeToken && isSequence(excludeToken)) {
      for (const item of excludeToken) {
        if (!isMapping(item)) continue;
        if (item.count === 0) { problems.push(`${at(item)}: Matrix exclude filter must not be empty`); continue; }
        for (const p of item) if (!vectors.has(keyText(p.key).toLowerCase())) problems.push(`${at(p.key)}: Matrix exclude key '${keyText(p.key)}' does not match any key within the matrix`);
      }
    }
  }
  return problems;
}

// ---------- small helpers ----------

function keyText(key: TemplateToken): string {
  return isString(key) ? key.value : isNumber(key) || isBoolean(key) ? String(key.value) : key.toString();
}

const quote = (s: string) => `'${s.replace(/'/g, "''")}'`;

function literal(v: data.ExpressionData): string {
  if (v instanceof data.StringData) return quote(v.coerceString());
  if (v instanceof data.NumberData) return v.coerceString();
  if (v instanceof data.BooleanData) return v.value ? 'true' : 'false';
  return 'null';
}

function plain(v: data.ExpressionData): unknown {
  return JSON.parse(JSON.stringify(v, data.replacer));
}

function describe(v: data.ExpressionData): string {
  if (v instanceof data.StringData) return `the string ${quote(v.coerceString())}`;
  if (v instanceof data.NumberData) return `the number ${v.coerceString()}`;
  if (v instanceof data.BooleanData) return v.value ? 'true' : 'false';
  if (v instanceof data.Null) return 'null';
  if (v instanceof data.Array) return 'a list';
  return 'a mapping';
}

const fromJsonHint = (v: data.ExpressionData) => (v instanceof data.StringData && /^\s*[[{]/.test(v.coerceString()) ? '; a job output is always a string, so read it with fromJSON()' : '');

const uniq = (xs: string[]) => [...new Set(xs)];
