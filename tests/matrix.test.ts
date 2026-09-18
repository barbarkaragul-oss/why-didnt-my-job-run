/**
 * The matrix expansion on its own: the include/exclude rules with the recorded case (fixture-matrix, run
 * 35329520473) and the examples in GitHub's docs ("Running variations of jobs in a workflow"), the names and ids,
 * and what happens when a matrix reads a job output.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseWorkflowFile } from '../src/engine/workflow.js';
import { expandMatrix, strategyFileProblems, matrixOutputFields, echoedOutput, describeStrategy, type MatrixContexts, type MatrixExpansion } from '../src/engine/matrix.js';
import type { JobResult } from '../src/engine/evaluate.js';
import { simulate } from '../src/engine/simulate.js';
import { DEFAULT_STATE, toEngineInputs } from '../src/ui/scenario.js';

/** A one-job workflow with this strategy (indented under `strategy:`), parsed by GitHub's parser. */
async function job(strategy: string, extra = '') {
  const yaml = `on: push\njobs:\n  plan:\n    runs-on: ubuntu-latest\n    outputs:\n      list: \${{ steps.p.outputs.list }}\n    steps:\n      - id: p\n        run: echo 'list=["x"]' >> "$GITHUB_OUTPUT"\n  j:\n    needs: plan\n    runs-on: ubuntu-latest\n${extra}    strategy:\n${strategy.replace(/^/gm, '      ')}\n    steps:\n      - run: echo\n`;
  const wf = await parseWorkflowFile(yaml);
  assert.deepEqual(wf.errors, []);
  return { wf, job: wf.jobs.find((j) => j.id === 'j')! };
}

const ctx = (outputs?: Record<string, string>, result: JobResult = 'success'): MatrixContexts => ({ github: {}, inputs: {}, vars: {}, needs: { plan: { result, outputs } }, declaredOutputs: { plan: ['list'] } });

function combos(e: MatrixExpansion) {
  assert.equal(e.kind, 'combinations', JSON.stringify(e));
  return e.kind === 'combinations' ? e.combinations.map((c) => ({ name: c.name, matrix: c.matrix })) : [];
}

test('include and exclude: the recorded case (fixture-matrix, include_exclude)', async () => {
  const { job: j } = await job(`matrix:
  fruit: [apple, pear]
  animal: [cat, dog]
  exclude:
    - fruit: pear
      animal: dog
  include:
    - color: green
    - fruit: apple
      shape: circle
    - fruit: banana
    - fruit: banana
      animal: cat`);
  assert.deepEqual(combos(expandMatrix(j, ctx())), [
    { name: 'j (apple, cat)', matrix: { fruit: 'apple', animal: 'cat', color: 'green', shape: 'circle' } },
    { name: 'j (apple, dog)', matrix: { fruit: 'apple', animal: 'dog', color: 'green', shape: 'circle' } },
    { name: 'j (pear, cat)', matrix: { fruit: 'pear', animal: 'cat', color: 'green' } },
    { name: 'j (banana)', matrix: { fruit: 'banana' } },
    { name: 'j (banana, cat)', matrix: { fruit: 'banana', animal: 'cat' } },
  ]);
});

test('include: a later entry overwrites a value an earlier entry added (docs, "Expanding or adding matrix configurations")', async () => {
  const { job: j } = await job(`matrix:
  fruit: [apple, pear]
  animal: [cat, dog]
  include:
    - color: green
    - color: pink
      animal: cat
    - fruit: apple
      shape: circle
    - fruit: banana
    - fruit: banana
      animal: cat`);
  // The docs list exactly these six.
  assert.deepEqual(combos(expandMatrix(j, ctx())).map((c) => c.matrix), [
    { fruit: 'apple', animal: 'cat', color: 'pink', shape: 'circle' },
    { fruit: 'apple', animal: 'dog', color: 'green', shape: 'circle' },
    { fruit: 'pear', animal: 'cat', color: 'pink' },
    { fruit: 'pear', animal: 'dog', color: 'green' },
    { fruit: 'banana' },
    { fruit: 'banana', animal: 'cat' },
  ]);
});

test('exclude: a partial match is enough (docs, "Excluding matrix configurations")', async () => {
  const { job: j } = await job(`matrix:
  os: [macos-latest, windows-latest]
  version: [12, 14, 16]
  environment: [staging, production]
  exclude:
    - os: macos-latest
      version: 12
      environment: production
    - os: windows-latest
      version: 16`);
  const names = combos(expandMatrix(j, ctx())).map((c) => c.name);
  assert.equal(names.length, 12 - 1 - 2);
  assert.ok(!names.includes('j (macos-latest, 12, production)'));
  assert.ok(!names.some((n) => n.startsWith('j (windows-latest, 16')));
  assert.equal(names[0], 'j (macos-latest, 12, staging)', 'first key outermost, as GitHub orders them');
});

test('include: an entry matching one combination extends only that one; an entry that fits none is a job of its own, named by all its values', async () => {
  const { job: j } = await job(`matrix:
  os: [windows-latest, ubuntu-latest]
  node: [14, 16]
  include:
    - os: windows-latest
      node: 16
      npm: 6
    - os: macos-latest
      experimental: true`);
  assert.deepEqual(combos(expandMatrix(j, ctx())), [
    { name: 'j (windows-latest, 14)', matrix: { os: 'windows-latest', node: 14 } },
    { name: 'j (windows-latest, 16)', matrix: { os: 'windows-latest', node: 16, npm: 6 } },
    { name: 'j (ubuntu-latest, 14)', matrix: { os: 'ubuntu-latest', node: 14 } },
    { name: 'j (ubuntu-latest, 16)', matrix: { os: 'ubuntu-latest', node: 16 } },
    { name: 'j (macos-latest, true)', matrix: { os: 'macos-latest', experimental: true } },
  ]);
});

test('include and exclude compare with GitHub\'s loose ==: "20" matches 20 and strings ignore case', async () => {
  const { job: j } = await job(`matrix:
  os: [linux, mac]
  node: [20, 22]
  exclude:
    - os: MAC
  include:
    - node: '20'
      lts: true`);
  assert.deepEqual(combos(expandMatrix(j, ctx())).map((c) => c.matrix), [
    { os: 'linux', node: 20, lts: true },
    { os: 'linux', node: 22 },
  ]);
});

test('names and ids: nested values, empty strings and nulls, 100-character names, colliding ids', async () => {
  const { job: j } = await job(`matrix:
  cfg: [{os: linux, v: 1}, {os: '', v: null}]
  label: ['a b', 'a_b']`);
  const e = expandMatrix(j, ctx());
  assert.equal(e.kind, 'combinations');
  if (e.kind !== 'combinations') return;
  assert.deepEqual(e.combinations.map((c) => [c.name, c.id]), [
    ['j (linux, 1, a b)', 'linux_1_a_b'],
    ['j (linux, 1, a_b)', 'linux_1_a_b_2'],
    ['j (a b)', 'a_b'],
    ['j (a_b)', 'a_b_2'],
  ]);
  const long = await job(`matrix:\n  x: ['${'y'.repeat(120)}']`);
  const l = expandMatrix(long.job, ctx());
  assert.equal(l.kind === 'combinations' ? l.combinations[0]!.name : '', `j (${'y'.repeat(97 - 3)}...`);
});

test('a job name that reads matrix is used as it is, without the values appended', async () => {
  const { job: j } = await job('matrix:\n  os: [linux, mac]', '    name: Test on ${{ matrix.os }}\n');
  assert.deepEqual(combos(expandMatrix(j, ctx())).map((c) => c.name), ['Test on linux', 'Test on mac']);
  const plain = await job('matrix:\n  os: [linux, mac]', '    name: Test\n');
  assert.deepEqual(combos(expandMatrix(plain.job, ctx())).map((c) => c.name), ['Test (linux)', 'Test (mac)']);
});

test('a matrix read from a job output: unknown until given, expanded when given, empty when the list is empty', async () => {
  const { wf, job: j } = await job('matrix:\n  item: ${{ fromJSON(needs.plan.outputs.list) }}');
  const unknown = expandMatrix(j, ctx());
  assert.equal(unknown.kind, 'unknown');
  assert.deepEqual(unknown.kind === 'unknown' ? unknown.reads.map((r) => [r.job, r.output, r.source]) : [], [['plan', 'list', 'unknown']]);
  assert.deepEqual(combos(expandMatrix(j, ctx({ list: '["x", "y"]' }))).map((c) => c.name), ['j (x)', 'j (y)']);
  const empty = expandMatrix(j, ctx({ list: '[]' }));
  assert.equal(empty.kind, 'empty');
  // a skipped job has no outputs: fromJSON of nothing fails, so no job is made (inferred, not recorded)
  assert.equal(expandMatrix(j, ctx(undefined, 'skipped')).kind, 'error');
  // the page offers the value the file echoes
  assert.deepEqual(matrixOutputFields(wf).map((f) => [f.job, f.output, f.readBy, f.wholeMatrix, f.example]), [['plan', 'list', ['j'], false, '["x"]']]);
});

test('a job output used without fromJSON is a string, not a list, and the reason says so', async () => {
  const { job: j } = await job('matrix:\n  item: ${{ needs.plan.outputs.list }}');
  const e = expandMatrix(j, ctx({ list: '["x"]' }));
  assert.equal(e.kind, 'error');
  assert.match(e.kind === 'error' ? e.reason : '', /must be a list, but it is the string '\["x"\]'.*fromJSON/);
});

test('what GitHub rejects when it loads the file: literal empty lists, exclude keys that are not in the matrix', async () => {
  const empty = await job('matrix:\n  os: []');
  assert.deepEqual(strategyFileProblems(empty.job).map((p) => p.replace(/^.*?: /, '')), ["Matrix vector 'os' does not contain any values"]);
  const bad = await job('matrix:\n  os: [linux]\n  exclude:\n    - arch: arm');
  assert.deepEqual(strategyFileProblems(bad.job).map((p) => p.replace(/^.*?: /, '')), ["Matrix exclude key 'arch' does not match any key within the matrix"]);
  const nothing = await job('matrix:\n  include: []');
  assert.deepEqual(strategyFileProblems(nothing.job).map((p) => p.replace(/^.*?: /, '')), ['Matrix must define at least one vector']);
  // decided at run time, not at load time
  const dynamic = await job('matrix:\n  os: ${{ fromJSON(needs.plan.outputs.list) }}\n  exclude:\n    - arch: arm');
  assert.deepEqual(strategyFileProblems(dynamic.job), []);
});

test('the strategy in one line', async () => {
  const { job: j } = await job('fail-fast: false\nmax-parallel: 2\nmatrix:\n  os: [linux, mac]\n  node: [20, 22]\n  include:\n    - os: linux\n      extra: 1');
  assert.equal(describeStrategy(j.strategy), 'matrix: os [linux, mac] × node [20, 22], include: 1 entry · fail-fast: false · max-parallel: 2 (how many run at once; no outcome depends on it)');
});

test('example values from `echo name=value >> $GITHUB_OUTPUT`, and none when the shell would expand the value', () => {
  assert.equal(echoedOutput(`echo 'list=["a","b"]' >> "$GITHUB_OUTPUT"`, 'list'), '["a","b"]');
  assert.equal(echoedOutput('echo "list=[\\"a\\"]" >> $GITHUB_OUTPUT', 'list'), '["a"]');
  assert.equal(echoedOutput('echo list=[] >> ${GITHUB_OUTPUT}', 'list'), '[]');
  assert.equal(echoedOutput('echo "list=$(ls | jq -Rsc .)" >> "$GITHUB_OUTPUT"', 'list'), undefined);
  assert.equal(echoedOutput(`echo 'other=1' >> "$GITHUB_OUTPUT"`, 'list'), undefined);
});

test('exclude that removes every combination: no job, marked as assumed rather than recorded', async () => {
  const { job: j } = await job('matrix:\n  os: [linux]\n  exclude:\n    - os: linux');
  const all = expandMatrix(j, ctx());
  assert.equal(all.kind, 'empty');
  assert.equal(all.kind === 'empty' && all.recorded, false);
  const { job: listed } = await job('matrix:\n  item: ${{ fromJSON(needs.plan.outputs.list) }}');
  const list = expandMatrix(listed, ctx({ list: '[]' }));
  assert.equal(list.kind === 'empty' && list.recorded, true, 'an empty list is what fixture-matrix recorded');
});

test('a job without a matrix: a step that reads matrix stays unknown, as before matrices were simulated', async () => {
  const wf = await parseWorkflowFile('on: push\njobs:\n  j:\n    runs-on: ubuntu-latest\n    steps:\n      - if: matrix.os == \'linux\'\n        run: echo\n      - if: strategy.job-index == 0\n        run: echo\n');
  const inputs = toEngineInputs({ ...DEFAULT_STATE, event: 'push', branch: 'main' }, wf);
  const v = simulate({ workflow: wf, github: inputs.github, inputs: inputs.inputs, trigger: inputs.trigger }).jobs[0]!;
  assert.equal(v.matrix, undefined);
  assert.match(v.stepVerdicts[0]!.unknown ?? '', /reads matrix, which the simulation does not know in a job without a matrix/);
  assert.equal(v.stepVerdicts[1]!.unknown, undefined, 'strategy was evaluated before too');
});

test('a matrix made only of include entries: one job per entry, named by all its values (docs, "Adding configurations")', async () => {
  const { job: j } = await job(`matrix:
  include:
    - site: production
      datacenter: site-a
    - site: staging
      datacenter: site-b`);
  assert.deepEqual(combos(expandMatrix(j, ctx())), [
    { name: 'j (production, site-a)', matrix: { site: 'production', datacenter: 'site-a' } },
    { name: 'j (staging, site-b)', matrix: { site: 'staging', datacenter: 'site-b' } },
  ]);
});
