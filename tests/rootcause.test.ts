/**
 * The root cause a skipped job's card names: the job on the needs chain where the skip started, and that job's own
 * reason. Checked on the two chain workflows whose conclusions were recorded (fixture-chain: a fails, and b, which
 * needs it, is skipped; fixture-chain2: x is skipped by its own condition), with the recorded failure forced as
 * replay.test.ts does. replay.test.ts checks that every job's run or skip matches GitHub; this file checks which job
 * each skipped card blames, and that the cards of the jobs that ran say what they said before.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { parseWorkflowFile } from '../src/engine/workflow.js';
import { simulate, type JobVerdict, type Simulation } from '../src/engine/simulate.js';
import type { JobResult } from '../src/engine/evaluate.js';
import { DEFAULT_STATE, toEngineInputs, type ScenarioState } from '../src/ui/scenario.js';

async function push(yaml: string, forced: Record<string, JobResult> = {}, extra: Partial<ScenarioState> = {}, cancelled = false): Promise<Simulation> {
  const wf = await parseWorkflowFile(yaml);
  assert.deepEqual(wf.errors, []);
  const state: ScenarioState = { ...DEFAULT_STATE, event: 'push', refType: 'branch', branch: 'main', ...extra };
  const inputs = toEngineInputs(state, wf);
  return simulate({ workflow: wf, github: inputs.github, inputs: inputs.inputs, trigger: inputs.trigger, forcedResults: forced, cancelled });
}
const fixture = (name: string) => readFileSync(path.resolve('tests/fixtures/workflows', `${name}.yml`), 'utf8');

/** [root job, kind, the path to it as job:result] for every cause a job names. */
const causes = (v: JobVerdict) => v.rootCause?.causes.map((c) => [c.job, c.kind, c.via.map((h) => `${h.job}:${h.result}`)]);

/** A job that ran keeps the headline it had before root causes existed. */
function assertRanUnchanged(v: JobVerdict) {
  assert.equal(v.rootCause, undefined, `${v.job.id} ran, so it has no root cause`);
  const ev = v.evaluation;
  assert.ok(ev && ev.ok, v.job.id);
  const expected = v.outcome === 'fails' ? 'Runs, and you marked it as failing.' : v.job.ifSource ? `Runs: ${ev.reason}` : 'Runs: no condition, and every job it needs succeeded.';
  assert.equal(v.headline, expected, v.job.id);
}

test('fixture-chain (a fails): every skipped job names a, through the jobs between', async () => {
  const sim = await push(fixture('fixture-chain'), { a: 'failure' });
  const byId = Object.fromEntries(sim.jobs.map((v) => [v.job.id, v]));
  assert.deepEqual(causes(byId['b']!), [['a', 'failed', []]]);
  assert.equal(byId['b']!.headline, 'Skipped because a failed.');
  assert.deepEqual(causes(byId['g_success']!), [['a', 'failed', ['b:skipped']]]);
  assert.equal(byId['g_success']!.headline, 'Skipped because b was skipped, because a failed.');
  // ok succeeded; only b's side is named
  assert.deepEqual(causes(byId['l_mixed_needs_success']!), [['a', 'failed', ['b:skipped']]]);
  // h_after_c and c_failure_via_b ran, yet success() sees b and a upstream of them
  for (const id of ['i2_three_deep_success', 'i3_three_deep_no_if']) {
    assert.deepEqual(causes(byId[id]!), [['a', 'failed', ['h_after_c:success', 'c_failure_via_b:success', 'b:skipped']]], id);
    assert.equal(byId[id]!.headline, 'Skipped because upstream of h_after_c (which ran), b was skipped, because a failed. success() looks at every job upstream, not only the ones in needs.', id);
  }
  // skipped by its own failure(): nothing upstream failed on its path, and nothing upstream is to blame
  assert.equal(byId['m_after_ok_failure']!.outcome, 'skipped');
  assert.equal(byId['m_after_ok_failure']!.rootCause, undefined);
  assert.equal(byId['m_after_ok_failure']!.headline, 'Skipped: failure() is false: no job upstream failed');
  for (const v of sim.jobs.filter((x) => x.outcome === 'runs' || x.outcome === 'fails')) assertRanUnchanged(v);
  assert.deepEqual(sim.jobs.filter((v) => v.outcome === 'skipped' && !v.rootCause).map((v) => v.job.id), ['m_after_ok_failure']);
});

test('fixture-chain2 (x skipped by its own condition): the skipped jobs name x and the comparison that skipped it', async () => {
  const sim = await push(fixture('fixture-chain2'));
  const byId = Object.fromEntries(sim.jobs.map((v) => [v.job.id, v]));
  const x = "x_skipped_by_if's condition github.ref_name == 'never-this-branch' is false (github.ref_name is \"main\")";
  // x itself is skipped by its own condition: its headline is that condition, not a root cause
  assert.equal(byId['x_skipped_by_if']!.rootCause, undefined);
  assert.equal(byId['x_skipped_by_if']!.headline, 'Skipped: github.ref_name is "main" → github.ref_name == \'never-this-branch\' is false');
  assert.deepEqual(causes(byId['v_no_if_after_x']!), [['x_skipped_by_if', 'condition', []]]);
  assert.equal(byId['v_no_if_after_x']!.headline, `Skipped because ${x}.`);
  const decisive = byId['v_no_if_after_x']!.rootCause!.causes[0]!.decisive!;
  assert.deepEqual([decisive.text, decisive.value, decisive.sides], ["github.ref_name == 'never-this-branch'", 'false', ['github.ref_name is "main"']]);
  // y ran with always(); success() after it still sees x (recorded: z and z2 skipped)
  for (const id of ['z_no_if_after_y', 'z2_success_after_y']) {
    assert.deepEqual(causes(byId[id]!), [['x_skipped_by_if', 'condition', ['y_always_after_x:success']]], id);
    assert.equal(byId[id]!.headline, `Skipped because upstream of y_always_after_x (which ran), ${x}. success() looks at every job upstream, not only the ones in needs.`, id);
  }
  assert.deepEqual(causes(byId['t_no_if_after_u']!), [['x_skipped_by_if', 'condition', ['u_after_v:success', 'v_no_if_after_x:skipped']]]);
  assert.equal(byId['t_no_if_after_u']!.headline, `Skipped because upstream of u_after_v (which ran), v_no_if_after_x was skipped, because ${x}. success() looks at every job upstream, not only the ones in needs.`);
  // failure() is false when upstream jobs were only skipped (recorded: z3 skipped); that is its own condition
  assert.equal(byId['z3_failure_after_y']!.rootCause, undefined);
  for (const v of sim.jobs.filter((j) => j.outcome === 'runs')) assertRanUnchanged(v);
});

test('several needs that did not succeed: each root cause once, at most two named, then how many more', async () => {
  const sim = await push(`on: push
jobs:
  p:
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    steps: [{ run: echo }]
  q:
    runs-on: ubuntu-latest
    steps: [{ run: echo }]
  r:
    if: github.ref_name == 'release'
    runs-on: ubuntu-latest
    steps: [{ run: echo }]
  p2:
    needs: p
    runs-on: ubuntu-latest
    steps: [{ run: echo }]
  p3:
    needs: p
    runs-on: ubuntu-latest
    steps: [{ run: echo }]
  diamond:
    needs: [p2, p3]
    runs-on: ubuntu-latest
    steps: [{ run: echo }]
  two:
    needs: [p, q]
    runs-on: ubuntu-latest
    steps: [{ run: echo }]
  three:
    needs: [p2, q, r]
    runs-on: ubuntu-latest
    steps: [{ run: echo }]
`, { q: 'failure' });
  const byId = Object.fromEntries(sim.jobs.map((v) => [v.job.id, v]));
  // two paths to p: named once, through the first need
  assert.deepEqual(causes(byId['diamond']!), [['p', 'condition', ['p2:skipped']]]);
  assert.equal(byId['two']!.headline, 'Skipped because p\'s condition github.event_name == \'pull_request\' is false (github.event_name is "push"); and because q failed.');
  assert.deepEqual(causes(byId['three']!), [['p', 'condition', ['p2:skipped']], ['q', 'failed', []], ['r', 'condition', []]]);
  assert.equal(byId['three']!.headline, 'Skipped because p2 was skipped, because p\'s condition github.event_name == \'pull_request\' is false (github.event_name is "push"); and because q failed; and 1 more: r.');
  // the page sets job ids and expressions as code
  assert.deepEqual(byId['two']!.rootCause!.segments.filter((s) => s.code).map((s) => s.text), ['p', "github.event_name == 'pull_request'", 'q']);
  assert.equal(byId['two']!.rootCause!.segments.map((s) => s.text).join(''), byId['two']!.rootCause!.line);
});

test('a need with a cause of its own passes on the causes behind it: fixing that need alone would still skip the job', async () => {
  // b is decided with always(), so a's failure does not skip it; b's own condition does. d's success() sees both.
  const skippedOwn = await push(`on: push
jobs:
  a:
    runs-on: ubuntu-latest
    steps: [{ run: exit 1 }]
  b:
    needs: a
    if: always() && github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    steps: [{ run: echo }]
  d:
    needs: b
    runs-on: ubuntu-latest
    steps: [{ run: echo }]
`, { a: 'failure' });
  const d = skippedOwn.jobs.find((v) => v.job.id === 'd')!;
  assert.deepEqual(causes(d), [['b', 'condition', []], ['a', 'failed', ['b:skipped']]]);
  assert.equal(d.rootCause!.causes[1]!.via[0]!.own, true);
  assert.equal(d.headline, 'Skipped because b\'s condition github.event_name == \'pull_request\' is false (github.event_name is "push"); and because upstream of b, a failed. success() looks at every job upstream, not only the ones in needs.');

  // y ran with always() after x was skipped, and failed: z names y, and x behind it (x is the fixture-chain2 shape).
  const failedAfterAlways = await push(`on: push
jobs:
  x:
    if: github.ref_name == 'never-this-branch'
    runs-on: ubuntu-latest
    steps: [{ run: echo }]
  y:
    needs: x
    if: always()
    runs-on: ubuntu-latest
    steps: [{ run: echo }]
  z:
    needs: y
    runs-on: ubuntu-latest
    steps: [{ run: echo }]
  after_z:
    needs: z
    runs-on: ubuntu-latest
    steps: [{ run: echo }]
`, { y: 'failure' });
  const byId = Object.fromEntries(failedAfterAlways.jobs.map((v) => [v.job.id, v]));
  assert.deepEqual(causes(byId['z']!), [['y', 'failed', []], ['x', 'condition', ['y:failure']]]);
  assert.equal(byId['z']!.headline, 'Skipped because y failed; and because upstream of y, x\'s condition github.ref_name == \'never-this-branch\' is false (github.ref_name is "main"). success() looks at every job upstream, not only the ones in needs.');
  // one hop further: z passes both on
  assert.equal(byId['after_z']!.headline, 'Skipped because z was skipped, because y failed; and because z was skipped, because upstream of y, x\'s condition github.ref_name == \'never-this-branch\' is false (github.ref_name is "main"). success() looks at every job upstream, not only the ones in needs.');
});

test('a rejected file and an event that does not start the workflow name no root cause', async () => {
  const yaml = `on: push
jobs:
  a:
    if: hashFiles('x') != ''
    runs-on: ubuntu-latest
    steps: [{ run: echo }]
  b:
    needs: a
    runs-on: ubuntu-latest
    steps: [{ run: echo }]
`;
  const wf = await parseWorkflowFile(yaml);
  const inputs = toEngineInputs({ ...DEFAULT_STATE, event: 'push', refType: 'branch', branch: 'main' }, wf);
  const rejected = simulate({ workflow: wf, github: inputs.github, inputs: inputs.inputs, trigger: inputs.trigger });
  assert.equal(rejected.rejected, true);
  assert.deepEqual(rejected.jobs.map((v) => [v.job.id, v.outcome, v.rootCause]), [['a', 'rejected', undefined], ['b', 'rejected', undefined]]);
  const blocked = await push(fixture('fixture-chain2'), {}, { event: 'pull_request' });
  assert.equal(blocked.trigger.matched, false);
  assert.deepEqual(blocked.jobs.filter((v) => v.rootCause).map((v) => v.job.id), []);
});

test('the job\'s own condition is weighed too, unless it wrote a status function itself; a cancelled run names no root cause', async () => {
  const yaml = `on: push
jobs:
  build:
    if: github.ref_type == 'tag'
    runs-on: ubuntu-latest
    steps: [{ run: echo }]
  own_true:
    needs: build
    if: github.event_name == 'push'
    runs-on: ubuntu-latest
    steps: [{ run: echo }]
  own_false:
    needs: build
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    steps: [{ run: echo }]
  explicit:
    needs: build
    if: success() && github.event_name == 'push'
    runs-on: ubuntu-latest
    steps: [{ run: echo }]
`;
  const sim = await push(yaml);
  const byId = Object.fromEntries(sim.jobs.map((v) => [v.job.id, v]));
  const build = "Skipped because build's condition github.ref_type == 'tag' is false (github.ref_type is \"branch\").";
  assert.equal(byId['own_true']!.headline, `${build} Its own condition is true for this event.`);
  assert.equal(byId['own_false']!.headline, `${build} Its own condition is false too: github.event_name is "push" → github.event_name == 'pull_request' is false.`);
  assert.equal(byId['explicit']!.headline, build);
  assert.equal(byId['explicit']!.rootCause!.ownCondition, undefined);
  const cancelled = await push(yaml, {}, {}, true);
  assert.deepEqual(cancelled.jobs.filter((v) => v.rootCause).map((v) => v.job.id), []);
  assert.match(cancelled.jobs.find((v) => v.job.id === 'own_true')!.headline, /the run was cancelled/);
});
