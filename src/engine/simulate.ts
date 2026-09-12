/**
 * One call that does what GitHub does when an event arrives: decide whether the workflow triggers,
 * check the file for things GitHub would reject, then walk the job graph in dependency order and
 * evaluate every job's condition with the results of the jobs it needs.
 */
import type { ParsedWorkflow, ParsedJob } from './workflow.js';
import { decideTrigger, validateTriggers, triggerWarnings, DEFAULT_BRANCH_ONLY, type FilterDecision, type TriggerInput } from './filters.js';
import { evaluateCondition, parseExpression, statusFunctions, type EvaluationResult, type EvaluationFailure, type JobResult } from './evaluate.js';
import { checkAvailability, type AvailabilityProblem } from './availability.js';
import type { Json } from './context.js';

/** 'blocked': the event does not start the workflow. 'rejected': GitHub refuses the file, so no job exists. */
export type JobOutcome = 'runs' | 'skipped' | 'fails' | 'cancelled' | 'blocked' | 'rejected';

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
  stepVerdicts: StepVerdict[];
}

export interface StepVerdict {
  id: string;
  summary: string;
  if: string | undefined;
  evaluation: EvaluationResult | EvaluationFailure | undefined;
  problems: AvailabilityProblem[];
  /** Set when the condition reads something the simulation does not know (steps.*, env, matrix, hashFiles). */
  unknown?: string;
}

export interface SimulationInput {
  workflow: ParsedWorkflow;
  github: Json;
  inputs: Json;
  trigger: TriggerInput;
  /** Simulated results for jobs that run (default success). */
  forcedResults?: Record<string, JobResult>;
  cancelled?: boolean;
  vars?: Json;
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
  const fileProblems = [...workflow.errors, ...validateTriggers(workflow)];
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
    const needsCtx = Object.fromEntries(Object.entries(needsResults).map(([k, v]) => [k, { result: v }]));
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
    results.set(job.id, result);
    const stepVerdicts: StepVerdict[] = job.steps.map((s) => {
      // Step-level status functions look at the job's own steps (verified by fixture-steps); every previous step is
      // assumed to have succeeded. Anything that reads steps.*, env, matrix or hashFiles is unknown here.
      const unknownRef = s.if ? /\bsteps\.|\benv\.|\bmatrix\.|\bhashFiles\s*\(/.exec(s.if) : null;
      return {
        id: s.id,
        summary: s.summary,
        if: s.if,
        evaluation: s.if ? evaluateCondition(s.if, input.github, { needs: needsCtx, ancestors: ancestorsCtx, stepStatus: 'success', cancelled: input.cancelled, contexts: { inputs: input.inputs, vars: input.vars ?? {}, job: { status: 'success' }, runner: { os: 'Linux', arch: 'X64', name: 'GitHub Actions', temp: '/home/runner/work/_temp' } } }) : undefined,
        problems: s.if ? availabilityFor(s.if, 'jobs.<job_id>.steps.if', needsResults) : [],
        unknown: unknownRef ? `reads ${unknownRef[0].replace(/\s*\($/, '()')}, which the simulation does not know (step outputs, env, matrix and hashFiles are not simulated)` : undefined,
      };
    });
    verdicts.set(job.id, { job, outcome, result, evaluation, headline, needsResults, ancestorResults, problems, stepVerdicts });
  }
  return { trigger, triggerNotes, fileProblems, jobs: order.map((j) => verdicts.get(j.id)!), graphProblems, rejected };
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
