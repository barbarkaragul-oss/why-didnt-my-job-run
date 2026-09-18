/**
 * The limits notice: what the simulation cannot fully decide for this workflow and this event. Each kind is
 * detected where the engine marks something unknown or takes a value on trust, and only when it bears on a verdict
 * shown: nothing for a rejected file, an event that does not start the workflow, or the steps of a job that is
 * skipped. The samples show no notice unless their scenario leaves something open.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseWorkflowFile } from '../src/engine/workflow.js';
import { simulate, type Simulation } from '../src/engine/simulate.js';
import type { JobResult } from '../src/engine/evaluate.js';
import { SAMPLES } from '../src/ui/samples.js';
import { DEFAULT_STATE, toEngineInputs, type ScenarioState } from '../src/ui/scenario.js';

async function sim(yaml: string, opts: { state?: Partial<ScenarioState>; forced?: Record<string, JobResult>; outputs?: Record<string, Record<string, string>>; vars?: Record<string, string> } = {}): Promise<Simulation> {
  const wf = await parseWorkflowFile(yaml);
  const state: ScenarioState = { ...DEFAULT_STATE, event: 'push', refType: 'branch', branch: 'main', ...opts.state };
  const inputs = toEngineInputs(state, wf);
  return simulate({ workflow: wf, github: inputs.github, inputs: inputs.inputs, trigger: inputs.trigger, forcedResults: opts.forced, outputs: opts.outputs, vars: opts.vars });
}
const where = (s: Simulation) => Object.fromEntries(s.limits.map((l) => [l.kind, l.where]));

const RICH = `name: Rich
on: [push, pull_request]
concurrency: ci-\${{ github.ref }}
jobs:
  build:
    runs-on: ubuntu-latest
    outputs:
      version: \${{ steps.v.outputs.version }}
    steps:
      - id: v
        run: echo "version=1" >> "$GITHUB_OUTPUT"
      - name: Upload coverage
        if: steps.v.outcome == 'success'
        run: echo upload
      - if: hashFiles('**/package-lock.json') != ''
        run: npm ci
      - name: Logs on failure
        if: failure()
        run: echo logs
      - if: matrix.os == 'linux'
        run: echo linux
  release:
    needs: build
    if: needs.build.outputs.version != '' && vars.RELEASES != 'off'
    environment: production
    runs-on: ubuntu-latest
    steps: [{ run: echo release }]
  deploy:
    needs: build
    environment: { name: staging, url: 'https://staging.example.com' }
    runs-on: ubuntu-latest
    steps: [{ run: echo deploy }]
  call:
    needs: build
    uses: ./.github/workflows/deploy.yml
  pr-only:
    if: github.event_name == 'pull_request'
    uses: ./.github/workflows/preview.yml
`;

test('every kind is listed where this workflow uses it, each with what the simulation does instead', async () => {
  const s = await sim(RICH);
  assert.deepEqual(where(s), {
    'reusable-workflow': ['call (uses: ./.github/workflows/deploy.yml)'],
    'job-output': ['release reads needs.build.outputs.version'],
    vars: ['release reads vars.RELEASES'],
    'step-unknown': ["build · Upload coverage (if: steps.v.outcome == 'success')", "build · npm ci (if: hashFiles('**/package-lock.json') != '')"],
    'step-matrix': ["build · echo linux (if: matrix.os == 'linux')"],
    'step-failure': ['build · Logs on failure (if: failure())'],
    // release is skipped (null != '' is false: both count as 0), so only deploy's environment is listed
    environment: ['deploy (environment: staging)'],
    concurrency: ['the workflow (group: ci-${{ github.ref }})'],
  });
  for (const l of s.limits) {
    assert.ok(l.title.length > 0 && l.instead.endsWith('.'), l.kind);
    assert.doesNotMatch(l.instead, /\n/, 'one sentence');
  }
  // the order: what can change a verdict first
  assert.deepEqual(s.limits.map((l) => l.kind), ['reusable-workflow', 'job-output', 'vars', 'step-unknown', 'step-matrix', 'step-failure', 'environment', 'concurrency']);
});

test('what is given is not listed: an output value, a variable, a job that does not run', async () => {
  const given = await sim(RICH, { outputs: { build: { version: '1.2.0' } }, vars: { RELEASES: 'on' } });
  assert.equal(where(given)['job-output'], undefined);
  assert.equal(where(given)['vars'], undefined);
  // build fails: release is skipped (its environment no longer matters), call is skipped too
  const failed = await sim(RICH, { forced: { build: 'failure' } });
  assert.equal(where(failed)['environment'], undefined);
  assert.equal(where(failed)['reusable-workflow'], undefined);
  // a skipped job's outputs are empty on GitHub too: nothing unknown about them
  const skipped = await sim(`on: push
jobs:
  a:
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    outputs: { v: '\${{ steps.x.outputs.v }}' }
    steps: [{ id: x, run: echo }]
  b:
    needs: a
    if: always() && needs.a.outputs.v == ''
    runs-on: ubuntu-latest
    steps: [{ run: echo }]
  c:
    needs: a
    if: always() && needs.a.outputs.undeclared == ''
    runs-on: ubuntu-latest
    steps: [{ run: echo }]
`);
  assert.deepEqual(skipped.limits, []);
  // neither are the outputs of a matrix that made no job (the recorded empty matrix): no job wrote them
  const notCreated = await sim(`on: push
jobs:
  m:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        x: \${{ fromJSON('[]') }}
    outputs: { v: '\${{ steps.x.outputs.v }}' }
    steps: [{ id: x, run: echo }]
  r:
    needs: m
    if: always() && needs.m.outputs.v == ''
    runs-on: ubuntu-latest
    steps: [{ run: echo }]
`);
  assert.equal(notCreated.jobs.find((v) => v.job.id === 'm')!.outcome, 'not-created');
  assert.deepEqual(notCreated.limits, []);
});

test('no notice for a rejected file, for an event that does not start the workflow, or for the samples as they open', async () => {
  const rejected = await sim(`on: push
concurrency: x
jobs:
  a:
    if: hashFiles('x') != ''
    runs-on: ubuntu-latest
    steps: [{ run: echo }]
`);
  assert.equal(rejected.rejected, true);
  assert.deepEqual(rejected.limits, []);
  const blocked = await sim(RICH, { state: { event: 'workflow_dispatch' } });
  assert.equal(blocked.trigger.matched, false);
  assert.deepEqual(blocked.limits, []);
  for (const sample of SAMPLES) {
    const state = { ...DEFAULT_STATE, ...(sample.scenario as Partial<ScenarioState>) };
    const s = await sim(sample.yaml, { state, outputs: state.jobOutputs });
    assert.deepEqual(s.limits, [], sample.id);
  }
});

test('matrices: an output with no value yet, an outcome no run recorded, fail-fast timing, a name that reads matrix', async () => {
  const sample = SAMPLES.find((x) => x.id === 'matrix-empty')!;
  const state = { ...DEFAULT_STATE, ...(sample.scenario as Partial<ScenarioState>) };
  const unknown = await sim(sample.yaml, { state });
  assert.deepEqual(where(unknown), { 'matrix-output': ['test reads needs.plan.outputs.packages'] });
  // the recorded empty matrix is not an assumption
  const empty = await sim(sample.yaml, { state, outputs: { plan: { packages: '[]' } } });
  assert.deepEqual(empty.limits, []);
  const failing = await sim(sample.yaml, { state, outputs: { plan: { packages: '["api","web"]' } }, forced: { 'test.web_20': 'failure' } });
  assert.deepEqual(where(failing), { 'fail-fast': ['test: test (web, 20) failed, 3 cancelled'] });

  const s = await sim(`on: push
jobs:
  none_left:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        os: [linux]
        exclude: [{ os: linux }]
    steps: [{ run: echo }]
  named:
    name: build on \${{ matrix.os }}
    runs-on: ubuntu-latest
    strategy:
      matrix:
        os: [linux, mac]
    steps: [{ run: echo }]
`);
  assert.deepEqual(where(s), {
    'matrix-assumed': ['none_left: exclude removes every combination'],
    // the parser turns a name with ${{ }} inside into a format() call
    'matrix-name': ["named (name: ${{ format('build on {0}', matrix.os) }})"],
  });
});
