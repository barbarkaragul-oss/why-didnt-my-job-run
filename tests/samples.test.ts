/**
 * The sample workflows shipped in the UI must demonstrate what their blurbs promise. These run the
 * same code path as the page (scenario -> github context -> simulate) without a browser.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseWorkflowFile } from '../src/engine/workflow.js';
import { simulate } from '../src/engine/simulate.js';
import { SAMPLES } from '../src/ui/samples.js';
import { DEFAULT_STATE, toEngineInputs, type ScenarioState } from '../src/ui/scenario.js';

async function run(sampleId: string, override: Partial<ScenarioState> = {}) {
  const sample = SAMPLES.find((s) => s.id === sampleId)!;
  const state: ScenarioState = { ...DEFAULT_STATE, ...(sample.scenario as Partial<ScenarioState>), ...override };
  const workflow = await parseWorkflowFile(sample.yaml);
  const inputs = toEngineInputs(state, workflow);
  const sim = simulate({ workflow, github: inputs.github, inputs: inputs.inputs, trigger: inputs.trigger, forcedResults: state.forcedResults, cancelled: state.cancelled });
  const outcome = Object.fromEntries(sim.jobs.map((j) => [j.job.id, j.outcome]));
  const reason = Object.fromEntries(sim.jobs.map((j) => [j.job.id, j.headline]));
  return { workflow, sim, outcome, reason };
}

test('deploy-main: push to main runs deploy; a pull request skips it; a failed build skips deploy but not notify', async () => {
  const main = await run('deploy-main');
  assert.equal(main.sim.trigger.matched, true);
  assert.deepEqual(main.outcome, { build: 'runs', deploy: 'runs', notify: 'runs' });
  const pr = await run('deploy-main', { event: 'pull_request', action: 'opened' });
  assert.deepEqual(pr.outcome, { build: 'runs', deploy: 'skipped', notify: 'runs' });
  assert.match(pr.reason['deploy']!, /github\.ref is "refs\/pull\/\d+\/merge"/);
  const failed = await run('deploy-main', { forcedResults: { build: 'failure' } });
  assert.deepEqual(failed.outcome, { build: 'fails', deploy: 'skipped', notify: 'runs' });
  assert.match(failed.reason['deploy']!, /success\(\) is false because build failed/);
});

test('fork-footgun: the naive check runs on a push (null == false) and the fixed one does not', async () => {
  const push = await run('fork-footgun');
  assert.equal(push.outcome['internal-only'], 'runs');
  assert.equal(push.outcome['internal-only-fixed'], 'skipped');
  assert.match(push.reason['internal-only']!, /loose equality/);
  const forkPr = await run('fork-footgun', { event: 'pull_request', action: 'opened', fork: true });
  assert.equal(forkPr.outcome['internal-only'], 'skipped');
  assert.equal(forkPr.outcome['internal-only-fixed'], 'skipped');
  const ownPr = await run('fork-footgun', { event: 'pull_request', action: 'opened', fork: false });
  assert.equal(ownPr.outcome['internal-only'], 'runs');
  assert.equal(ownPr.outcome['internal-only-fixed'], 'runs');
});

test('label-gate: labeled event with the release label runs the checks; opened without the label does not; draft == false is true when draft is false', async () => {
  const labeled = await run('label-gate');
  assert.equal(labeled.sim.trigger.matched, true);
  assert.equal(labeled.outcome['release-checks'], 'runs');
  const opened = await run('label-gate', { action: 'opened', labels: 'bug' });
  assert.equal(opened.outcome['release-checks'], 'skipped');
  assert.equal(opened.outcome['draft-skip'], 'runs');
  const draft = await run('label-gate', { action: 'opened', labels: 'bug', draft: true });
  assert.equal(draft.outcome['draft-skip'], 'skipped');
  const unlisted = await run('label-gate', { action: 'unlabeled' });
  assert.equal(unlisted.sim.trigger.matched, false, 'unlabeled is not in types');
});

test('skipped-needs: on a tag push lint is skipped, so test is skipped without a condition; !cancelled() and always() rescue the reports', async () => {
  const tag = await run('skipped-needs');
  assert.equal(tag.outcome['lint'], 'skipped');
  assert.equal(tag.outcome['test'], 'skipped');
  assert.match(tag.reason['test']!, /lint was skipped/);
  assert.equal(tag.outcome['report'], 'runs');
  assert.equal(tag.outcome['report-only-if-test-ran'], 'skipped');
  assert.equal(tag.outcome['after-report'], 'skipped', 'always() rescues report only; after-report still sees the skipped ancestor');
  assert.match(tag.reason['after-report']!, /lint \(upstream\) was skipped/);
  const branch = await run('skipped-needs', { refType: 'branch', branch: 'feature/a' });
  assert.deepEqual(branch.outcome, { lint: 'runs', test: 'runs', report: 'runs', 'report-only-if-test-ran': 'runs', 'after-report': 'runs' });
});

test('dispatch-inputs: boolean input compares as a boolean in `inputs` and as a string in github.event.inputs', async () => {
  const on = await run('dispatch-inputs');
  assert.equal(on.outcome['deploy-bool'], 'runs');
  assert.equal(on.outcome['deploy-string'], 'skipped');
  assert.equal(on.outcome['deploy-event-inputs'], 'runs');
  assert.equal(on.outcome['production'], 'runs');
  const off = await run('dispatch-inputs', { inputs: { deploy: false, environment: 'staging' } });
  assert.equal(off.outcome['deploy-bool'], 'skipped');
  assert.equal(off.outcome['production'], 'skipped');
});

test('paths-filter: a docs-only push does not trigger; adding a source file does; test files are excluded on pull requests', async () => {
  const docsOnly = await run('paths-filter');
  assert.equal(docsOnly.sim.trigger.matched, false);
  const withSrc = await run('paths-filter', { changedFiles: 'docs/guide.md\nsrc/app.ts' });
  assert.equal(withSrc.sim.trigger.matched, true);
  const prTestOnly = await run('paths-filter', { event: 'pull_request', action: 'opened', changedFiles: 'src/app.test.ts' });
  assert.equal(prTestOnly.sim.trigger.matched, false);
  const prSrc = await run('paths-filter', { event: 'pull_request', action: 'opened', changedFiles: 'src/app.ts' });
  assert.equal(prSrc.sim.trigger.matched, true);
});

test('hashfiles-job-if: the job-level hashFiles is reported as something GitHub rejects and no job runs; the step-level one is fine', async () => {
  const r = await run('hashfiles-job-if');
  // GitHub's own parser reports it ("Unrecognized function: 'hashFiles'") and drops the condition, exactly like GitHub
  assert.ok(r.sim.fileProblems.some((p) => /hashFiles/.test(p)), JSON.stringify(r.sim.fileProblems));
  assert.equal(r.sim.rejected, true);
  assert.deepEqual(r.outcome, { 'needs-lockfile': 'rejected', fine: 'rejected' });
  assert.match(r.reason['fine']!, /GitHub rejects this workflow file/);
  const fine = r.sim.jobs.find((j) => j.job.id === 'fine')!;
  assert.deepEqual(fine.problems, []);
  assert.deepEqual(fine.stepVerdicts.flatMap((s) => s.problems), []);
});

test('push: typed changed files do not leak into github.event (Actions payloads carry no file lists)', async () => {
  const r = await run('paths-filter', { changedFiles: 'docs/guide.md\nsrc/app.ts' });
  const sample = SAMPLES.find((s) => s.id === 'paths-filter')!;
  const state: ScenarioState = { ...DEFAULT_STATE, ...(sample.scenario as Partial<ScenarioState>), changedFiles: 'docs/guide.md\nsrc/app.ts' };
  const inputs = toEngineInputs(state, r.workflow);
  const event = inputs.github['event'] as Record<string, unknown>;
  const head = event['head_commit'] as Record<string, unknown>;
  for (const k of ['added', 'modified', 'removed']) assert.equal(k in head, false, `head_commit.${k} must be absent`);
  for (const c of event['commits'] as Array<Record<string, unknown>>) for (const k of ['added', 'modified', 'removed']) assert.equal(k in c, false, `commits[].${k} must be absent`);
  assert.deepEqual(inputs.trigger.changedFiles, ['docs/guide.md', 'src/app.ts']);
});
