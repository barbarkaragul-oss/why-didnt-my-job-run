#!/usr/bin/env node
/**
 * The simulator on the command line. Run inside a git repository: it reads the workflows from
 * .github/workflows, takes the branch, the commit and the changed files from git, builds the same
 * event context the page builds, and prints for every workflow whether the event starts it and,
 * per job, the verdict the page would show with the sub-expression that decided it.
 *
 * The page cannot know which files a push changed (GitHub strips the file lists from the payload it
 * hands to Actions, so there you type them); git knows, so here they are read. Everything GitHub only
 * learns at run time (secrets, job outputs, how a step ends) is still unknown and defaults the way it
 * does on the page, unless a flag supplies it.
 *
 *   npx tsx src/cli.ts --event push
 *   node dist/cli.js --event pull_request --base origin/main --expect-run test
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, realpathSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { parseWorkflowFile, type ParsedJob } from './engine/workflow.js';
import { simulate, type Simulation, type JobVerdict, type JobOutcome, type StepVerdict, type MatrixVerdict, type CombinationVerdict, type RootCause } from './engine/simulate.js';
import type { Limit } from './engine/limits.js';
import { outputExample, type OutputRead } from './engine/matrix.js';
import type { JobResult } from './engine/evaluate.js';
import type { Json } from './engine/context.js';
import { DEFAULT_STATE, PR_EVENTS, defaultAction, toEngineInputs, type ScenarioState } from './ui/scenario.js';
import { PAYLOADS, EVENT_ORDER } from './ui/payloads.js';

export const USAGE = `why-didnt-my-job-run: which of this repository's GitHub Actions jobs would run, and why

Run it inside a git repository. It reads .github/workflows/*.yml and *.yaml from the working tree
(uncommitted edits included), takes the branch, the commit and the changed files from git, and
prints per workflow whether the event starts it, then per job: runs, skipped, fails, cancelled,
blocked (the workflow does not start) or rejected (GitHub refuses the file).

Usage: why-didnt-my-job-run [options]

Event
  --event <name>          push (default), pull_request, pull_request_target, workflow_dispatch,
                          schedule, release, issues, ... (every event the page offers)
  --action <type>         activity type, e.g. opened, labeled, synchronize (default: the page's)
  --branch <name>         the branch GitHub sees: the pushed branch, the pull request's head branch,
                          the branch picked for workflow_dispatch (default: the current branch;
                          for schedule, issues and similar events, the default branch)
  --tag <name>            a tag push (with --event push), or the release's tag
  --base <ref>            push: the commit before the push (default: the head's first parent)
                          pull_request: the branch it targets (default: origin/HEAD)
  --head <ref>            the pushed commit, or the pull request's head (default: HEAD)
  --label <name>          a label on the pull request or issue (repeatable)
  --fork, --draft         the pull request comes from a fork / is a draft
  --actor <login>         github.actor (default: octocat)

Things git cannot know
  --input <key=value>     a workflow_dispatch input (repeatable)
  --output <job.key=value>
                          an output of a job, read by needs.<job>.outputs.<key> (repeatable)
  --var <NAME=value>      a configuration variable, read by vars.NAME (repeatable)
  --fail <job>            that job fails (repeatable). For one job of a matrix, name it as GitHub
                          lists it, "test (linux, 20)", or as test:linux,20

Overrides (normally read from git)
  --sha <sha>             github.sha (default: the head commit)
  --repo <owner/name>     github.repository (default: from the origin remote's URL)
  --default-branch <name> the repository's default branch (default: origin/HEAD)

Output
  --workflow <file>       only this workflow (a path, or a file name in .github/workflows; repeatable)
  --json                  machine-readable output
  --expect-run <job>      exit with 1 unless that job (or matrix combination, named as for --fail)
                          runs; a job you marked with --fail counts, since it starts (repeatable)
  -h, --help              this text

Exit codes: 0 done, and every --expect-run job runs; 1 an --expect-run job does not run;
2 the simulation could not be done (not a git repository, unknown flag, unknown job, ...).`;

const OPTIONS = {
  event: { type: 'string' },
  action: { type: 'string' },
  branch: { type: 'string' },
  tag: { type: 'string' },
  base: { type: 'string' },
  head: { type: 'string' },
  label: { type: 'string', multiple: true },
  fork: { type: 'boolean' },
  draft: { type: 'boolean' },
  actor: { type: 'string' },
  input: { type: 'string', multiple: true },
  output: { type: 'string', multiple: true },
  var: { type: 'string', multiple: true },
  fail: { type: 'string', multiple: true },
  sha: { type: 'string' },
  repo: { type: 'string' },
  'default-branch': { type: 'string' },
  workflow: { type: 'string', multiple: true },
  json: { type: 'boolean' },
  'expect-run': { type: 'string', multiple: true },
  help: { type: 'boolean', short: 'h' },
} as const;

/** Events that run on a branch the user chooses or pushes; every other event runs on the default branch. */
const CURRENT_BRANCH_EVENTS = new Set(['push', 'workflow_dispatch', 'workflow_run', 'create', 'delete']);
/** Docs, "Git diff comparisons": a diff longer than this is cut, and files past it are not matched. */
const GITHUB_DIFF_LIMIT = 300;

export interface CliIo {
  cwd: string;
  out: (text: string) => void;
  err: (text: string) => void;
}

class UsageError extends Error {}

/** Where each value in the context came from, so the output can say what is real and what is a default. */
type Source = 'git' | 'flag' | 'default';

export interface RepoFacts {
  root: string;
  event: string;
  action: string | undefined;
  refType: 'branch' | 'tag';
  /** The pushed branch, the branch picked for a dispatch, or a pull request's head branch. */
  branch: string;
  tag: string | undefined;
  /** Pull requests: the branch the pull request targets. */
  baseBranch: string | undefined;
  sha: string;
  /** push: the commit before the push; pull_request: the tip of the base branch. */
  baseSha: string | undefined;
  /** pull_request: where the head branch left the base branch; GitHub diffs from here. */
  mergeBase: string | undefined;
  /** How the changed files were computed, e.g. "git diff 1a2b3c4..5d6e7f8". */
  diff: string | undefined;
  /** Undefined for events that have no paths filters. */
  changedFiles: string[] | undefined;
  message: string | undefined;
  repository: string;
  defaultBranch: string;
  sources: Record<'branch' | 'sha' | 'changedFiles' | 'repository' | 'defaultBranch', Source>;
  notes: string[];
}

export interface CliStep {
  id: string;
  summary: string;
  if: string | undefined;
  verdict: 'runs' | 'skipped' | 'unknown';
  reason: string | undefined;
}

export interface CliJob {
  id: string;
  name: string | undefined;
  outcome: JobOutcome;
  /** The result the jobs that need this one see in needs.<id>.result. */
  result: JobResult;
  /** The condition as written, or undefined when the job has none. */
  if: string | undefined;
  /** The condition as GitHub evaluates it, with the implicit success() wrapper. */
  evaluatedAs: string;
  headline: string;
  /** The decisive sub-expression with its values, or the evaluation error. */
  reason: string | undefined;
  needs: Record<string, JobResult>;
  problems: string[];
  /** Steps of a job that runs; a matrix job lists them per combination instead. */
  steps: CliStep[];
  /** Set when the job has a matrix; `outcome` is then the whole matrix's, as the jobs that need it see it. */
  matrix?: CliMatrix;
  /** Set when the job is skipped because of a job upstream: where the skip started. The headline starts with `line`. */
  rootCause?: { line: string; causes: RootCause[]; ownCondition?: { truthy: boolean; reason: string } };
}

export interface CliMatrix {
  /** The strategy in one line, as written. */
  strategy: string;
  /** combinations, or why there are none: empty (GitHub creates no job), unknown (reads a job output nobody gave), error, not-expanded (the job does not run). */
  expansion: string;
  reason: string | undefined;
  /** Every needs.<job>.outputs.<name> the matrix reads, with the value it saw and where that came from. */
  reads: OutputRead[];
  /** --output flags that would let an unknown matrix expand. */
  missingOutputs: string[];
  combinations: CliCombination[];
}

export interface CliCombination {
  /** The name GitHub lists the job under, e.g. "plain (linux, 20)". */
  name: string;
  id: string;
  /** What --fail takes for this one combination, and the name GitHub's fail-fast annotation uses. */
  key: string;
  matrix: Json;
  origin: 'product' | 'include';
  outcome: 'runs' | 'fails' | 'cancelled';
  result: JobResult;
  headline: string;
  annotation: string | undefined;
  steps: CliStep[];
}

export interface CliWorkflow {
  file: string;
  name: string | undefined;
  triggers: boolean;
  triggerReasons: string[];
  triggerNotes: string[];
  rejected: boolean;
  fileProblems: string[];
  notes: string[];
  /** What the simulation cannot fully decide in this workflow, as the page lists it above the results. */
  limits: Limit[];
  jobs: CliJob[];
}

export interface CliExpectation {
  job: string;
  runs: boolean;
  /** Where the job was found and what happened to it there. */
  found: Array<{ file: string; outcome: JobOutcome }>;
}

export interface CliReport {
  event: string;
  action: string | undefined;
  ref: string;
  facts: RepoFacts;
  workflows: CliWorkflow[];
  expectations: CliExpectation[];
}

/**
 * Runs the command with these arguments and returns the exit code. Output goes through `io`, so tests
 * can call it with a temporary repository as `cwd` and read what it printed.
 */
export async function main(argv: string[], io: Partial<CliIo> = {}): Promise<number> {
  const out = io.out ?? ((s: string) => { process.stdout.write(s + '\n'); });
  const err = io.err ?? ((s: string) => { process.stderr.write(s + '\n'); });
  const cwd = io.cwd ?? process.cwd();
  let values: ReturnType<typeof parse>;
  try {
    values = parse(argv);
  } catch (e) {
    err(`why-didnt-my-job-run: ${(e as Error).message}\nRun with --help for the options.`);
    return 2;
  }
  if (values.help) { out(USAGE); return 0; }
  try {
    const report = await buildReport(values, cwd);
    out(values.json ? JSON.stringify(report, null, 2) : formatReport(report));
    return report.expectations.every((x) => x.runs) ? 0 : 1;
  } catch (e) {
    if (e instanceof UsageError) { err(`why-didnt-my-job-run: ${e.message}`); return 2; }
    throw e;
  }
}

function parse(argv: string[]) {
  return parseArgs({ args: argv, options: OPTIONS, strict: true, allowPositionals: false }).values;
}

type Values = ReturnType<typeof parse>;

export async function buildReport(values: Values, cwd: string): Promise<CliReport> {
  const event = values.event ?? 'push';
  if (!EVENT_ORDER.includes(event)) throw new UsageError(`--event ${event} is not an event the simulator knows. Known: ${EVENT_ORDER.join(', ')}.`);
  const actions = PAYLOADS[event]?.actions ?? [];
  if (values.action !== undefined && !actions.includes(values.action)) {
    throw new UsageError(actions.length ? `--action ${values.action} is not an activity type of ${event}. Known: ${actions.join(', ')}.` : `${event} has no activity types, so --action does not apply.`);
  }
  const action = values.action ?? (defaultAction(event) || undefined);
  const inputs = pairs(values.input ?? [], '--input', '=');
  const vars = pairs(values.var ?? [], '--var', '=');
  const outputs = jobOutputs(values.output ?? []);
  const failing = values.fail ?? [];
  const expected = values['expect-run'] ?? [];

  const facts = readRepository(values, cwd, event, action);
  const files = workflowFiles(facts.root, cwd, values.workflow);
  if (!files.length) throw new UsageError(`no workflow files in ${path.join(facts.root, '.github', 'workflows')}.`);

  const workflows: CliWorkflow[] = [];
  const sims: Array<{ file: string; sim: Simulation }> = [];
  const allJobs = new Set<string>();
  const failsFound = new Set<string>();
  const expectFound = new Map<string, CliExpectation['found']>(expected.map((e) => [e, []]));
  let ref = '';
  for (const file of files) {
    const rel = path.relative(facts.root, file).split(path.sep).join('/');
    const wf = await parseWorkflowFile(readFileSync(file, 'utf8'), rel);
    const ids = new Set(wf.jobs.map((j) => j.id));
    for (const id of ids) allJobs.add(id);
    const state: ScenarioState = {
      ...DEFAULT_STATE,
      event,
      action: action ?? '',
      refType: facts.refType,
      branch: facts.branch,
      tag: facts.tag ?? DEFAULT_STATE.tag,
      headBranch: facts.branch,
      baseBranch: facts.baseBranch ?? facts.defaultBranch,
      fork: Boolean(values.fork),
      draft: Boolean(values.draft),
      labels: (values.label ?? []).join('\n'),
      actor: values.actor ?? DEFAULT_STATE.actor,
      repository: facts.repository,
      defaultBranch: facts.defaultBranch,
      changedFiles: (facts.changedFiles ?? []).join('\n'),
      commitMessage: facts.message ?? DEFAULT_STATE.commitMessage,
      inputs,
      forcedResults: {},
      cancelled: false,
    };
    const engine = toEngineInputs(state, wf);
    // parseFiles() splits the page's text box on commas too; git's list is exact, so it goes in unsplit.
    engine.trigger.changedFiles = facts.changedFiles ?? [];
    patchFromGit(engine.github, facts, wf.name ?? rel, rel);
    ref = String(engine.github['ref'] ?? '');
    const notes: string[] = [];
    const declared = Object.keys(((wf.events as Record<string, unknown>)['workflow_dispatch'] as { inputs?: Record<string, unknown> } | null | undefined)?.inputs ?? {});
    if (event === 'workflow_dispatch') for (const k of Object.keys(inputs)) if (!declared.includes(k)) notes.push(`--input ${k}: this workflow declares no such input, so it is ignored.`);
    // A job id marks the whole job (every combination of a matrix). Anything else names one combination, and which
    // combinations exist is known only after a simulation, so those are looked up in a first pass.
    const forcedResults: Record<string, JobResult> = {};
    for (const f of failing) if (ids.has(f)) { forcedResults[f] = 'failure'; failsFound.add(f); }
    const run = () => simulate({ workflow: wf, github: engine.github, inputs: engine.inputs, trigger: engine.trigger, forcedResults, vars, outputs });
    let sim = run();
    const oneCombination = failing.filter((f) => !ids.has(f));
    if (oneCombination.length) {
      for (const f of oneCombination) {
        const c = findCombination(sim, f);
        if (c) { forcedResults[c.key] = 'failure'; failsFound.add(f); }
      }
      sim = run();
    }
    for (const e of expected) {
      const job = ids.has(e) ? sim.jobs.find((j) => j.job.id === e) : undefined;
      const c = job ? undefined : findCombination(sim, e);
      if (job || c) expectFound.get(e)!.push({ file: rel, outcome: (job ?? c)!.outcome });
    }
    sims.push({ file: rel, sim });
    workflows.push(toCliWorkflow(rel, wf.name, sim, notes, wf.jobs));
  }

  const where = files.length === 1 ? 'this workflow' : 'these workflows';
  for (const f of failing) if (!failsFound.has(f)) throw new UsageError(`--fail ${f}: ${missing(f, sims, allJobs, where)}`);
  for (const job of Object.keys(outputs)) if (!allJobs.has(job)) throw new UsageError(`--output ${job}.*: no job with that id in ${where}.`);
  const expectations: CliExpectation[] = [];
  for (const e of expected) {
    const found = expectFound.get(e)!;
    if (!found.length) throw new UsageError(`--expect-run ${e}: ${missing(e, sims, allJobs, where)}`);
    expectations.push({ job: e, runs: found.some((f) => ranOutcome(f.outcome)), found });
  }
  return { event, action, ref, facts, workflows, expectations };
}

const normalized = (s: string) => s.toLowerCase().replace(/\s+/g, '');

/**
 * One matrix combination, named the way people copy it: job:values ("plain:linux, 20", the values GitHub shows in
 * brackets), job:id ("failfast:_2"), the name GitHub lists ("plain (linux, 20)"), or the key from GitHub's fail-fast
 * annotation ("failfast._2"). Whitespace and case do not matter.
 */
function findCombination(sim: Simulation, ref: string): CombinationVerdict | undefined {
  const i = ref.indexOf(':');
  const jobs = i < 0 ? sim.jobs : sim.jobs.filter((j) => j.job.id === ref.slice(0, i));
  const wanted = normalized(i < 0 ? ref : ref.slice(i + 1));
  for (const v of jobs) {
    for (const c of v.matrix?.combinations ?? []) {
      const values = /\(([^()]*)\)$/.exec(c.combination.name)?.[1] ?? '';
      const names = i < 0 ? [c.combination.name, c.key] : [values, c.combination.id, c.combination.name];
      if (names.some((n) => normalized(n) === wanted)) return c;
    }
  }
  return undefined;
}

/** Why a --fail or --expect-run reference matched nothing, with what would have matched. */
function missing(ref: string, sims: Array<{ sim: Simulation }>, allJobs: Set<string>, where: string): string {
  const i = ref.indexOf(':');
  const job = i < 0 ? undefined : ref.slice(0, i);
  if (job === undefined || !allJobs.has(job)) return `no job or matrix combination with that name in ${where}.`;
  const verdicts = sims.flatMap((s) => s.sim.jobs.filter((j) => j.job.id === job));
  const combos = verdicts.flatMap((v) => v.matrix?.combinations ?? []);
  if (combos.length) return `${job} has no such combination. Its combinations: ${combos.map((c) => `${job}:${/\(([^()]*)\)$/.exec(c.combination.name)?.[1] ?? c.combination.id}`).join(', ')}.`;
  if (verdicts.every((v) => !v.matrix)) return `${job} has no matrix; use ${job} alone.`;
  return `the combinations of ${job} are not known here (${verdicts.map((v) => v.outcome === 'runs' || v.outcome === 'fails' ? 'its matrix could not be expanded; see the output' : 'the job does not run, so its matrix is never expanded').join('; ')}).`;
}

/** A job that ran, whatever it ended with; fails counts, because it started. */
const ranOutcome = (o: JobOutcome) => o === 'runs' || o === 'fails';

// ---------- git ----------

function git(cwd: string, args: string[]): string {
  return execFileSync('git', ['-c', 'core.quotepath=false', ...args], { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 * 1024 * 1024 }).replace(/\r?\n$/, '');
}

function tryGit(cwd: string, args: string[]): string | undefined {
  try { return git(cwd, args); } catch { return undefined; }
}

/** Resolves a ref to a full commit sha, or explains why it cannot. */
function commitOf(root: string, ref: string, flag: string): string {
  const sha = tryGit(root, ['rev-parse', '--verify', '--quiet', `${ref}^{commit}`]);
  if (sha) return sha;
  throw new UsageError(`${flag} ${ref}: git knows no such commit.`);
}

/** refs/heads/x, refs/remotes/origin/x and origin/x all name the branch x on GitHub. */
function branchNameOf(root: string, ref: string, remotes: string[]): string | undefined {
  const full = tryGit(root, ['rev-parse', '--symbolic-full-name', ref]);
  if (full?.startsWith('refs/heads/')) return full.slice('refs/heads/'.length);
  if (full?.startsWith('refs/remotes/')) {
    const rest = full.slice('refs/remotes/'.length);
    const remote = remotes.find((r) => rest.startsWith(r + '/'));
    return remote ? rest.slice(remote.length + 1) : rest;
  }
  return undefined;
}

/** owner/name from https://github.com/owner/name.git, git@github.com:owner/name.git, ssh://... */
export function repositoryFromUrl(url: string): string | undefined {
  const m = /^(?:[a-z+]+:\/\/)?(?:[^@/]+@)?[^/:]+[/:](?:\d+\/)?(.+?)(?:\.git)?\/?$/i.exec(url.trim());
  const parts = m?.[1]?.split('/').filter(Boolean) ?? [];
  return parts.length >= 2 ? parts.slice(-2).join('/') : undefined;
}

function changedBetween(root: string, from: string, to: string): string[] {
  // --no-renames: a file moved out of src/ touches src/ too, so both paths are listed. Not verified
  // against a real run which of the two names GitHub matches for a rename.
  return git(root, ['diff', '--name-only', '--no-renames', '-z', from, to]).split('\0').filter(Boolean);
}

function readRepository(values: Values, cwd: string, event: string, action: string | undefined): RepoFacts {
  const root = tryGit(cwd, ['rev-parse', '--show-toplevel']);
  if (!root) throw new UsageError(`${cwd} is not inside a git repository (git rev-parse --show-toplevel failed).`);
  const notes: string[] = [];
  const remotes = (tryGit(root, ['remote']) ?? '').split('\n').filter(Boolean);
  const remote = remotes.includes('origin') ? 'origin' : remotes[0];

  // repository: flag, else the remote's URL, else the page's placeholder
  let repository = values.repo;
  let repoSource: Source = 'flag';
  if (!repository) {
    const url = remote ? tryGit(root, ['remote', 'get-url', remote]) : undefined;
    repository = url ? repositoryFromUrl(url) : undefined;
    repoSource = 'git';
    if (!repository) {
      repository = DEFAULT_STATE.repository;
      repoSource = 'default';
      notes.push(`No remote URL to read the repository name from; using ${repository} (pass --repo owner/name).`);
    }
  } else if (!/^[^/\s]+\/[^/\s]+$/.test(repository)) {
    throw new UsageError(`--repo ${repository}: expected owner/name.`);
  }

  // default branch: flag, else origin/HEAD, else a main or master branch that exists
  let defaultBranch = values['default-branch'];
  let defaultSource: Source = 'flag';
  if (!defaultBranch) {
    defaultSource = 'git';
    const symbolic = remote ? tryGit(root, ['symbolic-ref', '--quiet', `refs/remotes/${remote}/HEAD`]) : undefined;
    if (symbolic?.startsWith(`refs/remotes/${remote}/`)) defaultBranch = symbolic.slice(`refs/remotes/${remote}/`.length);
    else {
      const exists = (b: string) => Boolean(tryGit(root, ['rev-parse', '--verify', '--quiet', `refs/heads/${b}`]) ?? (remote ? tryGit(root, ['rev-parse', '--verify', '--quiet', `refs/remotes/${remote}/${b}`]) : undefined));
      defaultBranch = ['main', 'master'].find(exists);
      if (defaultBranch) notes.push(`${remote ? `${remote}/HEAD is not set` : 'No remote'}, so the default branch is taken to be ${defaultBranch} because that branch exists${remote ? ` (git remote set-head ${remote} --auto records the real one)` : ''}; --default-branch overrides.`);
      else {
        defaultBranch = tryGit(root, ['symbolic-ref', '--quiet', '--short', 'HEAD']) ?? 'main';
        defaultSource = 'default';
        notes.push(`Could not tell the default branch; assuming ${defaultBranch} (pass --default-branch).`);
      }
    }
  }

  const isPr = PR_EVENTS.has(event);
  const refType: 'branch' | 'tag' = values.tag !== undefined && (event === 'push' || event === 'create' || event === 'delete') ? 'tag' : 'branch';
  // A tag that exists here is the commit a tag push would carry.
  const localTag = values.tag !== undefined && tryGit(root, ['rev-parse', '--verify', '--quiet', `refs/tags/${values.tag}^{commit}`]) ? `refs/tags/${values.tag}` : undefined;
  const headRef = values.head ?? localTag ?? 'HEAD';
  const sha = commitOf(root, headRef, '--head');

  // branch: flag, else the branch --head names (or the checked-out one), else the default branch
  let branch = values.branch;
  let branchSource: Source = 'flag';
  if (!branch) {
    if (refType === 'tag') {
      // A tag push has no branch; nothing reads this one.
      branch = defaultBranch;
      branchSource = 'default';
    } else if (CURRENT_BRANCH_EVENTS.has(event) || isPr) {
      branch = branchNameOf(root, headRef, remotes);
      branchSource = 'git';
      if (!branch) {
        branch = defaultBranch;
        branchSource = 'default';
        notes.push(`${headRef} is not a branch (detached HEAD or a commit); assuming the branch is ${branch} (pass --branch).`);
      }
    } else {
      branch = defaultBranch;
      branchSource = defaultSource;
    }
  }

  let baseBranch: string | undefined;
  let baseSha: string | undefined;
  let mergeBase: string | undefined;
  let diff: string | undefined;
  let changedFiles: string[] | undefined;
  const short = (s: string) => s.slice(0, 7);
  if (event === 'push' && refType === 'branch') {
    // GitHub diffs the commit before the push against the pushed one (two dots). One commit pushed: its parent.
    if (values.base !== undefined) {
      baseSha = commitOf(root, values.base, '--base');
      changedFiles = changedBetween(root, baseSha, sha);
      diff = `git diff ${short(baseSha)}..${short(sha)} (--base ${values.base})`;
    } else {
      baseSha = tryGit(root, ['rev-parse', '--verify', '--quiet', `${sha}^1`]);
      if (baseSha) {
        changedFiles = changedBetween(root, baseSha, sha);
        diff = `git diff ${short(baseSha)}..${short(sha)} (the head's first parent; --base for a push of several commits)`;
      } else if (tryGit(root, ['rev-parse', '--is-shallow-repository']) === 'true') {
        throw new UsageError(`${short(sha)} has no parent in this clone because the clone is shallow. Fetch more history (actions/checkout with fetch-depth: 0 or 2) or pass --base.`);
      } else {
        changedFiles = git(root, ['diff-tree', '--root', '--no-commit-id', '--name-only', '-r', '--no-renames', '-z', sha]).split('\0').filter(Boolean);
        diff = `${short(sha)} is the first commit, so every file in it counts as changed`;
      }
    }
  } else if (isPr) {
    // GitHub diffs a pull request three-dot style: from where the head branch left the base to the head.
    let baseRef = values.base;
    if (baseRef === undefined) {
      baseRef = remote && tryGit(root, ['rev-parse', '--verify', '--quiet', `refs/remotes/${remote}/${defaultBranch}`]) ? `${remote}/${defaultBranch}` : defaultBranch;
    }
    baseSha = commitOf(root, baseRef, '--base');
    baseBranch = branchNameOf(root, baseRef, remotes);
    if (!baseBranch) {
      baseBranch = defaultBranch;
      notes.push(`--base ${baseRef} is not a branch, so the pull request is taken to target ${baseBranch}.`);
    }
    mergeBase = tryGit(root, ['merge-base', baseSha, sha]);
    if (!mergeBase) throw new UsageError(`${baseRef} and ${headRef} share no history (no merge base), so there is no pull request diff. Fetch more history or pass another --base.`);
    changedFiles = changedBetween(root, mergeBase, sha);
    diff = `git diff ${baseRef}...${values.head ?? 'HEAD'} (from the merge base ${short(mergeBase)}, as GitHub diffs a pull request)`;
    if (mergeBase === sha) notes.push(`${headRef} is already contained in ${baseRef}: the pull request would have no changes.`);
  } else if (values.base !== undefined) {
    notes.push(`--base is ignored for ${event}${event === 'push' ? ' of a tag (paths filters do not apply to tags)' : ''}.`);
  }
  if (changedFiles && changedFiles.length > GITHUB_DIFF_LIMIT) notes.push(`${changedFiles.length} files changed. GitHub looks at only the first ${GITHUB_DIFF_LIMIT} files of a diff for paths filters, so a real run may disagree with this one.`);
  if ((values.input ?? []).length && event !== 'workflow_dispatch') notes.push(`--input only applies to workflow_dispatch; ignored for ${event}.`);

  const message = tryGit(root, ['log', '-1', '--no-show-signature', '--format=%B', sha])?.trim();
  return {
    root,
    event,
    action,
    refType,
    branch,
    tag: values.tag ?? (event === 'release' ? tryGit(root, ['describe', '--tags', '--exact-match', sha]) : undefined),
    baseBranch,
    sha: values.sha ?? sha,
    baseSha,
    mergeBase,
    diff,
    changedFiles,
    message,
    repository,
    defaultBranch,
    sources: { branch: branchSource, sha: values.sha ? 'flag' : 'git', changedFiles: changedFiles ? 'git' : 'default', repository: repoSource, defaultBranch: defaultSource },
    notes,
  };
}

/** Puts what git knows into the context the page built from the example payload. */
function patchFromGit(github: Json, facts: RepoFacts, workflowName: string, file: string): void {
  const ev = (github['event'] ?? {}) as Json;
  github['workflow'] = workflowName;
  github['workflow_ref'] = `${facts.repository}/${file}@${github['ref'] ?? ''}`;
  if (facts.event === 'push') {
    github['sha'] = facts.sha;
    ev['after'] = facts.sha;
    if (facts.baseSha) ev['before'] = facts.baseSha;
    const head = ev['head_commit'];
    if (head && typeof head === 'object') (head as Json)['id'] = facts.sha;
  } else if (PR_EVENTS.has(facts.event)) {
    const pr = ev['pull_request'] as Json | undefined;
    const set = (side: string, sha: string | undefined) => { const s = pr?.[side]; if (sha && s && typeof s === 'object') (s as Json)['sha'] = sha; };
    set('head', facts.sha);
    set('base', facts.baseSha);
  } else if (facts.event === 'workflow_dispatch' || facts.event === 'workflow_run' || facts.event === 'create') {
    github['sha'] = facts.sha;
  }
}

function workflowFiles(root: string, cwd: string, only: string[] | undefined): string[] {
  if (only?.length) {
    return only.map((f) => {
      for (const candidate of [path.resolve(cwd, f), path.join(root, '.github', 'workflows', f), path.resolve(root, f)]) {
        if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
      }
      throw new UsageError(`--workflow ${f}: no such file (looked in ${cwd} and in .github/workflows).`);
    });
  }
  const dir = path.join(root, '.github', 'workflows');
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((f) => /\.ya?ml$/i.test(f)).sort().map((f) => path.join(dir, f));
}

// ---------- flags ----------

function pairs(list: string[], flag: string, sep: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const item of list) {
    const i = item.indexOf(sep);
    if (i <= 0) throw new UsageError(`${flag} ${item}: expected key${sep}value.`);
    out[item.slice(0, i)] = item.slice(i + 1);
  }
  return out;
}

function jobOutputs(list: string[]): Record<string, Record<string, string>> {
  const out: Record<string, Record<string, string>> = {};
  for (const item of list) {
    // Job ids and output names cannot contain dots or equals signs; the value can contain anything (JSON).
    const m = /^([^.=]+)\.([^=]+)=(.*)$/s.exec(item);
    if (!m) throw new UsageError(`--output ${item}: expected job.key=value, e.g. --output plan.targets='["a","b"]'.`);
    (out[m[1]!] ??= {})[m[2]!] = m[3]!;
  }
  return out;
}


// ---------- report ----------

function toCliWorkflow(file: string, name: string | undefined, sim: Simulation, notes: string[], jobs: ParsedJob[]): CliWorkflow {
  return {
    file,
    name,
    triggers: sim.trigger.matched && !sim.rejected,
    triggerReasons: sim.trigger.reasons,
    triggerNotes: sim.triggerNotes,
    rejected: sim.rejected,
    fileProblems: [...sim.fileProblems, ...sim.graphProblems],
    notes,
    limits: sim.limits,
    jobs: sim.jobs.map((v) => toCliJob(v, jobs)),
  };
}

function toCliJob(v: JobVerdict, jobs: ParsedJob[]): CliJob {
  const ran = v.outcome === 'runs' || v.outcome === 'fails' || v.outcome === 'cancelled';
  return {
    id: v.job.id,
    name: v.job.name,
    outcome: v.outcome,
    result: v.result,
    if: v.job.ifSource,
    evaluatedAs: v.job.if,
    headline: v.headline,
    reason: v.evaluation ? (v.evaluation.ok ? v.evaluation.reason : v.evaluation.error) : undefined,
    needs: v.needsResults,
    problems: v.problems.map((p) => p.message),
    steps: ran && !v.matrix?.combinations.length ? v.stepVerdicts.map(toCliStep) : [],
    ...(v.matrix ? { matrix: toCliMatrix(v.matrix, jobs) } : {}),
    ...(v.rootCause ? { rootCause: { line: v.rootCause.line, causes: v.rootCause.causes, ...(v.rootCause.ownCondition ? { ownCondition: v.rootCause.ownCondition } : {}) } } : {}),
  };
}

function toCliMatrix(m: MatrixVerdict, jobs: ParsedJob[]): CliMatrix {
  const e = m.expansion;
  const reads = 'reads' in e ? e.reads : [];
  return {
    strategy: m.line,
    expansion: e.kind,
    reason: 'reason' in e ? e.reason : undefined,
    reads,
    // The flags that would expand a matrix that reads job outputs nobody gave, with the value the file itself
    // writes when there is one (echo 'x=[...]' >> "$GITHUB_OUTPUT"), so the reader can copy it.
    missingOutputs: reads.filter((r) => r.source === 'unknown').map((r) => {
      const example = outputExample(jobs.find((j) => j.id === r.job) ?? { outputs: undefined, steps: [] }, r.output);
      return `--output ${r.job}.${r.output}=${example !== undefined ? shellQuote(example) : '<value>'}`;
    }),
    combinations: m.combinations.map((c) => ({
      name: c.combination.name,
      id: c.combination.id,
      key: c.key,
      matrix: c.combination.matrix,
      origin: c.combination.origin,
      outcome: c.outcome,
      result: c.result,
      headline: c.headline,
      annotation: c.annotation,
      steps: c.stepVerdicts.map(toCliStep),
    })),
  };
}

/** Single quotes the way a POSIX shell reads them, unless the value needs none. */
function shellQuote(s: string): string {
  return /^[\w@%+=:,./-]+$/.test(s) ? s : `'${s.replace(/'/g, `'\\''`)}'`;
}

function toCliStep(s: StepVerdict): CliStep {
  const ev = s.evaluation;
  const verdict = !s.if ? 'runs' : s.unknown || !ev || !ev.ok ? 'unknown' : ev.truthy ? 'runs' : 'skipped';
  return { id: s.id, summary: s.summary, if: s.if, verdict, reason: s.unknown ?? (ev ? (ev.ok ? ev.reason : ev.error) : undefined) };
}

// ---------- text output ----------

const PER_FILE = /^(paths|paths-ignore): "/;
/** The engine's headline for a job with no condition whose needs all succeeded. */
const PLAIN_RUN = 'Runs: no condition, and every job it needs succeeded.';

/** The paths trace has a line per changed file; keep the ones that decided and count the rest. */
function condense(reasons: string[], keep = 3): string[] {
  const out: string[] = [];
  let group: string[] = [];
  const flush = () => {
    if (!group.length) return;
    const hits = group.filter((r) => r.endsWith('→ runs'));
    const shown = (hits.length ? hits : group).slice(0, keep);
    out.push(...shown);
    const rest = group.length - shown.length;
    if (rest > 0) out.push(`${group[0]!.slice(0, group[0]!.indexOf(':'))}: ${rest} more file${rest === 1 ? '' : 's'} (--json lists every one)`);
    group = [];
  };
  for (const r of reasons) {
    if (PER_FILE.test(r)) {
      if (group.length && r.slice(0, r.indexOf(':')) !== group[0]!.slice(0, group[0]!.indexOf(':'))) flush();
      group.push(r);
    } else {
      flush();
      out.push(r);
    }
  }
  flush();
  return out;
}

export function formatReport(r: CliReport): string {
  const f = r.facts;
  const lines: string[] = [];
  const short = (s: string | undefined) => (s && /^[0-9a-f]{40}$/.test(s) ? s.slice(0, 7) : s ?? '');
  const what = PR_EVENTS.has(r.event)
    ? `${r.event}${r.action ? ` (${r.action})` : ''} from ${f.branch} into ${f.baseBranch}, head ${short(f.sha)}`
    : f.refType === 'tag' && (r.event === 'push' || r.event === 'create' || r.event === 'delete') ? `${r.event} of tag ${f.tag} at ${short(f.sha)}`
    : `${r.event}${r.action ? ` (${r.action})` : ''} ${r.event === 'push' ? 'to' : 'on'} ${f.branch}${r.event === 'push' || r.event === 'workflow_dispatch' ? ` at ${short(f.sha)}` : ''}`;
  lines.push(`${what} · ${f.repository} · default branch ${f.defaultBranch}`);
  if (f.changedFiles) {
    lines.push(`${f.changedFiles.length} changed file${f.changedFiles.length === 1 ? '' : 's'}: ${f.diff}`);
    const shown = f.changedFiles.slice(0, 10);
    for (const file of shown) lines.push(`  ${file}`);
    if (f.changedFiles.length > shown.length) lines.push(`  ... ${f.changedFiles.length - shown.length} more`);
  }
  for (const n of f.notes) lines.push(`note: ${n}`);

  for (const w of r.workflows) {
    lines.push('');
    lines.push(`${w.file}${w.name ? ` · ${w.name}` : ''}`);
    if (w.rejected) {
      lines.push('  rejected: GitHub refuses this file, so a push creates a failed run with no jobs');
      for (const p of w.fileProblems) lines.push(`    ${p}`);
    } else {
      lines.push(`  ${w.triggers ? 'triggers' : 'does not trigger'}`);
      for (const reason of condense(w.triggerReasons)) lines.push(`    ${reason}`);
    }
    for (const n of [...w.triggerNotes, ...w.notes]) lines.push(`  note: ${n}`);
    // The same list the page shows above the results: what this run of the simulation takes on trust.
    if (w.limits.length) {
      lines.push('  limits:');
      for (const l of w.limits) lines.push(`    ${l.title}: ${l.where.join('; ')}. ${l.instead}`);
    }
    const width = Math.max(...w.jobs.map((j) => j.id.length), 0);
    const col = Math.max(10, ...w.jobs.flatMap((j) => [j.outcome, ...(j.matrix?.combinations ?? []).map((c) => c.outcome)]).map((o) => o.length + 2));
    const pad = ' '.repeat(2 + col + width + 2);
    for (const j of w.jobs) {
      const cond = j.if !== undefined ? `if: ${j.if.replace(/\s*\n\s*/g, ' ')}` : '';
      lines.push(`  ${j.outcome.padEnd(col)}${j.id.padEnd(width)}  ${cond}`.trimEnd());
      if (j.outcome === 'blocked' || j.outcome === 'rejected') continue;
      // A job without a condition that runs has nothing to explain, unless its verdict rests on an upstream matrix;
      // everything else says why. A matrix job's headline also says how many jobs the matrix makes, or why it makes none.
      if (j.if !== undefined || j.outcome !== 'runs' || j.matrix || j.headline !== PLAIN_RUN) for (const l of jobReason(j)) lines.push(`${pad}${l}`);
      for (const p of j.problems) lines.push(`${pad}problem: ${p}`);
      if (j.matrix && j.matrix.expansion !== 'not-expanded') {
        lines.push(`${pad}${j.matrix.strategy}`);
        // One line per job GitHub creates, under the name its run lists.
        for (const c of j.matrix.combinations) {
          lines.push(`${pad}${c.outcome.padEnd(col)}${c.name}`);
          if (c.annotation) lines.push(`${pad}${' '.repeat(col)}${c.annotation}`);
        }
        for (const flag of j.matrix.missingOutputs) lines.push(`${pad}to expand it: ${flag}`);
      }
    }
  }

  if (r.expectations.length) {
    lines.push('');
    for (const x of r.expectations) {
      const where = x.found.map((f) => `${f.outcome} in ${f.file}`).join(', ');
      lines.push(`expect-run ${x.job}: ${x.runs ? 'ok' : 'FAILED'} (${where})`);
    }
  }
  return lines.join('\n');
}

function jobReason(j: CliJob): string[] {
  // The outcome word already says runs or skipped; the engine's headline repeats it. A job skipped because of a job
  // upstream says only where that started: its own success() being false is what "skipped" already means.
  if (j.rootCause) return [`→ ${j.headline.replace(/^Skipped because /, 'because ')}`];
  const lines = [`→ ${j.headline.replace(/^(Runs|Skipped): /, '')}`];
  // A job marked with --fail says so in its headline; keep the reason its condition was true as well.
  if (j.if !== undefined && j.reason && !j.headline.includes(j.reason)) lines.unshift(`→ ${j.reason}`);
  return lines;
}

// ---------- entry point ----------

function invokedDirectly(): boolean {
  if (!process.argv[1]) return false;
  try {
    const self = realpathSync(fileURLToPath(import.meta.url));
    const argv1 = realpathSync(process.argv[1]);
    return process.platform === 'win32' ? self.toLowerCase() === argv1.toLowerCase() : self === argv1;
  } catch {
    return false;
  }
}

if (invokedDirectly()) {
  main(process.argv.slice(2)).then(
    (code) => { process.exitCode = code; },
    (e: unknown) => { process.stderr.write(`why-didnt-my-job-run: ${(e as Error).stack ?? String(e)}\n`); process.exitCode = 2; },
  );
}
