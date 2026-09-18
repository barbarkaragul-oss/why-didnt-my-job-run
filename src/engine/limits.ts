/**
 * What the simulation cannot fully decide for this workflow and this event, each with what it does instead. The page
 * shows the list above the results and the command line prints it under "limits:". A gap that is shown is one the
 * reader can allow for; a gap that is not shown reads as a verdict.
 *
 * Only what bears on the verdicts in front of the reader is listed: nothing when the file is rejected or the event
 * does not start the workflow (simulate() does not call this then), and a job's steps, environment or called
 * workflow only when that job runs. Everything listed here is something the engine marks unknown or assumes:
 * a step condition it marks unknown, a matrix it cannot expand, an outcome no recorded run covers, a value (job
 * output, configuration variable) it takes as empty, or a part of GitHub it does not model.
 */
import type { Expr } from '@actions/expressions';
import { ContextAccess, FunctionCall, Binary, Grouping, IndexAccess, Literal, Logical, Unary } from '@actions/expressions/ast';
import { data } from '@actions/expressions';
import { isBasicExpression } from '@actions/workflow-parser';
import { TemplateToken } from '@actions/workflow-parser/templates/tokens/template-token';
import type { ParsedWorkflow } from './workflow.js';
import type { JobVerdict, StepVerdict } from './simulate.js';
import { parseExpression, statusFunctions } from './evaluate.js';
import { outputRefsInExpression } from './matrix.js';
import type { Json } from './context.js';

export type LimitKind =
  | 'reusable-workflow' | 'matrix-output' | 'matrix-assumed' | 'fail-fast' | 'job-output' | 'vars'
  | 'step-unknown' | 'step-matrix' | 'step-failure' | 'environment' | 'concurrency' | 'matrix-name';

export interface Limit {
  kind: LimitKind;
  /** What it is, in a few words. */
  title: string;
  /** Where this workflow uses it: jobs, steps, the expression read. */
  where: string[];
  /** One sentence: what the simulation does instead. */
  instead: string;
}

const INSTEAD: Record<LimitKind, { title: string; instead: string }> = {
  'reusable-workflow': { title: 'Reusable workflow', instead: 'Its condition is decided like any other job\'s; the jobs inside the called workflow are not simulated, and the call is shown as one job.' },
  'matrix-output': { title: 'Matrix from a job output with no value yet', instead: 'The matrix is not expanded until that output has a value, and the jobs after it assume it makes at least one job.' },
  'matrix-assumed': { title: 'Matrix outcome no recorded run covers', instead: 'Taken to end like the recorded empty matrix: no job, and failure for the jobs that need it.' },
  'fail-fast': { title: 'fail-fast timing', instead: 'Every other combination is taken to be still running when one fails, so all of them are cancelled; on GitHub, those that already finished keep their result.' },
  'job-output': { title: 'Job output read by a condition', instead: 'Taken as empty (null): only the job knows what it writes at run time.' },
  vars: { title: 'Configuration variable', instead: 'Taken as empty (null): its value lives in the repository\'s settings.' },
  'step-unknown': { title: 'Step condition that reads steps.*, env or hashFiles()', instead: 'Marked unknown instead of guessed: step outputs, env and the files in the checkout exist only at run time.' },
  'step-matrix': { title: 'Step condition that reads matrix in a job without one', instead: 'Marked unknown: no recorded run shows what GitHub gives such a step.' },
  'step-failure': { title: 'Step that runs after a failed step', instead: 'Every earlier step is taken to have succeeded, so failure() is false there; a step cannot be marked as failing here.' },
  environment: { title: 'Deployment environment', instead: 'Its protection rules (required reviewers, allowed branches, wait timers) live in the repository\'s settings and are not simulated; the job is shown as starting.' },
  concurrency: { title: 'Concurrency group', instead: 'Not simulated: another run in the same group can cancel this one or make it wait.' },
  'matrix-name': { title: 'Matrix job name from an expression', instead: 'Each job is listed under the evaluated name, without the values GitHub otherwise appends; this follows the check names of public repositories, not a recorded run.' },
};

/** The order the list is shown in: what changes a verdict first, what only qualifies one last. */
const ORDER = Object.keys(INSTEAD) as LimitKind[];

export function findLimits(workflow: ParsedWorkflow, jobs: JobVerdict[], known: { outputs: Record<string, Record<string, string>>; vars: Json }): Limit[] {
  const found = new Map<LimitKind, string[]>();
  const add = (kind: LimitKind, where: string) => { const list = found.get(kind) ?? []; if (!list.includes(where)) list.push(where); found.set(kind, list); };
  const byId = new Map(jobs.map((v) => [v.job.id.toLowerCase(), v]));
  const ran = (v: JobVerdict) => v.outcome === 'runs' || v.outcome === 'fails' || v.outcome === 'cancelled';

  /** A job output nobody gave, from a job that ran and declares it: GitHub has a value, the simulation has null. */
  const readsOutputs = (v: JobVerdict, expression: string, at: string) => {
    for (const ref of outputRefsInExpression(expression)) {
      const producer = byId.get(ref.job.toLowerCase());
      // Not in needs, skipped, or not declared: needs.<job>.outputs.<name> is null on GitHub too. An empty matrix
      // creates no job, so nothing writes the output there either: the simulation's null is not a guess.
      if (!producer || !v.job.needs.some((n) => n.toLowerCase() === ref.job.toLowerCase()) || producer.result === 'skipped' || producer.outcome === 'not-created') continue;
      const declared = Object.keys(producer.job.outputs ?? {}).some((k) => k.toLowerCase() === ref.output.toLowerCase());
      const given = Object.keys(known.outputs[producer.job.id] ?? {}).some((k) => k.toLowerCase() === ref.output.toLowerCase());
      if (declared && !given) add('job-output', `${at} reads needs.${producer.job.id}.outputs.${ref.output}`);
    }
  };
  const readsVars = (expression: string, at: string) => {
    for (const name of varsRead(expression)) if (!Object.keys(known.vars).some((k) => k.toLowerCase() === name.toLowerCase())) add('vars', `${at} reads vars.${name}`);
  };

  if (workflow.concurrency !== undefined) add('concurrency', `the workflow (group: ${workflow.concurrency})`);
  for (const v of jobs) {
    const id = v.job.id;
    if (v.outcome === 'blocked' || v.outcome === 'rejected') continue;
    // The job's own condition is evaluated whatever it decides.
    if (v.job.ifSource !== undefined) { readsOutputs(v, v.job.if, id); readsVars(v.job.if, id); }
    const e = v.matrix?.expansion;
    if (e?.kind === 'unknown') add('matrix-output', `${id} reads ${e.reads.filter((r) => r.source === 'unknown').map((r) => `needs.${r.job}.outputs.${r.output}`).join(' and ')}`);
    if (v.outcome === 'not-created' && (e?.kind === 'error' || (e?.kind === 'empty' && !e.recorded))) add('matrix-assumed', `${id}: ${e.reason}`);
    if (!ran(v)) continue;

    if (v.job.reusable) add('reusable-workflow', `${id} (uses: ${v.job.uses ?? '?'})`);
    if (v.job.environment !== undefined) add('environment', `${id} (environment: ${v.job.environment})`);
    if (v.job.concurrency !== undefined) add('concurrency', `${id} (group: ${v.job.concurrency})`);
    if (v.job.strategy) for (const expression of expressionsIn(v.job.strategy)) readsVars(expression, `${id}'s strategy`);
    const combinations = v.matrix?.combinations ?? [];
    const cancelled = combinations.filter((c) => c.annotation);
    if (cancelled.length) add('fail-fast', `${id}: ${combinations.filter((c) => c.result === 'failure').map((c) => c.combination.name).join(', ')} failed, ${cancelled.length} cancelled`);
    if (combinations.length && v.job.name && /\$\{\{[\s\S]*\b(matrix|strategy)\b/.test(v.job.name)) add('matrix-name', `${id} (name: ${v.job.name})`);

    // A matrix job's steps are decided per combination; the same step is listed once.
    const steps: StepVerdict[] = combinations.length ? combinations.flatMap((c) => c.stepVerdicts) : v.stepVerdicts;
    for (const s of steps) {
      if (!s.if) continue;
      const at = `${id} · ${stepLabel(v, s)}`;
      if (s.unknown && /^reads (steps\.|env\.|hashFiles)/.test(s.unknown)) add('step-unknown', `${at} (if: ${written(s.if)})`);
      else if (s.unknown?.includes('in a job without a matrix')) add('step-matrix', `${at} (if: ${written(s.if)})`);
      else if (/\bfailure\s*\(/i.test(s.if)) add('step-failure', `${at} (if: ${written(s.if)})`);
      readsOutputs(v, s.if, at);
      readsVars(s.if, at);
    }
  }
  return ORDER.filter((k) => found.has(k)).map((kind) => ({ kind, ...INSTEAD[kind], where: found.get(kind)! }));
}

/** The step's name, or what it runs or uses, cut short. */
function stepLabel(v: JobVerdict, s: StepVerdict): string {
  const name = v.job.steps.find((x) => x.id === s.id)?.name ?? s.summary ?? s.id;
  const text = name || s.id;
  return text.length > 48 ? `${text.slice(0, 45)}...` : text;
}

/** The condition as written: without the success() && (...) the parser wraps around a condition with no status function. */
function written(expression: string): string {
  return /^success\(\) && \((.*)\)$/s.exec(expression)?.[1] ?? expression;
}

/** Every `${{ }}` inside a token, such as a strategy. */
function expressionsIn(token: TemplateToken): string[] {
  const out: string[] = [];
  for (const [, t] of TemplateToken.traverse(token)) if (isBasicExpression(t)) out.push(t.expression);
  return out;
}

/** The names read as vars.NAME or vars['NAME']. */
function varsRead(expression: string): string[] {
  let ast: Expr;
  try { ast = parseExpression(expression, statusFunctions({ needs: {} })); } catch { return []; }
  const names = new Set<string>();
  const walk = (n: Expr): void => {
    if (n instanceof IndexAccess) {
      if (n.expr instanceof ContextAccess && n.expr.name.lexeme.toLowerCase() === 'vars' && n.index instanceof Literal && n.index.literal.kind === data.Kind.String) names.add(n.index.literal.coerceString());
      walk(n.expr); walk(n.index);
    } else if (n instanceof FunctionCall) n.args.forEach(walk);
    else if (n instanceof Binary) { walk(n.left); walk(n.right); }
    else if (n instanceof Logical) n.args.forEach(walk);
    else if (n instanceof Unary) walk(n.expr);
    else if (n instanceof Grouping) walk(n.group);
  };
  walk(ast);
  return [...names];
}
