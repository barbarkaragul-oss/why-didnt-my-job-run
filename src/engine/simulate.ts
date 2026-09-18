/**
 * One call that does what GitHub does when an event arrives: decide whether the workflow triggers,
 * check the file for things GitHub would reject, then walk the job graph in dependency order and
 * evaluate every job's condition with the results of the jobs it needs.
 */
import type { ParsedWorkflow, ParsedJob } from './workflow.js';
import { decideTrigger, validateTriggers, triggerWarnings, DEFAULT_BRANCH_ONLY, type FilterDecision, type TriggerInput } from './filters.js';
import { evaluateCondition, parseExpression, statusFunctions, type EvaluationResult, type EvaluationFailure, type JobResult, type Decisive } from './evaluate.js';
import { checkAvailability, type AvailabilityProblem } from './availability.js';
import { expandMatrix, hasMatrix, describeStrategy, strategyFileProblems, strategyContext, combinationKey, type MatrixExpansion, type MatrixCombination, type OutputRead } from './matrix.js';
import type { Json } from './context.js';
import { findLimits, type Limit } from './limits.js';

/**
 * 'blocked': the event does not start the workflow. 'rejected': GitHub refuses the file, so no job exists.
 * 'not-created': the job's condition is true but its matrix is empty, so GitHub creates no job at all, and the jobs
 * that need it see failure (fixture-matrix, dynamic_empty and whole_json_empty).
 */
export type JobOutcome = 'runs' | 'skipped' | 'fails' | 'cancelled' | 'blocked' | 'rejected' | 'not-created';

export interface JobVerdict {
  job: ParsedJob;
  outcome: JobOutcome;
  /** The result other jobs see in needs.<id>.result. */
  result: JobResult;
  evaluation: EvaluationResult | EvaluationFailure | undefined;
  /** One-line explanation for the card. */
  headline: string;
  needsResults: Record<string, JobResult>;
  /** Results of every job upstream (transitive needs); the status functions look at all of them. */
  ancestorResults: Record<string, JobResult>;
  problems: AvailabilityProblem[];
  /** For a matrix job, the steps with every matrix-dependent condition marked unknown; each combination has its own. */
  stepVerdicts: StepVerdict[];
  /** Set when the job has a matrix. `outcome` and `result` are then the whole matrix's, as jobs that need it see them. */
  matrix?: MatrixVerdict;
  /**
   * Set when the job is skipped because success() is false, that is because of a job upstream: where it started.
   * The headline then starts with `rootCause.line` (a note about an upstream matrix can follow it).
   */
  rootCause?: RootCauseSummary;
}

/**
 * A job where a skip started: a job upstream that did not succeed for a reason of its own. Every such job counts,
 * not only the first on a needs chain, because success() looks at every ancestor. condition: its own condition was
 * false (error: it could not be evaluated). failed, cancelled: it ran and ended that way. not-created: its matrix is
 * empty, so GitHub made no job and reports failure (fixture-matrix).
 */
export interface RootCause {
  job: string;
  kind: 'condition' | 'error' | 'failed' | 'cancelled' | 'not-created';
  /** kind condition: the sub-expression that decided it. */
  decisive?: Decisive;
  /** kind failed, for a matrix: the combinations that failed, under the names GitHub lists. */
  combinations?: string[];
  /**
   * The jobs between the skipped job and the root, its direct need first. A job that ran can be on the path:
   * success() looks at every job upstream, so always() on that job does not help the jobs after it (fixture-chain2).
   * So can a job with a cause of its own (`own`: skipped by its own condition, failed, cancelled): with always() or
   * failure() in its condition it was decided without looking at the root, which still skips the jobs after it.
   */
  via: Array<{ job: string; result: JobResult; own?: true }>;
}

export interface RootCauseSummary {
  /** Every root cause upstream, one per root job, in the order of `needs`. */
  causes: RootCause[];
  /**
   * The job's own condition without the success() GitHub puts in front of it, evaluated on its own. Undefined when
   * the job has no condition, or wrote a status function itself.
   */
  ownCondition?: { truthy: boolean; reason: string };
  /** The sentence in pieces; `code` marks job ids and expressions, which the page sets as code. */
  segments: Array<{ text: string; code?: boolean }>;
  /** The same sentence as text: "Skipped because test was skipped, because build's condition ... is false (...)." */
  line: string;
}

export interface MatrixVerdict {
  /** The strategy in one line, as written. */
  line: string;
  /** not-expanded: the job did not run. GitHub decides the job's if: first, so it stays one skipped job (skipped_matrix). */
  expansion: MatrixExpansion | { kind: 'not-expanded' };
  combinations: CombinationVerdict[];
}

export interface CombinationVerdict {
  combination: MatrixCombination;
  /** Key for SimulationInput.forcedResults: `<job id>.<configuration id>`, e.g. failfast._2. */
  key: string;
  outcome: 'runs' | 'fails' | 'cancelled';
  result: JobResult;
  headline: string;
  /** GitHub's annotation on a combination that fail-fast cancelled. */
  annotation?: string;
  stepVerdicts: StepVerdict[];
}

export interface StepVerdict {
  id: string;
  summary: string;
  if: string | undefined;
  evaluation: EvaluationResult | EvaluationFailure | undefined;
  problems: AvailabilityProblem[];
  /** Set when the condition reads something the simulation does not know (steps.*, env, hashFiles, a matrix it could not expand). */
  unknown?: string;
}

export interface SimulationInput {
  workflow: ParsedWorkflow;
  github: Json;
  inputs: Json;
  trigger: TriggerInput;
  /**
   * Simulated results for jobs that run (default success). A key `<job id>.<configuration id>` (see
   * CombinationVerdict.key) marks one matrix combination; a plain job id applies to every combination of that job.
   */
  forcedResults?: Record<string, JobResult>;
  cancelled?: boolean;
  vars?: Json;
  /**
   * Job outputs, job id -> output name -> the string the job writes. Only what the caller knows: a matrix that reads
   * an output missing here is reported as unknown instead of being guessed.
   */
  outputs?: Record<string, Record<string, string>>;
}

export interface Simulation {
  trigger: FilterDecision;
  triggerNotes: string[];
  fileProblems: string[];
  jobs: JobVerdict[];
  /** Jobs whose needs reference unknown jobs or form a cycle. */
  graphProblems: string[];
  /**
   * True when GitHub refuses the file (a parse error, an invalid on: block, a broken needs graph). Verified with
   * real runs: GitHub then creates a failed run named after the file path, with no jobs at all.
   */
  rejected: boolean;
  /**
   * What this simulation cannot fully decide for the jobs it shows, with what it does instead (see limits.ts).
   * Empty when there is nothing to say, when the file is rejected, and when the event does not start the workflow.
   */
  limits: Limit[];
}

export function simulate(input: SimulationInput): Simulation {
  const { workflow } = input;
  const trigger = decideTrigger(workflow, input.trigger);
  const triggerNotes: string[] = [];
  if (DEFAULT_BRANCH_ONLY.has(input.trigger.event)) triggerNotes.push(`${input.trigger.event} only triggers workflows whose file exists on the default branch.`);
  if (input.trigger.event === 'pull_request' && input.github['event'] && ((input.github['event'] as Json)['pull_request'] as Json | undefined)?.['head'] && (((((input.github['event'] as Json)['pull_request'] as Json)['head'] as Json)['repo'] as Json | undefined)?.['fork'])) {
    triggerNotes.push('Pull request from a fork: workflows run with a read-only GITHUB_TOKEN and no secrets unless the repository allows it.');
  }

  triggerNotes.push(...triggerWarnings(workflow));
  const fileProblems = [...workflow.errors, ...validateTriggers(workflow), ...workflow.jobs.flatMap(strategyFileProblems)];
  const declaredOutputs = Object.fromEntries(workflow.jobs.map((j) => [j.id, j.outputs ? Object.keys(j.outputs) : undefined]));
  const known = input.outputs ?? {};
  const { order, graphProblems } = topoOrder(workflow.jobs);
  const rejected = fileProblems.length > 0 || graphProblems.length > 0;
  const ancestorsOf = new Map<string, Set<string>>();

  const results = new Map<string, JobResult>();
  const verdicts = new Map<string, JobVerdict>();
  // For the root cause of a skip: why each job did not succeed on its own account, and the causes it inherited.
  const ownCauses = new Map<string, Omit<RootCause, 'via'> | undefined>();
  const inherited = new Map<string, RootCause[]>();
  for (const job of order) {
    const needsResults: Record<string, JobResult> = {};
    for (const n of job.needs) needsResults[n] = results.get(n) ?? 'skipped';
    const ancestors = new Set<string>();
    for (const n of job.needs) { ancestors.add(n); for (const a of ancestorsOf.get(n) ?? []) ancestors.add(a); }
    ancestorsOf.set(job.id, ancestors);
    const ancestorResults: Record<string, JobResult> = {};
    for (const a of ancestors) ancestorResults[a] = results.get(a) ?? 'skipped';
    // A job that did not run has no outputs; for the others, only what the caller told us.
    const needsCtx = Object.fromEntries(Object.entries(needsResults).map(([k, v]) => [k, { result: v, outputs: v === 'skipped' ? {} : { ...(known[k] ?? {}) } }]));
    const ancestorsCtx = Object.fromEntries(Object.entries(ancestorResults).map(([k, v]) => [k, { result: v }]));
    const problems = availabilityFor(job.if, 'jobs.<job_id>.if', needsResults);
    const evaluation = evaluateCondition(job.if, input.github, { needs: needsCtx, ancestors: ancestorsCtx, cancelled: input.cancelled, contexts: { inputs: input.inputs, vars: input.vars ?? {} } });
    let outcome: JobOutcome;
    let result: JobResult;
    let headline: string;
    if (rejected) {
      outcome = 'rejected';
      result = 'skipped';
      headline = 'Not run: GitHub rejects this workflow file, so the run fails before any job starts.';
    } else if (!trigger.matched) {
      outcome = 'blocked';
      result = 'skipped';
      headline = 'The workflow does not run for this event, so no job runs.';
    } else if (!evaluation.ok) {
      outcome = 'skipped';
      result = 'skipped';
      headline = evaluation.error;
    } else if (!evaluation.truthy) {
      outcome = 'skipped';
      result = 'skipped';
      headline = `Skipped: ${evaluation.reason}`;
    } else {
      const forced = input.forcedResults?.[job.id];
      result = forced ?? (input.cancelled ? 'cancelled' : 'success');
      outcome = result === 'failure' ? 'fails' : result === 'cancelled' ? 'cancelled' : 'runs';
      headline = forced === 'failure' ? `Runs, and you marked it as failing.` : forced === 'cancelled' ? 'Runs, then is cancelled (simulated).' : job.ifSource ? `Runs: ${evaluation.reason}` : 'Runs: no condition, and every job it needs succeeded.';
    }
    /**
     * Step-level status functions look at the job's own steps (verified by fixture-steps); every previous step is
     * assumed to have succeeded. Anything that reads steps.*, env or hashFiles is unknown here. A step that reads
     * matrix or strategy is decided per combination (fixture-matrix: "only linux 22", "only circles"), and is
     * unknown only when `matrixUnknown` says why the combinations are not known. In a job without a matrix, a step
     * that reads matrix stays unknown, as it was before matrices were simulated: no recorded run shows what GitHub
     * gives such a step.
     */
    const stepsFor = (perCombination: { matrix: Json; strategy: Json } | undefined, matrixUnknown?: string, matrixPattern = /\b(matrix|strategy)\b/): StepVerdict[] => job.steps.map((s) => {
      const unknownRef = s.if ? /\bsteps\.|\benv\.|\bhashFiles\s*\(/.exec(s.if) : null;
      const matrixRef = s.if && matrixUnknown ? matrixPattern.exec(s.if) : null;
      return {
        id: s.id,
        summary: s.summary,
        if: s.if,
        evaluation: s.if ? evaluateCondition(s.if, input.github, { needs: needsCtx, ancestors: ancestorsCtx, stepStatus: 'success', cancelled: input.cancelled, contexts: { inputs: input.inputs, vars: input.vars ?? {}, job: { status: 'success' }, runner: { os: 'Linux', arch: 'X64', name: 'GitHub Actions', temp: '/home/runner/work/_temp' }, ...(perCombination ?? {}) } }) : undefined,
        problems: s.if ? availabilityFor(s.if, 'jobs.<job_id>.steps.if', needsResults) : [],
        unknown: unknownRef ? `reads ${unknownRef[0].replace(/\s*\($/, '()')}, which the simulation does not know (step outputs, env and hashFiles are not simulated)`
          : matrixRef ? `reads ${matrixRef[1]}, which ${matrixUnknown}` : undefined,
      };
    });

    let stepVerdicts: StepVerdict[];
    let matrix: MatrixVerdict | undefined;
    const ran = outcome === 'runs' || outcome === 'fails' || outcome === 'cancelled';
    if (job.strategy && hasMatrix(job.strategy) && !ran) {
      matrix = { line: describeStrategy(job.strategy), expansion: { kind: 'not-expanded' }, combinations: [] };
      stepVerdicts = stepsFor(undefined, 'is not set: the job does not run, so its matrix is never expanded');
    } else if (job.strategy && hasMatrix(job.strategy)) {
      const expansion = expandMatrix(job, { github: input.github, inputs: input.inputs, vars: input.vars ?? {}, needs: needsCtx, declaredOutputs });
      const line = describeStrategy(job.strategy);
      const because = job.ifSource && evaluation.ok ? `Runs: ${evaluation.reason}.` : 'Runs: no condition, and every job it needs succeeded.';
      if (expansion.kind === 'combinations') {
        const { failFast } = expansion.settings;
        const total = expansion.combinations.length;
        const planned = expansion.combinations.map((c) => {
          const key = combinationKey(job.id, c);
          const forced = input.forcedResults?.[key] ?? input.forcedResults?.[job.id];
          return { c, key, forced, result: forced ?? (input.cancelled ? 'cancelled' : 'success') as JobResult };
        });
        // fail-fast: the first combination to fail cancels the others. GitHub cancels those still queued or running
        // at that moment; the recorded failfast (1) and (3) were, and this simulation assumes all of them are.
        const firstFailed = failFast ? planned.find((p) => p.result === 'failure') : undefined;
        const combinations: CombinationVerdict[] = planned.map((p, i) => {
          const cancelledByFailFast = firstFailed && p.result === 'success';
          const r: JobResult = cancelledByFailFast ? 'cancelled' : p.result;
          return {
            combination: p.c,
            key: p.key,
            outcome: r === 'failure' ? 'fails' : r === 'cancelled' ? 'cancelled' : 'runs',
            result: r,
            headline: cancelledByFailFast ? `Cancelled by fail-fast: ${firstFailed.c.name} failed. GitHub cancels the combinations still queued or running at that moment; this assumes they all were.`
              : p.forced === 'failure' ? 'Runs, and you marked it as failing.' : r === 'cancelled' ? 'Runs, then is cancelled (simulated).' : 'Runs.',
            annotation: cancelledByFailFast ? `The strategy configuration was canceled because "${firstFailed.key}" failed.` : undefined,
            stepVerdicts: stepsFor({ matrix: p.c.matrix, strategy: strategyContext(expansion.settings, i, total) }),
          };
        });
        // What needs.<id>.result says about the whole matrix (recorded: failfast and nofailfast both gave 'failure').
        result = combinations.some((c) => c.result === 'failure') ? 'failure' : combinations.some((c) => c.result === 'cancelled') ? 'cancelled' : 'success';
        outcome = result === 'failure' ? 'fails' : result === 'cancelled' ? 'cancelled' : 'runs';
        const failed = combinations.filter((c) => c.result === 'failure');
        const cancelledByFailFast = combinations.filter((c) => c.annotation);
        let summary = `The matrix makes ${total} job${total === 1 ? '' : 's'}`;
        if (failed.length) summary += `; ${failed.map((c) => c.combination.name).join(', ')} ${failed.length === 1 ? 'fails' : 'fail'}`;
        if (cancelledByFailFast.length) summary += `, and fail-fast cancels the other${cancelledByFailFast.length === 1 ? '' : ` ${cancelledByFailFast.length}`}`;
        else if (failed.length && !failFast && failed.length < total) summary += '; fail-fast is off, so the others run to the end';
        summary += '.';
        if (result !== 'success') summary += ` Jobs that need ${job.id} see ${result}.`;
        headline = `${because} ${summary}`;
        matrix = { line, expansion, combinations };
        stepVerdicts = stepsFor(undefined, 'differs per combination; see each one');
      } else if (expansion.kind === 'empty' || expansion.kind === 'error') {
        outcome = 'not-created';
        result = 'failure';
        const from = readsText(expansion.reads);
        headline = expansion.kind === 'empty' && expansion.recorded
          ? `No job created: the matrix is empty (${expansion.reason}${from}). GitHub creates no job for it, neither failed nor skipped; the run's job list does not show it and no annotation says why. Jobs that need ${job.id} see needs.${job.id}.result == 'failure'.`
          : expansion.kind === 'empty'
            ? `No job created (assumed): ${expansion.reason}${from}. GitHub's parser does not treat this as an error and no recorded run covers it, so this assumes GitHub does what it does with an empty list: no job, and failure for the jobs that need ${job.id}.`
            : `No job created: GitHub cannot build this matrix: ${expansion.reason}${from}. Jobs that need ${job.id} see failure. (Not recorded: GitHub's parser fails an empty matrix in the same place, and that one was recorded.)`;
        matrix = { line, expansion, combinations: [] };
        stepVerdicts = [];
      } else if (expansion.kind === 'unknown') {
        const names = expansion.reads.filter((r) => r.source === 'unknown').map((r) => `needs.${r.job}.outputs.${r.output}`);
        headline = `${headline} Which jobs the matrix makes is unknown: ${expansion.reason}. Give ${names.length === 1 ? 'its value' : 'their values'} to expand it. If ${names.length === 1 ? 'it is' : 'they are'} empty, GitHub creates no job for ${job.id} at all and jobs that need it see failure.`;
        matrix = { line, expansion, combinations: [] };
        stepVerdicts = stepsFor(undefined, `is unknown until ${names.join(' and ')} ${names.length === 1 ? 'is' : 'are'} given`);
      } else {
        stepVerdicts = stepsFor(undefined, NO_MATRIX, /\b(matrix)\./);
      }
    } else {
      stepVerdicts = stepsFor(undefined, NO_MATRIX, /\b(matrix)\./);
    }
    // A job skipped by success() is skipped because of something upstream; GitHub only says "skipped". Follow the
    // needs chain to the job where it started and name that job's own reason. A cancelled run explains itself.
    const causes = input.cancelled ? [] : causesThrough(job.needs, verdicts, ownCauses, inherited);
    inherited.set(job.id, causes);
    const byUpstream = outcome === 'skipped' && evaluation.ok && !evaluation.truthy && evaluation.decisive.status === 'success' && causes.length > 0;
    ownCauses.set(job.id, byUpstream ? undefined : ownCause(job.id, outcome, evaluation, matrix));
    let rootCause: RootCauseSummary | undefined;
    if (byUpstream) {
      // The condition as written, without the success() the parser put in front of it: would it stop the job too?
      const inner = /^success\(\) && \((.*)\)$/s.exec(job.if)?.[1];
      const wrapped = inner !== undefined && job.ifSource !== undefined && !/\b(success|failure|cancelled|always)\s*\(/i.test(job.ifSource);
      const own = wrapped ? evaluateCondition(inner, input.github, { needs: needsCtx, ancestors: ancestorsCtx, cancelled: input.cancelled, contexts: { inputs: input.inputs, vars: input.vars ?? {} } }) : undefined;
      rootCause = summarize(causes, own && own.ok ? { truthy: own.truthy, reason: own.reason } : undefined);
      headline = rootCause.line;
    }
    // The status functions saw a failure where the file shows no failing job: say where it came from. And when an
    // upstream matrix is unknown, this job's verdict rests on it making at least one job.
    if (outcome !== 'rejected' && outcome !== 'blocked') {
      const upstream = [...ancestors].map((a) => verdicts.get(a)).filter((v): v is JobVerdict => !!v);
      const named = new Set(rootCause?.causes.map((c) => c.job));
      const empty = upstream.filter((v) => v.outcome === 'not-created' && !named.has(v.job.id)).map((v) => v.job.id);
      const unknown = upstream.filter((v) => v.matrix?.expansion.kind === 'unknown').map((v) => v.job.id);
      const sentence = (s: string) => (/[.)]$/.test(s) ? s : `${s}.`);
      if (empty.length) headline = `${sentence(headline)} ${empty.join(' and ')} ${empty.length === 1 ? 'counts as failed: its matrix makes' : 'count as failed: their matrices make'} no job, and GitHub reports that as failure.`;
      if (unknown.length) headline = `${sentence(headline)} This assumes the matrix of ${unknown.join(' and ')} makes at least one job; if it comes out empty, GitHub creates none and reports failure for it.`;
    }
    results.set(job.id, result);
    verdicts.set(job.id, { job, outcome, result, evaluation, headline, needsResults, ancestorResults, problems, stepVerdicts, ...(matrix ? { matrix } : {}), ...(rootCause ? { rootCause } : {}) });
  }
  const jobs = order.map((j) => verdicts.get(j.id)!);
  const limits = rejected || !trigger.matched ? [] : findLimits(workflow, jobs, { outputs: known, vars: input.vars ?? {} });
  return { trigger, triggerNotes, fileProblems, jobs, graphProblems, rejected, limits };
}

// ---------- the root cause of a skip ----------

/** Why a job did not succeed on its own account; undefined when it succeeded or was skipped because of upstream. */
function ownCause(job: string, outcome: JobOutcome, evaluation: EvaluationResult | EvaluationFailure, matrix: MatrixVerdict | undefined): Omit<RootCause, 'via'> | undefined {
  if (outcome === 'not-created') return { job, kind: 'not-created' };
  if (outcome === 'cancelled') return { job, kind: 'cancelled' };
  if (outcome === 'fails') {
    const failed = matrix?.combinations.filter((c) => c.result === 'failure').map((c) => c.combination.name) ?? [];
    return { job, kind: 'failed', ...(failed.length ? { combinations: failed } : {}) };
  }
  if (outcome !== 'skipped') return undefined;
  return evaluation.ok ? { job, kind: 'condition', decisive: evaluation.decisive } : { job, kind: 'error' };
}

/**
 * The root causes behind a job's needs, in the order of `needs`: a need that did not succeed on its own account is
 * one; a need skipped because of upstream passes on its causes; so does a need that ran, because success() looks at
 * every ancestor (fixture-chain, fixture-chain2). A need with a cause of its own passes on the causes behind it as
 * well: a job that failed after always(), or was skipped by `always() && x`, has jobs upstream that did not succeed
 * either, and fixing its own cause would still leave the job after it skipped. One entry per root job.
 */
function causesThrough(needs: string[], verdicts: Map<string, JobVerdict>, own: Map<string, Omit<RootCause, 'via'> | undefined>, inherited: Map<string, RootCause[]>): RootCause[] {
  const out: RootCause[] = [];
  const seen = new Set<string>();
  for (const n of needs) {
    const v = verdicts.get(n);
    if (!v) continue;
    const mine = v.result !== 'success' ? own.get(n) : undefined;
    const behind = (inherited.get(n) ?? []).map((c) => ({ ...c, via: [{ job: n, result: v.result, ...(mine ? { own: true as const } : {}) }, ...c.via] }));
    const list: RootCause[] = mine ? [{ ...mine, via: [] }, ...behind] : behind;
    for (const c of list) if (!seen.has(c.job)) { seen.add(c.job); out.push(c); }
  }
  return out;
}

type Segment = { text: string; code?: boolean };
const code = (text: string): Segment => ({ text, code: true });

/** `build's condition github.ref_type == 'branch' is false (github.ref_type is "tag")` */
function rootSegments(c: RootCause): Segment[] {
  switch (c.kind) {
    case 'condition': {
      const d = c.decisive!;
      const detail = [d.sides.join(', '), d.hint ?? ''].filter(Boolean).join('; ');
      return [code(c.job), { text: "'s condition " }, code(d.text), { text: ` is ${d.value}${detail ? ` (${detail})` : ''}` }];
    }
    case 'error': return [code(c.job), { text: "'s condition could not be evaluated" }];
    case 'failed': return c.combinations?.length ? [...listed(c.combinations.map(code)), { text: ' failed' }] : [code(c.job), { text: ' failed' }];
    case 'cancelled': return [code(c.job), { text: ' was cancelled' }];
    case 'not-created': return [code(c.job), { text: "'s matrix makes no job, which GitHub reports as failure" }];
  }
}

/**
 * `test was skipped, because build's condition ...`. A job on the path that did not pass the skip on (it ran, or it has
 * a cause of its own, named separately) is `upstream of y (which ran)` or `upstream of y`; of several such jobs in a
 * row, the first is named.
 */
function chainSegments(c: RootCause): Segment[] {
  const out: Segment[] = [];
  const passedOn = (hop: RootCause['via'][number]) => hop.result === 'skipped' && !hop.own;
  for (let i = 0; i < c.via.length; i++) {
    const hop = c.via[i]!;
    if (passedOn(hop)) {
      out.push(code(hop.job), { text: ' was skipped, because ' });
    } else {
      out.push({ text: 'upstream of ' }, code(hop.job), { text: hop.result === 'success' ? ' (which ran), ' : ', ' });
      while (c.via[i + 1] && !passedOn(c.via[i + 1]!)) i++;
    }
  }
  return [...out, ...rootSegments(c)];
}

/** a, b and c */
function listed(items: Segment[]): Segment[] {
  return items.flatMap((s, i) => (i === 0 ? [s] : [{ text: i === items.length - 1 ? ' and ' : ', ' }, s]));
}

/** The headline of a job skipped because of upstream: at most two root causes, then how many more and which. */
function summarize(causes: RootCause[], ownCondition: RootCauseSummary['ownCondition']): RootCauseSummary {
  const shown = causes.slice(0, 2);
  const rest = causes.slice(2);
  const segments: Segment[] = [{ text: 'Skipped because ' }];
  shown.forEach((c, i) => segments.push(...(i ? [{ text: '; and because ' }] : []), ...chainSegments(c)));
  if (rest.length) segments.push({ text: `; and ${rest.length} more: ` }, ...listed(rest.map((c) => code(c.job))));
  segments.push({ text: '.' });
  if (shown.some((c) => c.via.some((h) => h.result !== 'skipped' || h.own))) segments.push({ text: ' success() looks at every job upstream, not only the ones in needs.' });
  if (ownCondition) segments.push({ text: ownCondition.truthy ? ' Its own condition is true for this event.' : ` Its own condition is false too: ${ownCondition.reason}.` });
  // Adjacent plain pieces are merged, so the page makes as few text nodes as the sentence needs.
  const merged: Segment[] = [];
  for (const s of segments) {
    const last = merged[merged.length - 1];
    if (last && !last.code && !s.code) last.text += s.text;
    else merged.push({ ...s });
  }
  return { causes, ...(ownCondition ? { ownCondition } : {}), segments: merged, line: merged.map((s) => s.text).join('') };
}

const NO_MATRIX = 'the simulation does not know in a job without a matrix';

/** `; needs.plan.outputs.none is "[]"`: the job outputs an expansion read, for its headline. */
function readsText(reads: OutputRead[]): string {
  const shown = reads.filter((r) => r.source !== 'unknown').map((r) => {
    const why = r.source === 'skipped' ? `${r.job} was skipped` : r.source === 'undeclared' ? `${r.job} declares no such output` : `${r.job} is not in needs`;
    return `needs.${r.job}.outputs.${r.output} is ${typeof r.value === 'string' ? `'${r.value}'` : `empty because ${why}`}`;
  });
  return shown.length ? `; ${shown.join(', ')}` : '';
}

function availabilityFor(expression: string, key: 'jobs.<job_id>.if' | 'jobs.<job_id>.steps.if', needs: Record<string, JobResult>): AvailabilityProblem[] {
  try {
    const ast = parseExpression(expression, statusFunctions({ needs: Object.fromEntries(Object.entries(needs).map(([k, v]) => [k, { result: v }])) }));
    return checkAvailability(ast, key);
  } catch {
    return [];
  }
}

/** Dependency order (Kahn); jobs with unknown or cyclic needs are appended last and reported. */
export function topoOrder(jobs: ParsedJob[]): { order: ParsedJob[]; graphProblems: string[] } {
  const byId = new Map(jobs.map((j) => [j.id, j]));
  const problems: string[] = [];
  const indeg = new Map<string, number>();
  const dependents = new Map<string, string[]>();
  for (const j of jobs) {
    indeg.set(j.id, 0);
  }
  for (const j of jobs) {
    for (const n of j.needs) {
      if (!byId.has(n)) { problems.push(`${j.id} needs "${n}", which is not a job in this workflow.`); continue; }
      indeg.set(j.id, (indeg.get(j.id) ?? 0) + 1);
      dependents.set(n, [...(dependents.get(n) ?? []), j.id]);
    }
  }
  const queue = jobs.filter((j) => (indeg.get(j.id) ?? 0) === 0).map((j) => j.id);
  const order: ParsedJob[] = [];
  const seen = new Set<string>();
  while (queue.length) {
    const id = queue.shift()!;
    if (seen.has(id)) continue;
    seen.add(id);
    order.push(byId.get(id)!);
    for (const d of dependents.get(id) ?? []) {
      indeg.set(d, (indeg.get(d) ?? 1) - 1);
      if ((indeg.get(d) ?? 0) === 0) queue.push(d);
    }
  }
  for (const j of jobs) if (!seen.has(j.id)) { order.push(j); problems.push(`${j.id} is part of a dependency cycle or depends on a missing job.`); }
  return { order, graphProblems: problems };
}
