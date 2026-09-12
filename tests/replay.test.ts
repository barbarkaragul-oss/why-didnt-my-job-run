/**
 * Ground-truth replay: every fixture in tests/fixtures/runs was recorded from a real run in the
 * private fixtures repository (the run dumped its own `github` context; the API reported each
 * job's conclusion). The simulator must reproduce, for every job, whether GitHub ran or skipped it,
 * and for every push, which workflows GitHub started.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { parseWorkflowFile, type ParsedWorkflow } from '../src/engine/workflow.js';
import { evaluateCondition, type JobResult } from '../src/engine/evaluate.js';
import { decideTrigger } from '../src/engine/filters.js';
import { simulate } from '../src/engine/simulate.js';
import { DEFAULT_STATE, toEngineInputs, type ScenarioState } from '../src/ui/scenario.js';

interface Fixture {
  run_id: number;
  workflow: string;
  event: string;
  head_branch: string | null;
  head_sha: string;
  conclusion: string | null;
  github?: Record<string, unknown>;
  inputs?: Record<string, unknown>;
  changed_files?: string[];
  jobs: Array<{ name: string; conclusion: string | null; steps?: Array<{ name: string; conclusion: string | null }> }>;
}

const RUNS = path.resolve('tests/fixtures/runs');
const WORKFLOWS = path.resolve('tests/fixtures/workflows');
const fixtures: Fixture[] = readdirSync(RUNS).filter((f) => f.endsWith('.json')).map((f) => JSON.parse(readFileSync(path.join(RUNS, f), 'utf8')) as Fixture);
const workflowCache = new Map<string, Promise<ParsedWorkflow>>();
const loadWorkflow = (name: string) => {
  let p = workflowCache.get(name);
  if (!p) { p = parseWorkflowFile(readFileSync(path.join(WORKFLOWS, `${name}.yml`), 'utf8'), `${name}.yml`); workflowCache.set(name, p); }
  return p;
};

const baseJobName = (name: string) => name.replace(/\s*\(.*\)$/, '');
const toResult = (c: string | null): JobResult => (c === 'success' ? 'success' : c === 'failure' ? 'failure' : c === 'cancelled' ? 'cancelled' : 'skipped');

test('fixtures were recorded with their github context', () => {
  const withCtx = fixtures.filter((f) => f.github);
  assert.ok(fixtures.length >= 40, `expected a full recording, got ${fixtures.length} fixtures`);
  assert.ok(withCtx.length >= 20, `expected github contexts in the fixture-a and filter-branches runs, got ${withCtx.length}`);
});

for (const fx of fixtures.filter((f) => f.workflow === 'fixture-a' && f.github)) {
  test(`replay ${fx.workflow} ${fx.event} ${fx.head_branch} (#${fx.run_id}): every job's run/skip matches GitHub`, async () => {
    const wf = await loadWorkflow(fx.workflow);
    assert.deepEqual(wf.errors, []);
    const actual = new Map<string, JobResult>();
    for (const j of fx.jobs) {
      const id = baseJobName(j.name);
      // a matrix job expands to several runs; any non-skipped leg means the job ran
      const prev = actual.get(id);
      const r = toResult(j.conclusion);
      actual.set(id, prev && prev !== 'skipped' ? prev : r);
    }
    const github = fx.github!;
    const inputs = (fx.inputs ?? {}) as Record<string, unknown>;
    const mismatches: string[] = [];
    for (const job of wf.jobs) {
      const needs: Record<string, { result: JobResult }> = {};
      for (const n of job.needs) needs[n] = { result: actual.get(n) ?? 'skipped' };
      const r = evaluateCondition(job.if, github, { needs, contexts: { inputs: typedInputs(inputs, wf) } });
      assert.ok(r.ok, `${job.id}: ${r.ok ? '' : r.error}`);
      const expectedRan = (actual.get(job.id) ?? 'skipped') !== 'skipped';
      if (r.truthy !== expectedRan) mismatches.push(`${job.id}: simulator says ${r.truthy ? 'run' : 'skip'} (${r.reason}), GitHub ${expectedRan ? 'ran it' : 'skipped it'}`);
    }
    assert.deepEqual(mismatches, []);
  });
}

/** workflow_dispatch inputs arrive as strings in github.event.inputs; the `inputs` context keeps booleans typed. */
function typedInputs(raw: Record<string, unknown>, wf: ParsedWorkflow): Record<string, unknown> {
  const defs = ((wf.events as Record<string, unknown>)['workflow_dispatch'] as { inputs?: Record<string, { type?: string }> } | undefined)?.inputs ?? {};
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(raw)) {
    const type = defs[k]?.type;
    out[k] = type === 'boolean' ? v === true || v === 'true' : type === 'number' ? Number(v) : v;
  }
  return out;
}

// Trigger decisions: for each push (grouped by ref + sha, since three tags point at one commit) GitHub
// started some workflows and not others.
const pushes = new Map<string, { github: Record<string, unknown>; ran: Set<string>; changed: string[] }>();
for (const fx of fixtures.filter((f) => f.event === 'push')) {
  const key = `${fx.head_branch}@${fx.head_sha}`;
  const entry = pushes.get(key) ?? { github: {}, ran: new Set<string>(), changed: [] };
  entry.ran.add(fx.workflow);
  if (fx.github && fx.workflow === 'fixture-a') { entry.github = fx.github; entry.changed = fx.changed_files ?? []; }
  pushes.set(key, entry);
}
const FILTER_WORKFLOWS = ['filter-branches', 'filter-branches-ignore', 'filter-paths-ignore', 'filter-tags'];

for (const [sha, push] of pushes) {
  if (!Object.keys(push.github).length) continue;
  const ref = String(push.github['ref']);
  test(`trigger decisions for push ${ref} (${sha.slice(0, 7)}) match the workflows GitHub actually started`, async () => {
    const changed = push.changed;
    const mismatches: string[] = [];
    for (const name of FILTER_WORKFLOWS) {
      const wf = await loadWorkflow(name);
      const d = decideTrigger(wf, { event: 'push', refName: String(push.github['ref_name']), refType: ref.startsWith('refs/tags/') ? 'tag' : 'branch', changedFiles: changed });
      const expected = push.ran.has(name);
      if (d.matched !== expected) mismatches.push(`${name}: simulator says ${d.matched ? 'runs' : 'does not run'} [${d.reasons.join(' | ')}], GitHub ${expected ? 'ran it' : 'did not'}`);
    }
    assert.deepEqual(mismatches, []);
  });
}

// pull_request triggers: filter-pr-default-types has branches [main] + paths src/**; filter-pr-labeled has types [labeled]
const prRuns = fixtures.filter((f) => f.event === 'pull_request');
for (const fx of prRuns.filter((f) => f.workflow === 'fixture-a' && f.github)) {
  const action = String((fx.github!['event'] as Record<string, unknown>)['action']);
  test(`pull_request ${action} from ${fx.head_branch}: filter workflows agree with GitHub`, async () => {
    const event = fx.github!['event'] as Record<string, unknown>;
    const pr = event['pull_request'] as Record<string, unknown>;
    // Runs started by the same webhook delivery get run ids within a few hundred of each other; different
    // deliveries on the same branch (opened vs labeled, minutes apart) are tens of thousands apart.
    const sameEvent = (name: string) => prRuns.some((r) => r.workflow === name && r.head_branch === fx.head_branch && Math.abs(r.run_id - fx.run_id) < 2000);
    const changed = fx.changed_files ?? [];
    const mismatches: string[] = [];
    for (const name of ['filter-pr-default-types', 'filter-pr-labeled']) {
      const wf = await loadWorkflow(name);
      const d = decideTrigger(wf, { event: 'pull_request', action, baseBranch: String((pr['base'] as Record<string, unknown>)['ref']), changedFiles: changed });
      const expected = sameEvent(name);
      if (d.matched !== expected) mismatches.push(`${name}: simulator says ${d.matched ? 'runs' : 'does not run'} [${d.reasons.join(' | ')}], GitHub ${expected ? 'ran it' : 'did not'}`);
    }
    assert.deepEqual(mismatches, []);
  });
}

// fixture-hashfiles has a job-level hashFiles(). GitHub refused the file on every push: each recording is a run
// with conclusion "failure" and an empty job list, named after the file path. The simulator must say the same.
test('replay fixture-hashfiles: a rejected file is a failed run with no jobs, on every push', async () => {
  const runs = fixtures.filter((f) => f.workflow === 'fixture-hashfiles');
  assert.ok(runs.length >= 5, `expected the hashFiles runs to be recorded, got ${runs.length}`);
  const wf = await loadWorkflow('fixture-hashfiles');
  assert.ok(wf.errors.some((e) => /hashFiles/.test(e)), JSON.stringify(wf.errors));
  for (const fx of runs) {
    assert.equal(fx.conclusion, 'failure', `run ${fx.run_id}`);
    assert.deepEqual(fx.jobs, [], `run ${fx.run_id}`);
    const state: ScenarioState = { ...DEFAULT_STATE, event: 'push', refType: 'branch', branch: fx.head_branch ?? 'main' };
    const inputs = toEngineInputs(state, wf);
    const sim = simulate({ workflow: wf, github: inputs.github, inputs: inputs.inputs, trigger: inputs.trigger });
    assert.equal(sim.rejected, true, `run ${fx.run_id}`);
    assert.ok(sim.jobs.length > 0);
    assert.deepEqual(sim.jobs.map((j) => j.outcome), sim.jobs.map(() => 'rejected'), `run ${fx.run_id}`);
  }
});

// Status functions across a needs chain (fixture-chain: a fails; fixture-chain2: x is skipped by its own condition)
// and at step level (fixture-steps). Recorded job conclusions, replayed through simulate() with the recorded
// failures forced. What the runs showed: success() is false when ANY ancestor was skipped or failed, even three
// hops away and even when the direct need succeeded, so always() rescues only the job it is on; failure() is true
// when any ancestor failed, even when the direct need was skipped.
const ran = (v: { outcome: string }) => v.outcome === 'runs' || v.outcome === 'fails';
async function replayPush(name: string, fx: Fixture) {
  const wf = await loadWorkflow(name);
  assert.deepEqual(wf.errors, []);
  const forced: Record<string, JobResult> = {};
  for (const j of fx.jobs) if (j.conclusion === 'failure') forced[baseJobName(j.name)] = 'failure';
  const state: ScenarioState = { ...DEFAULT_STATE, event: 'push', refType: 'branch', branch: fx.head_branch ?? 'main', changedFiles: (fx.changed_files ?? []).join('\n') };
  const inputs = toEngineInputs(state, wf);
  return simulate({ workflow: wf, github: inputs.github, inputs: inputs.inputs, trigger: inputs.trigger, forcedResults: forced });
}
for (const name of ['fixture-chain', 'fixture-chain2', 'fixture-steps']) {
  test(`replay ${name}: every job's run/skip matches GitHub (status functions look at every ancestor)`, async () => {
    const runs = fixtures.filter((f) => f.workflow === name);
    assert.ok(runs.length >= 1, `no recording of ${name}`);
    for (const fx of runs) {
      const sim = await replayPush(name, fx);
      assert.equal(sim.trigger.matched, true);
      const mismatches: string[] = [];
      for (const j of fx.jobs) {
        const v = sim.jobs.find((x) => x.job.id === baseJobName(j.name));
        assert.ok(v, `job ${j.name} is not in the parsed workflow`);
        const expected = j.conclusion !== 'skipped';
        if (ran(v) !== expected) mismatches.push(`${v.job.id}: simulator says ${ran(v) ? 'run' : 'skip'} (${v.headline}), GitHub ${expected ? 'ran it' : 'skipped it'}`);
      }
      assert.deepEqual(mismatches, [], `run ${fx.run_id}`);
    }
  });
}

test('replay fixture-steps: step-level success()/failure() look at the job\'s own steps, not at needs', async () => {
  const fx = fixtures.find((f) => f.workflow === 'fixture-steps');
  assert.ok(fx, 'no recording of fixture-steps');
  const sim = await replayPush('fixture-steps', fx);
  const recordedStep = (jobName: string, echo: string) => fx.jobs.find((j) => j.name === jobName)!.steps!.find((s) => s.name === `Run echo ${echo}`)!.conclusion;
  const truthy = (v: { evaluation?: { ok: boolean; truthy?: boolean } }) => v.evaluation && v.evaluation.ok ? (v.evaluation as { truthy: boolean }).truthy : undefined;
  // steps_after_failed_need: if: always() after a failed need; recorded: n1 (failure()) skipped, n2 (success()) ran, n3 (needs.x.result) ran
  const after = sim.jobs.find((j) => j.job.id === 'steps_after_failed_need')!;
  assert.equal(after.outcome, 'runs');
  const byId = Object.fromEntries(after.stepVerdicts.map((s) => [s.id, s]));
  assert.equal(recordedStep('steps_after_failed_need', 'n1'), 'skipped');
  assert.equal(truthy(byId['n1_failure']!), false, 'failure() at step level ignores the failed need');
  assert.equal(recordedStep('steps_after_failed_need', 'n2'), 'success');
  assert.equal(truthy(byId['n2_success']!), true, 'success() at step level ignores the failed need');
  assert.equal(recordedStep('steps_after_failed_need', 'n3'), 'success');
  assert.equal(truthy(byId['n3_needs']!), true, 'the needs context is still there');
  // steps_continue: s1 fails with continue-on-error (recorded conclusion success); s2 (failure()) skipped, s3 (success()) ran,
  // s4/s5 read steps.s1.* which the simulation does not know
  const cont = sim.jobs.find((j) => j.job.id === 'steps_continue')!;
  const c = Object.fromEntries(cont.stepVerdicts.map((s) => [s.id, s]));
  assert.equal(recordedStep('steps_continue', 's2'), 'skipped');
  assert.equal(truthy(c['s2_failure']!), false);
  assert.equal(recordedStep('steps_continue', 's3'), 'success');
  assert.equal(truthy(c['s3_success']!), true);
  assert.match(c['s4_outcome']!.unknown ?? '', /steps\./);
  assert.match(c['s5_conclusion']!.unknown ?? '', /steps\./);
  assert.equal(c['s4_outcome']!.unknown === undefined, false, 'a step that reads steps.* is unknown, not a confident verdict');
});

// filter-both has branches and branches-ignore on the same event: every recorded push produced a failed run with no jobs.
test('replay filter-both: branches with branches-ignore is a rejected file (failed run, no jobs)', async () => {
  const runs = fixtures.filter((f) => f.workflow === 'filter-both');
  assert.ok(runs.length >= 1, 'no recording of filter-both');
  for (const fx of runs) { assert.equal(fx.conclusion, 'failure'); assert.deepEqual(fx.jobs, []); }
  const sim = await replayPush('filter-both', runs[0]!);
  assert.equal(sim.rejected, true);
  assert.ok(sim.fileProblems.some((p) => /branches and branches-ignore/.test(p)), JSON.stringify(sim.fileProblems));
});

// filter-negative-only has paths: ['!docs/**'] only. On the pushes that produced the filter-both and fixture-chain
// recordings (commits 62ad7b8 and 5614d1a, which changed notes.txt and workflow files, nothing under docs/),
// GitHub created no run for it at all: not a failed one, none. So it is not a rejected file; nothing matches.
test('filter-negative-only: a list with only negative patterns produces no run at all (not a rejected file)', async () => {
  assert.equal(fixtures.filter((f) => f.workflow === 'filter-negative-only').length, 0, 'GitHub created no run for this workflow');
  assert.ok(fixtures.some((f) => f.workflow === 'filter-both' && f.head_sha.startsWith('62ad7b8')), 'the sibling workflow did run on that push');
  const wf = await loadWorkflow('filter-negative-only');
  const state: ScenarioState = { ...DEFAULT_STATE, event: 'push', refType: 'branch', branch: 'main', changedFiles: 'notes.txt' };
  const inputs = toEngineInputs(state, wf);
  const sim = simulate({ workflow: wf, github: inputs.github, inputs: inputs.inputs, trigger: inputs.trigger });
  assert.equal(sim.rejected, false);
  assert.equal(sim.trigger.matched, false);
  assert.ok(sim.trigger.reasons.some((r) => /only negative/.test(r)), JSON.stringify(sim.trigger.reasons));
  assert.ok(sim.triggerNotes.some((n) => /only negative patterns/.test(n)), JSON.stringify(sim.triggerNotes));
});
