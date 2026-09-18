/**
 * One call that does what GitHub does when an event arrives: decide whether the workflow triggers,
 * check the file for things GitHub would reject, then walk the job graph in dependency order and
 * evaluate every job's condition with the results of the jobs it needs.
 */
import type { ParsedWorkflow, ParsedJob } from './workflow.js';
import { decideTrigger, validateTriggers, triggerWarnings, DEFAULT_BRANCH_ONLY, type FilterDecision, type TriggerInput } from './filters.js';
import { evaluateCondition, parseExpression, statusFunctions, type EvaluationResult, type EvaluationFailure, type JobResult } from './evaluate.js';
import { checkAvailability, type AvailabilityProblem } from './availability.js';
import { expandMatrix, hasMatrix, describeStrategy, strategyFileProblems, strategyContext, combinationKey, type MatrixExpansion, type MatrixCombination, type OutputRead } from './matrix.js';
import type { Json } from './context.js';

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
    // The status functions saw a failure where the file shows no failing job: say where it came from. And when an
    // upstream matrix is unknown, this job's verdict rests on it making at least one job.
    if (outcome !== 'rejected' && outcome !== 'blocked') {
      const upstream = [...ancestors].map((a) => verdicts.get(a)).filter((v): v is JobVerdict => !!v);
      const empty = upstream.filter((v) => v.outcome === 'not-created').map((v) => v.job.id);
      const unknown = upstream.filter((v) => v.matrix?.expansion.kind === 'unknown').map((v) => v.job.id);
      const sentence = (s: string) => (/[.)]$/.test(s) ? s : `${s}.`);
      if (empty.length) headline = `${sentence(headline)} ${empty.join(' and ')} ${empty.length === 1 ? 'counts as failed: its matrix makes' : 'count as failed: their matrices make'} no job, and GitHub reports that as failure.`;
      if (unknown.length) headline = `${sentence(headline)} This assumes the matrix of ${unknown.join(' and ')} makes at least one job; if it comes out empty, GitHub creates none and reports failure for it.`;
    }
    results.set(job.id, result);
    verdicts.set(job.id, { job, outcome, result, evaluation, headline, needsResults, ancestorResults, problems, stepVerdicts, ...(matrix ? { matrix } : {}) });
  }
  return { trigger, triggerNotes, fileProblems, jobs: order.map((j) => verdicts.get(j.id)!), graphProblems, rejected };
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
