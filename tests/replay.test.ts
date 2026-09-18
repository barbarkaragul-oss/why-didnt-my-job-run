/**
 * Ground-truth replay: every fixture in tests/fixtures/runs was recorded from a real run in the
 * fixtures repository (github.com/barbarkaragul-oss/wdmjr-fixtures, public) (the run dumped its own `github` context; the API reported each
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
import { simulate, type JobVerdict, type StepVerdict, type SimulationInput } from '../src/engine/simulate.js';
import { matrixOutputFields } from '../src/engine/matrix.js';
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

// fixture-matrix (run 35329520473, dispatched by hand): matrix expansion replayed job by job and combination by
// combination, with the full names GitHub gave the jobs. The plan job's outputs are what its step echoes into
// $GITHUB_OUTPUT; the recording's two failing combinations, failfast (2) and nofailfast (2), are marked as failing.
const conclusionOf = (outcome: string) => (outcome === 'runs' ? 'success' : outcome === 'fails' ? 'failure' : outcome === 'cancelled' ? 'cancelled' : 'skipped');
/** Every job the simulation creates, under the name GitHub lists it by: one per combination, none for an empty matrix. */
function createdJobs(jobs: JobVerdict[]): Map<string, { outcome: string; steps: StepVerdict[] }> {
  const out = new Map<string, { outcome: string; steps: StepVerdict[] }>();
  // GitHub's names are unique within a run; a name made twice would otherwise hide in the map.
  const add = (name: string, value: { outcome: string; steps: StepVerdict[] }) => { assert.ok(!out.has(name), `the simulation makes ${name} twice`); out.set(name, value); };
  for (const v of jobs) {
    if (v.outcome === 'not-created') continue;
    if (v.matrix?.combinations.length) for (const c of v.matrix.combinations) add(c.combination.name, { outcome: c.outcome, steps: c.stepVerdicts });
    else add(v.job.name ?? v.job.id, { outcome: v.outcome, steps: v.stepVerdicts });
  }
  return out;
}
/** Recorded steps without the runner's own "Set up job" and "Complete job", in workflow order. */
const workflowSteps = (j: Fixture['jobs'][number]) => (j.steps ?? []).filter((s) => s.name !== 'Set up job' && s.name !== 'Complete job');
const stepRan = (s: StepVerdict) => !s.if || (s.evaluation?.ok === true && s.evaluation.truthy);

async function replayMatrix() {
  const fx = fixtures.find((f) => f.workflow === 'fixture-matrix');
  assert.ok(fx, 'no recording of fixture-matrix');
  const wf = await loadWorkflow('fixture-matrix');
  assert.deepEqual(wf.errors, []);
  const plan = Object.fromEntries(matrixOutputFields(wf).map((f) => [f.output, f.example!]));
  const state: ScenarioState = { ...DEFAULT_STATE, event: 'workflow_dispatch', branch: fx.head_branch ?? 'main' };
  const inputs = toEngineInputs(state, wf);
  const base: SimulationInput = { workflow: wf, github: inputs.github, inputs: inputs.inputs, trigger: inputs.trigger, outputs: { plan } };
  const first = simulate(base);
  const forced: Record<string, JobResult> = {};
  for (const j of fx.jobs.filter((x) => x.conclusion === 'failure')) {
    const c = first.jobs.flatMap((v) => v.matrix?.combinations ?? []).find((x) => x.combination.name === j.name);
    assert.ok(c, `${j.name} failed in the recording but is not a combination the simulation made`);
    forced[c.key] = 'failure';
  }
  return { fx, wf, plan, base, forced, sim: simulate({ ...base, forcedResults: forced }) };
}

test('replay fixture-matrix: every job GitHub listed, by its full name and conclusion, and no other', async () => {
  const { fx, plan, forced, sim } = await replayMatrix();
  // the outputs as the file echoes them, read by the same helper that offers them on the page
  assert.deepEqual(plan, { some: '["a","b"]', none: '[]', whole: '{"include":[{"x":"1"},{"x":"2"}]}', whole_empty: '{"include":[]}' });
  assert.deepEqual(Object.keys(forced).sort(), ['failfast._2', 'nofailfast._2']);
  assert.equal(sim.trigger.matched, true);
  const created = createdJobs(sim.jobs);
  assert.deepEqual([...created.keys()].sort(), fx.jobs.map((j) => j.name).sort());
  const mismatches: string[] = [];
  for (const j of fx.jobs) {
    const got = conclusionOf(created.get(j.name)!.outcome);
    if (got !== j.conclusion) mismatches.push(`${j.name}: simulator says ${got}, GitHub ${j.conclusion}`);
  }
  assert.deepEqual(mismatches, []);
});

test('replay fixture-matrix: include and exclude make exactly the recorded combinations, with the recorded matrix values', async () => {
  const { sim } = await replayMatrix();
  const combos = (id: string) => sim.jobs.find((v) => v.job.id === id)!.matrix!.combinations.map((c) => [c.combination.name, c.combination.matrix]);
  assert.deepEqual(combos('plain'), [
    ['plain (linux, 20)', { os: 'linux', node: 20 }], ['plain (linux, 22)', { os: 'linux', node: 22 }],
    ['plain (mac, 20)', { os: 'mac', node: 20 }], ['plain (mac, 22)', { os: 'mac', node: 22 }],
  ]);
  assert.deepEqual(combos('include_exclude'), [
    ['include_exclude (apple, cat)', { fruit: 'apple', animal: 'cat', color: 'green', shape: 'circle' }],
    ['include_exclude (apple, dog)', { fruit: 'apple', animal: 'dog', color: 'green', shape: 'circle' }],
    ['include_exclude (pear, cat)', { fruit: 'pear', animal: 'cat', color: 'green' }],
    ['include_exclude (banana)', { fruit: 'banana' }],
    ['include_exclude (banana, cat)', { fruit: 'banana', animal: 'cat' }],
  ]);
  assert.deepEqual(combos('dynamic'), [['dynamic (a)', { target: 'a' }], ['dynamic (b)', { target: 'b' }]]);
  assert.deepEqual(combos('whole_json'), [['whole_json (1)', { x: '1' }], ['whole_json (2)', { x: '2' }]]);
});

test('replay fixture-matrix: step conditions that read matrix are decided per combination', async () => {
  const { fx, sim } = await replayMatrix();
  const created = createdJobs(sim.jobs);
  const legs = fx.jobs.filter((j) => /^(plain|include_exclude) \(/.test(j.name));
  assert.equal(legs.length, 9);
  const mismatches: string[] = [];
  for (const j of legs) {
    const recorded = workflowSteps(j);
    const ours = created.get(j.name)!.steps;
    assert.equal(ours.length, recorded.length, j.name);
    recorded.forEach((s, i) => {
      const v = ours[i]!;
      assert.equal(v.unknown, undefined, `${j.name} step ${i + 1} is decided, not unknown`);
      if ((stepRan(v) ? 'success' : 'skipped') !== s.conclusion) mismatches.push(`${j.name} / ${s.name}: simulator says ${stepRan(v) ? 'runs' : 'skipped'}, GitHub ${s.conclusion}`);
    });
  }
  assert.deepEqual(mismatches, []);
  // the two conditions the workflow puts on steps, where the recording shows them decided differently per leg
  assert.deepEqual(legs.filter((j) => workflowSteps(j).some((s) => s.name === 'only linux 22' && s.conclusion === 'success')).map((j) => j.name), ['plain (linux, 22)']);
  assert.deepEqual(legs.filter((j) => workflowSteps(j).some((s) => s.name === 'only circles' && s.conclusion === 'success')).map((j) => j.name).sort(), ['include_exclude (apple, cat)', 'include_exclude (apple, dog)']);
});

test('replay fixture-matrix: an empty matrix creates no job at all, and the jobs that need it see failure', async () => {
  const { fx, sim } = await replayMatrix();
  const byId = (id: string) => sim.jobs.find((v) => v.job.id === id)!;
  for (const id of ['dynamic_empty', 'whole_json_empty']) {
    assert.equal(fx.jobs.filter((j) => j.name === id || j.name.startsWith(`${id} (`)).length, 0, `GitHub listed no ${id} job`);
    const v = byId(id);
    assert.equal(v.outcome, 'not-created');
    assert.equal(v.result, 'failure');
    assert.equal(v.matrix?.expansion.kind, 'empty');
    assert.match(v.headline, /No job created/);
    assert.deepEqual(v.stepVerdicts, []);
  }
  // The dependents: recorded conclusions, and the value of needs.<id>.result that each always() job printed.
  const printed = (name: string) => {
    const step = workflowSteps(fx.jobs.find((j) => j.name === name)!).find((s) => s.name.startsWith('Run echo "'))!;
    const m = /^Run echo "(\w+)=(\w+)"$/.exec(step.name);
    assert.ok(m, step.name);
    return [m[1]!, m[2]!] as const;
  };
  for (const [dependent, need] of [['after_dynamic_empty_always', 'dynamic_empty'], ['after_whole_json_empty_always', 'whole_json_empty'], ['after_failfast_always', 'failfast'], ['after_nofailfast_always', 'nofailfast']] as const) {
    const [echoedNeed, echoedResult] = printed(dependent);
    assert.equal(echoedNeed, need);
    assert.equal(byId(dependent).outcome, 'runs', dependent);
    assert.equal(byId(dependent).needsResults[need], echoedResult, `${dependent} saw needs.${need}.result == '${echoedResult}'`);
  }
  for (const dependent of ['after_dynamic_empty', 'after_whole_json_empty', 'after_failfast']) {
    assert.equal(fx.jobs.find((j) => j.name === dependent)!.conclusion, 'skipped');
    assert.equal(byId(dependent).outcome, 'skipped', dependent);
  }
  // GitHub shows nothing for the missing job, so the skipped dependent is where the simulation has to say why.
  assert.equal(byId('after_dynamic_empty').headline, "Skipped because dynamic_empty's matrix makes no job, which GitHub reports as failure.");
  assert.deepEqual(byId('after_dynamic_empty').rootCause?.causes.map((c) => [c.job, c.kind]), [['dynamic_empty', 'not-created']]);
  assert.match(byId('after_whole_json_empty_always').headline, /whole_json_empty counts as failed/);
  // the run as a whole concluded failure
  assert.equal(fx.conclusion, 'failure');
  assert.ok(sim.jobs.some((v) => v.result === 'failure'));
});

test('replay fixture-matrix: fail-fast cancels the other combinations with GitHub\'s annotation; without it they finish', async () => {
  const { sim } = await replayMatrix();
  const legs = (id: string) => sim.jobs.find((v) => v.job.id === id)!.matrix!.combinations;
  assert.deepEqual(legs('failfast').map((c) => [c.combination.name, c.result, c.annotation]), [
    ['failfast (1)', 'cancelled', 'The strategy configuration was canceled because "failfast._2" failed.'],
    ['failfast (2)', 'failure', undefined],
    ['failfast (3)', 'cancelled', 'The strategy configuration was canceled because "failfast._2" failed.'],
  ]);
  assert.deepEqual(legs('nofailfast').map((c) => [c.combination.name, c.result, c.annotation]), [
    ['nofailfast (1)', 'success', undefined], ['nofailfast (2)', 'failure', undefined], ['nofailfast (3)', 'success', undefined],
  ]);
});

test('replay fixture-matrix: a matrix job whose own if: is false is one skipped job, not expanded', async () => {
  const { fx, sim } = await replayMatrix();
  assert.deepEqual(fx.jobs.filter((j) => j.name.startsWith('skipped_matrix')).map((j) => [j.name, j.conclusion]), [['skipped_matrix', 'skipped']]);
  const v = sim.jobs.find((x) => x.job.id === 'skipped_matrix')!;
  assert.equal(v.outcome, 'skipped');
  assert.equal(v.matrix?.expansion.kind, 'not-expanded');
  assert.deepEqual(v.matrix?.combinations, []);
});

test('fixture-matrix without the plan outputs: the four matrices that read them are unknown, not guessed', async () => {
  const { base } = await replayMatrix();
  const sim = simulate({ ...base, outputs: undefined });
  for (const [id, output] of [['dynamic', 'some'], ['dynamic_empty', 'none'], ['whole_json', 'whole'], ['whole_json_empty', 'whole_empty']] as const) {
    const v = sim.jobs.find((x) => x.job.id === id)!;
    assert.equal(v.matrix?.expansion.kind, 'unknown', id);
    assert.deepEqual(v.matrix?.combinations, []);
    assert.match(v.headline, new RegExp(`needs\\.plan\\.outputs\\.${output}\\b`));
    assert.match(v.headline, /GitHub creates no job/);
  }
  // the jobs after an unknown matrix say what their verdict rests on
  assert.match(sim.jobs.find((x) => x.job.id === 'after_dynamic_empty')!.headline, /assumes the matrix of dynamic_empty makes at least one job/);
  // literal matrices do not depend on outputs
  assert.equal(sim.jobs.find((x) => x.job.id === 'plain')!.matrix?.combinations.length, 4);
});

// fixture-a's matrix_job: node [20, 22], exclude node 20, include {node: 24, experimental: true}. GitHub named the legs
// "matrix_job (22)" and "matrix_job (24, true)": the entry that made a combination of its own shows all its values.
test('replay fixture-a matrix_job: combination names and step outcomes in every run', async () => {
  const wf = await loadWorkflow('fixture-a');
  const runs = fixtures.filter((f) => f.workflow === 'fixture-a' && f.github);
  assert.ok(runs.length >= 20);
  for (const fx of runs) {
    const gh = fx.github!;
    const event = (gh['event'] ?? {}) as Record<string, unknown>;
    const sim = simulate({
      workflow: wf, github: gh, inputs: typedInputs((fx.inputs ?? {}) as Record<string, unknown>, wf),
      trigger: { event: fx.event, action: typeof event['action'] === 'string' ? event['action'] : undefined, refName: String(gh['ref_name']), refType: String(gh['ref']).startsWith('refs/tags/') ? 'tag' : 'branch', baseBranch: String(gh['base_ref'] || '') || undefined, changedFiles: fx.changed_files ?? [] },
    });
    assert.equal(sim.trigger.matched, true, `run ${fx.run_id}`);
    const recorded = fx.jobs.filter((j) => j.name === 'matrix_job' || j.name.startsWith('matrix_job ('));
    const v = sim.jobs.find((x) => x.job.id === 'matrix_job')!;
    if (recorded.length === 1 && recorded[0]!.name === 'matrix_job') {
      assert.equal(recorded[0]!.conclusion, 'skipped');
      assert.equal(v.outcome, 'skipped', `run ${fx.run_id}`);
      assert.equal(v.matrix?.expansion.kind, 'not-expanded');
      continue;
    }
    const combos = v.matrix!.combinations;
    assert.deepEqual(combos.map((c) => c.combination.name).sort(), recorded.map((j) => j.name).sort(), `run ${fx.run_id}`);
    for (const j of recorded) {
      const c = combos.find((x) => x.combination.name === j.name)!;
      assert.equal(conclusionOf(c.outcome), j.conclusion, `${j.name} in run ${fx.run_id}`);
      assert.deepEqual(c.stepVerdicts.map((s) => (stepRan(s) ? 'success' : 'skipped')), workflowSteps(j).map((s) => s.conclusion), `${j.name} steps in run ${fx.run_id}`);
    }
  }
});
