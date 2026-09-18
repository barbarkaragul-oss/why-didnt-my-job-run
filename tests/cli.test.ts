/**
 * The command line version against real git repositories: each test builds a small repository in a
 * temporary directory (git init, workflows with branches and paths filters, a few commits) and calls
 * the CLI's main() inside it, the way `npx why-didnt-my-job-run` would run there.
 */
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { main, repositoryFromUrl, type CliReport } from '../src/cli.js';

const scratch = mkdtempSync(path.join(tmpdir(), 'wdmjr-cli-'));
after(() => rmSync(scratch, { recursive: true, force: true }));

// The repositories are built with no global or system git config, so a signing or hook setting on the
// machine running the tests cannot change what gets committed.
const emptyConfig = path.join(scratch, 'empty.gitconfig');
writeFileSync(emptyConfig, '');
const gitEnv = { ...process.env, GIT_CONFIG_GLOBAL: emptyConfig, GIT_CONFIG_NOSYSTEM: '1', GIT_AUTHOR_NAME: 'Test', GIT_AUTHOR_EMAIL: 'test@example.com', GIT_COMMITTER_NAME: 'Test', GIT_COMMITTER_EMAIL: 'test@example.com' };
const git = (cwd: string, ...args: string[]) => execFileSync('git', args, { cwd, env: gitEnv, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();

const CI = `name: CI
on:
  push:
    branches: [main]
    paths: ['src/**']
  pull_request:
    branches: [main]
    paths: ['src/**']
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - run: echo build
  deploy:
    needs: build
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - run: echo deploy
  pr_only:
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    steps:
      - run: echo pr
`;

const DOCS = `name: Docs
on:
  push:
    paths: ['docs/**']
jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - run: echo publish
`;

const MANUAL = `name: Manual
on:
  workflow_dispatch:
    inputs:
      ship:
        type: boolean
        default: false
jobs:
  ship:
    if: inputs.ship
    runs-on: ubuntu-latest
    steps:
      - run: echo ship
`;

let counter = 0;
/** A repository on main with two commits: everything, then a change to src/app.ts. */
function makeRepo(): string {
  const dir = path.join(scratch, `repo${++counter}`);
  mkdirSync(path.join(dir, '.github', 'workflows'), { recursive: true });
  git(dir, 'init', '-q', '-b', 'main');
  write(dir, '.github/workflows/ci.yml', CI);
  write(dir, '.github/workflows/docs.yml', DOCS);
  write(dir, '.github/workflows/manual.yaml', MANUAL);
  write(dir, 'src/app.ts', 'export const a = 1;\n');
  write(dir, 'docs/index.md', '# Docs\n');
  write(dir, 'README.md', '# Demo\n');
  commit(dir, 'First commit');
  write(dir, 'src/app.ts', 'export const a = 2;\n');
  commit(dir, 'Change the app');
  return dir;
}

function write(dir: string, file: string, content: string) {
  mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
  writeFileSync(path.join(dir, file), content);
}

function commit(dir: string, message: string) {
  git(dir, 'add', '-A');
  git(dir, 'commit', '-q', '-m', message);
}

async function cli(cwd: string, ...args: string[]) {
  const out: string[] = [];
  const err: string[] = [];
  const code = await main(args, { cwd, out: (s) => out.push(s), err: (s) => err.push(s) });
  return { code, out: out.join('\n'), err: err.join('\n') };
}

async function report(cwd: string, ...args: string[]): Promise<CliReport> {
  const r = await cli(cwd, '--json', ...args);
  return JSON.parse(r.out) as CliReport;
}

const outcomes = (r: CliReport, file: string) => Object.fromEntries(r.workflows.find((w) => w.file === file)!.jobs.map((j) => [j.id, j.outcome]));

test('push: the changed files come from git diff HEAD^..HEAD, and --expect-run exits 1 only for a job that does not run', async () => {
  const repo = makeRepo();
  const r = await report(repo);
  assert.equal(r.event, 'push');
  assert.equal(r.ref, 'refs/heads/main');
  assert.deepEqual(r.facts.changedFiles, ['src/app.ts']);
  assert.equal(r.facts.sha, git(repo, 'rev-parse', 'HEAD'));
  assert.equal(r.facts.baseSha, git(repo, 'rev-parse', 'HEAD^'));
  assert.equal(r.facts.message, 'Change the app');
  assert.deepEqual(r.workflows.map((w) => [w.file, w.triggers]), [['.github/workflows/ci.yml', true], ['.github/workflows/docs.yml', false], ['.github/workflows/manual.yaml', false]]);
  assert.deepEqual(outcomes(r, '.github/workflows/ci.yml'), { build: 'runs', deploy: 'runs', pr_only: 'skipped' });
  assert.deepEqual(outcomes(r, '.github/workflows/docs.yml'), { publish: 'blocked' });

  const ok = await cli(repo, '--expect-run', 'deploy');
  assert.equal(ok.code, 0, ok.out + ok.err);
  assert.match(ok.out, /^1 changed file: git diff [0-9a-f]{7}\.\.[0-9a-f]{7}/m);
  assert.match(ok.out, /^\.github\/workflows\/ci\.yml · CI\n {2}triggers\n {4}on: push is present\.\n {4}branches: main matches "main"\n {4}paths: "src\/app\.ts" matches → runs$/m);
  assert.match(ok.out, /^ {2}skipped {3}pr_only {2}if: github\.event_name == 'pull_request'\n +→ github\.event_name is "push" → github\.event_name == 'pull_request' is false$/m);
  assert.match(ok.out, /^expect-run deploy: ok \(runs in \.github\/workflows\/ci\.yml\)$/m);

  const skipped = await cli(repo, '--expect-run', 'deploy', '--expect-run', 'pr_only');
  assert.equal(skipped.code, 1);
  assert.match(skipped.out, /^expect-run pr_only: FAILED \(skipped in \.github\/workflows\/ci\.yml\)$/m);
  const blocked = await cli(repo, '--expect-run', 'publish');
  assert.equal(blocked.code, 1);
  assert.match(blocked.out, /^ {4}paths: "src\/app\.ts" matches no paths pattern$/m);
});

test('push: --branch and --base change the ref and the diff; the first commit counts every file as changed', async () => {
  const repo = makeRepo();
  const feature = await cli(repo, '--branch', 'feature/x', '--expect-run', 'build');
  assert.equal(feature.code, 1);
  assert.match(feature.out, /^push to feature\/x at /m);
  assert.match(feature.out, /^ {4}branches: main does not match "feature\/x"$/m);

  const first = await report(repo, '--head', 'HEAD~1');
  assert.deepEqual(first.facts.changedFiles?.slice().sort(), ['.github/workflows/ci.yml', '.github/workflows/docs.yml', '.github/workflows/manual.yaml', 'README.md', 'docs/index.md', 'src/app.ts']);
  assert.match(first.facts.diff ?? '', /first commit/);
  assert.deepEqual(first.workflows.map((w) => w.triggers), [true, true, false]);

  // Several commits in one push: --base names the commit that was on the remote before.
  write(repo, 'docs/index.md', '# Docs, edited\n');
  commit(repo, 'Edit the docs');
  const one = await report(repo);
  assert.deepEqual(one.facts.changedFiles, ['docs/index.md']);
  assert.deepEqual(one.workflows.map((w) => w.triggers), [false, true, false]);
  const both = await report(repo, '--base', 'HEAD~2');
  assert.deepEqual(both.facts.changedFiles, ['docs/index.md', 'src/app.ts']);
  assert.deepEqual(both.workflows.map((w) => w.triggers), [true, true, false]);
  assert.equal(both.facts.sources.changedFiles, 'git');
});

test('pull_request: the diff starts at the merge base, so commits on the base branch do not count', async () => {
  const repo = makeRepo();
  git(repo, 'checkout', '-q', '-b', 'feature');
  write(repo, 'docs/guide.md', '# Guide\n');
  commit(repo, 'Docs only');
  // main moves on after the branch was cut; GitHub's three-dot diff leaves this change out
  git(repo, 'checkout', '-q', 'main');
  write(repo, 'src/other.ts', 'export const b = 1;\n');
  commit(repo, 'Main moves on');
  git(repo, 'checkout', '-q', 'feature');

  const docsOnly = await report(repo, '--event', 'pull_request', '--base', 'main');
  assert.deepEqual(docsOnly.facts.changedFiles, ['docs/guide.md']);
  assert.equal(docsOnly.facts.baseBranch, 'main');
  assert.equal(docsOnly.facts.branch, 'feature');
  assert.equal(docsOnly.facts.mergeBase, git(repo, 'merge-base', 'main', 'feature'));
  assert.equal(docsOnly.workflows[0]!.triggers, false);
  const docsOnlyText = await cli(repo, '--event', 'pull_request', '--expect-run', 'build');
  assert.equal(docsOnlyText.code, 1, 'without --base the base is the default branch, main');
  assert.match(docsOnlyText.out, /^pull_request \(opened\) from feature into main, head [0-9a-f]{7}/m);
  assert.match(docsOnlyText.out, /^1 changed file: git diff main\.\.\.HEAD/m);

  write(repo, 'src/app.ts', 'export const a = 3;\n');
  commit(repo, 'Change the app on the branch');
  const withSrc = await report(repo, '--event', 'pull_request', '--base', 'main');
  assert.deepEqual(withSrc.facts.changedFiles, ['docs/guide.md', 'src/app.ts']);
  assert.deepEqual(outcomes(withSrc, '.github/workflows/ci.yml'), { build: 'runs', deploy: 'skipped', pr_only: 'runs' });
  const github = (withSrc.workflows[0]!.jobs.find((j) => j.id === 'deploy')!.reason) ?? '';
  assert.match(github, /github\.event_name is "pull_request"/);
  const runs = await cli(repo, '--event', 'pull_request', '--expect-run', 'pr_only', '--expect-run', 'build');
  assert.equal(runs.code, 0, runs.out);

  // The same branch opened against another base: the branches filter blocks it.
  git(repo, 'branch', 'release', 'main');
  const release = await report(repo, '--event', 'pull_request', '--base', 'release');
  assert.equal(release.facts.baseBranch, 'release');
  assert.equal(release.workflows[0]!.triggers, false);
  assert.ok(release.workflows[0]!.triggerReasons.some((x) => /main does not match "release"/.test(x)), JSON.stringify(release.workflows[0]!.triggerReasons));
});

test('repository and default branch come from the origin remote; flags override them', async () => {
  const repo = makeRepo();
  git(repo, 'remote', 'add', 'origin', 'git@github.com:octo-org/demo.git');
  const fallback = await report(repo);
  assert.equal(fallback.facts.repository, 'octo-org/demo');
  assert.equal(fallback.facts.defaultBranch, 'main');
  assert.ok(fallback.facts.notes.some((n) => /origin\/HEAD is not set/.test(n)), JSON.stringify(fallback.facts.notes));
  const ci = fallback.workflows[0]!;
  assert.equal(ci.jobs.length, 3);

  // What `git clone` records: origin/HEAD pointing at the remote's default branch.
  git(repo, 'update-ref', 'refs/remotes/origin/trunk', 'HEAD');
  git(repo, 'symbolic-ref', 'refs/remotes/origin/HEAD', 'refs/remotes/origin/trunk');
  const cloned = await report(repo, '--event', 'schedule');
  assert.equal(cloned.facts.defaultBranch, 'trunk');
  assert.equal(cloned.facts.branch, 'trunk', 'schedule runs on the default branch');
  assert.equal(cloned.facts.changedFiles, undefined, 'schedule has no paths filters, so no diff');
  const pr = await report(repo, '--event', 'pull_request');
  assert.equal(pr.facts.baseBranch, 'trunk', 'a pull request targets origin/HEAD by default');

  const overridden = await report(repo, '--repo', 'someone/else', '--default-branch', 'develop', '--sha', 'abc123');
  assert.equal(overridden.facts.repository, 'someone/else');
  assert.equal(overridden.facts.defaultBranch, 'develop');
  assert.equal(overridden.facts.sha, 'abc123');
  assert.deepEqual(overridden.facts.sources, { branch: 'git', sha: 'flag', changedFiles: 'git', repository: 'flag', defaultBranch: 'flag' });
});

test('workflow_dispatch: --input is typed by the workflow\'s input definitions; --workflow limits the output', async () => {
  const repo = makeRepo();
  const off = await cli(repo, '--event', 'workflow_dispatch', '--workflow', 'manual.yaml', '--expect-run', 'ship');
  assert.equal(off.code, 1, off.out);
  assert.doesNotMatch(off.out, /ci\.yml/);
  const on = await cli(repo, '--event', 'workflow_dispatch', '--workflow', 'manual.yaml', '--input', 'ship=true', '--expect-run', 'ship');
  assert.equal(on.code, 0, on.out);
  assert.match(on.out, /inputs\.ship is true/);
});

test('--fail marks a job as failing, and the jobs after it see it', async () => {
  const repo = makeRepo();
  const r = await report(repo, '--fail', 'build');
  assert.deepEqual(outcomes(r, '.github/workflows/ci.yml'), { build: 'fails', deploy: 'skipped', pr_only: 'skipped' });
  assert.match(r.workflows[0]!.jobs.find((j) => j.id === 'deploy')!.headline, /success\(\) is false because build failed/);
});

// A matrix read from a job output, the "one job per changed package" pattern. What GitHub does with it is recorded
// in fixture-matrix and replayed in tests/matrix.test.ts; here only the flags that feed it are checked.
const MATRIX = `name: Matrix
on: push
jobs:
  plan:
    runs-on: ubuntu-latest
    outputs:
      targets: \${{ steps.p.outputs.targets }}
    steps:
      - id: p
        run: echo 'targets=["web","api"]' >> "$GITHUB_OUTPUT"
  test:
    needs: plan
    runs-on: ubuntu-latest
    strategy:
      matrix:
        target: \${{ fromJSON(needs.plan.outputs.targets) }}
    steps:
      - run: echo test
  after:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - run: echo after
`;

test('matrix: --output expands a matrix read from a job output, --fail and --expect-run name one combination', async () => {
  const repo = makeRepo();
  write(repo, '.github/workflows/matrix.yml', MATRIX);
  const only = ['--workflow', 'matrix.yml'];

  // Without the output the matrix is unknown, and the CLI offers the value the file itself writes.
  const unknown = await cli(repo, ...only);
  assert.equal(unknown.code, 0);
  assert.match(unknown.out, /to expand it: --output plan\.targets='\["web","api"\]'$/m);

  const given = ['--output', 'plan.targets=["web","api"]'];
  const r = await report(repo, ...only, ...given);
  const test = r.workflows[0]!.jobs.find((j) => j.id === 'test')!;
  assert.deepEqual(test.matrix?.combinations.map((c) => [c.name, c.outcome]), [['test (web)', 'runs'], ['test (api)', 'runs']]);
  const text = await cli(repo, ...only, ...given);
  assert.match(text.out, /^ +runs +test \(web\)\n +runs +test \(api\)$/m);

  // One combination fails: fail-fast cancels the other, and the job after the matrix sees failure.
  const failed = await cli(repo, ...only, ...given, '--fail', 'test:api', '--expect-run', 'test (web)', '--expect-run', 'test:api');
  assert.equal(failed.code, 1, failed.out);
  assert.match(failed.out, /^ +cancelled +test \(web\)\n +The strategy configuration was canceled because "test\.api" failed\.$/m);
  assert.match(failed.out, /^expect-run test \(web\): FAILED \(cancelled in \.github\/workflows\/matrix\.yml\)$/m);
  assert.match(failed.out, /^expect-run test:api: ok \(fails in \.github\/workflows\/matrix\.yml\)$/m);
  assert.match(failed.out, /^ +skipped +after\n +→ success\(\) is false because test failed$/m);

  // An empty list: GitHub creates no job for the matrix at all, and the job after it is skipped.
  const empty = await cli(repo, ...only, '--output', 'plan.targets=[]', '--expect-run', 'test');
  assert.equal(empty.code, 1);
  assert.match(empty.out, /^ +not-created +test$/m);
  assert.match(empty.out, /^expect-run test: FAILED \(not-created in \.github\/workflows\/matrix\.yml\)$/m);

  const wrong = await cli(repo, ...only, ...given, '--fail', 'test:db');
  assert.equal(wrong.code, 2);
  assert.match(wrong.err, /test has no such combination\. Its combinations: test:web, test:api\./);
});

test('errors: outside a repository, an unknown flag, an unknown job, an unknown event all exit with 2', async () => {
  const notRepo = path.join(scratch, 'plain');
  mkdirSync(notRepo, { recursive: true });
  const outside = await cli(notRepo);
  assert.equal(outside.code, 2);
  assert.match(outside.err, /not inside a git repository/);
  const repo = makeRepo();
  assert.equal((await cli(repo, '--frobnicate')).code, 2);
  const unknownJob = await cli(repo, '--expect-run', 'nope');
  assert.equal(unknownJob.code, 2);
  assert.match(unknownJob.err, /--expect-run nope: no job or matrix combination with that name/);
  assert.equal((await cli(repo, '--event', 'pushh')).code, 2);
  assert.equal((await cli(repo, '--event', 'pull_request', '--action', 'exploded')).code, 2);
  const help = await cli(repo, '--help');
  assert.equal(help.code, 0);
  assert.match(help.out, /^Usage: why-didnt-my-job-run \[options\]$/m);
});

test('repositoryFromUrl reads owner/name from the usual remote URL shapes', () => {
  for (const url of ['https://github.com/octo-org/demo.git', 'https://github.com/octo-org/demo', 'git@github.com:octo-org/demo.git', 'ssh://git@github.com/octo-org/demo.git', 'ssh://git@github.com:22/octo-org/demo.git', 'https://user:token@github.example.com/octo-org/demo.git']) {
    assert.equal(repositoryFromUrl(url), 'octo-org/demo', url);
  }
});

test('the committed bundle, dist/cli.js, runs with nothing but Node', async () => {
  const repo = makeRepo();
  const bundle = path.resolve('dist/cli.js');
  const help = spawnSync(process.execPath, [bundle, '--help'], { encoding: 'utf8' });
  assert.equal(help.status, 0, help.stderr);
  assert.match(help.stdout, /^Usage: why-didnt-my-job-run/m);
  const run = spawnSync(process.execPath, [bundle, '--expect-run', 'deploy'], { cwd: repo, encoding: 'utf8' });
  assert.equal(run.status, 0, run.stdout + run.stderr);
  const no = spawnSync(process.execPath, [bundle, '--expect-run', 'publish'], { cwd: repo, encoding: 'utf8' });
  assert.equal(no.status, 1, no.stdout + no.stderr);
});
