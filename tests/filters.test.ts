/**
 * Filter patterns against every example in the GitHub Docs filter cheat sheet (data/docs/filters.json,
 * extracted with verbatim quotes) plus the negation ordering examples.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { compilePattern, matchPatterns, matchPaths, decideTrigger, validateTriggers, triggerWarnings } from '../src/engine/filters.js';
import { parseWorkflowFile } from '../src/engine/workflow.js';

interface Docs {
  pattern_examples: Array<{ pattern: string; matches: string[]; does_not_match: string[]; kind: string }>;
  negation_examples: Array<{ patterns: string[]; matches: string[]; does_not_match: string[]; kind: string }>;
}
const docs = JSON.parse(readFileSync('data/docs/filters.json', 'utf8')) as Docs;
const unquote = (p: string) => p.replace(/^'(.*)'$/, '$1');

test('every pattern example in the docs cheat sheet matches what the docs say it matches', () => {
  const failures: string[] = [];
  for (const ex of docs.pattern_examples) {
    if (ex.pattern.includes(' + ')) continue; // combined rows are covered by the negation examples
    const re = compilePattern(unquote(ex.pattern));
    for (const m of ex.matches) if (!re.test(m)) failures.push(`${ex.pattern} should match ${m} (${re})`);
    for (const m of ex.does_not_match) if (re.test(m)) failures.push(`${ex.pattern} should not match ${m}`);
  }
  assert.deepEqual(failures, []);
});

test('negation ordering examples from the docs', () => {
  const failures: string[] = [];
  for (const ex of docs.negation_examples) {
    if (ex.patterns.some((p) => p.includes(':')) || /ignore/.test(ex.kind)) continue; // *-ignore rows describe exclusion lists, covered by decideTrigger tests
    const patterns = ex.patterns.map(unquote);
    for (const m of ex.matches) if (!matchPatterns(patterns, m).matched) failures.push(`${JSON.stringify(patterns)} should include ${m}`);
    for (const m of ex.does_not_match) if (matchPatterns(patterns, m).matched) failures.push(`${JSON.stringify(patterns)} should exclude ${m}`);
  }
  assert.deepEqual(failures, []);
});

test('documented rules the cheat sheet states in prose', () => {
  // `*` never crosses a slash, `**` does
  assert.equal(compilePattern('feature/*').test('feature/my/branch'), false);
  assert.equal(compilePattern('feature/**').test('feature/my/branch'), true);
  // `?` is a quantifier on the preceding character, not a single-char wildcard
  assert.equal(compilePattern('*.jsx?').test('page.js'), true);
  assert.equal(compilePattern('*.jsx?').test('page.jsx'), true);
  assert.equal(compilePattern('*.jsx?').test('page.jsxx'), false);
  // `+` is one or more of the preceding character
  assert.equal(compilePattern('v[12].[0-9]+.[0-9]+').test('v1.10.1'), true);
  assert.equal(compilePattern('v[12].[0-9]+.[0-9]+').test('v3.0.0'), false);
  // patterns are anchored
  assert.equal(compilePattern('main').test('main-2'), false);
  assert.equal(compilePattern('*feature').test('feature-x'), false);
  // `!` only negates at the start
  assert.equal(compilePattern('foo!bar').test('foo!bar'), true);
  // paths-ignore suppresses only when every changed file is ignored
  assert.equal(matchPaths(['docs/**'], ['docs/a.md', 'src/x.ts'], true).matched, true);
  assert.equal(matchPaths(['docs/**'], ['docs/a.md'], true).matched, false);
  // paths: at least one changed file must match
  assert.equal(matchPaths(['src/**'], ['docs/a.md'], false).matched, false);
  assert.equal(matchPaths(['src/**'], ['docs/a.md', 'src/x.ts'], false).matched, true);
});

test('on: validation catches the combinations the docs forbid', async () => {
  const wf = await parseWorkflowFile(`on:\n  push:\n    branches: [main]\n    branches-ignore: [dev]\n    paths: ['!docs/**']\n  release:\n    branches: [main]\njobs:\n  a:\n    runs-on: ubuntu-latest\n    steps: [{ run: echo }]\n`);
  const problems = validateTriggers(wf);
  const warnings = triggerWarnings(wf);
  assert.ok(problems.some((p) => p.includes('branches and branches-ignore')), 'verified rejection');
  assert.ok(!problems.some((p) => p.includes('only negative')), 'a negative-only list is not a rejection: GitHub creates no run at all');
  assert.ok(warnings.some((p) => p.includes('only negative patterns')));
  // release has no branches filter: either GitHub's own schema rejects the key or our validator warns
  assert.ok(warnings.some((p) => p.includes('on.release.branches')) || wf.errors.some((e) => /branches/.test(e)), JSON.stringify({ warnings, errors: wf.errors }));
});

test('default activity types: pull_request defaults to opened/synchronize/reopened, other events to all', async () => {
  const wf = await parseWorkflowFile(`on:\n  pull_request:\n  issues:\n  release:\n    types: [published]\njobs:\n  a:\n    runs-on: ubuntu-latest\n    steps: [{ run: echo }]\n`);
  assert.equal(decideTrigger(wf, { event: 'pull_request', action: 'labeled', baseBranch: 'main' }).matched, false);
  assert.equal(decideTrigger(wf, { event: 'pull_request', action: 'synchronize', baseBranch: 'main' }).matched, true);
  assert.equal(decideTrigger(wf, { event: 'issues', action: 'labeled' }).matched, true);
  assert.equal(decideTrigger(wf, { event: 'release', action: 'created' }).matched, false);
  assert.equal(decideTrigger(wf, { event: 'release', action: 'published' }).matched, true);
  assert.equal(decideTrigger(wf, { event: 'push', refName: 'main' }).matched, false);
});

test('push: branch-only filters exclude tag pushes and vice versa; paths are ignored for tags', async () => {
  const wf = await parseWorkflowFile(`on:\n  push:\n    branches: [main]\n    paths: ['src/**']\njobs:\n  a:\n    runs-on: ubuntu-latest\n    steps: [{ run: echo }]\n`);
  assert.equal(decideTrigger(wf, { event: 'push', refName: 'v1.0.0', refType: 'tag' }).matched, false);
  assert.equal(decideTrigger(wf, { event: 'push', refName: 'main', changedFiles: ['README.md'] }).matched, false);
  assert.equal(decideTrigger(wf, { event: 'push', refName: 'main', changedFiles: ['src/a.ts'] }).matched, true);
  const tagsOnly = await parseWorkflowFile(`on:\n  push:\n    tags: ['v*']\n    paths: ['src/**']\njobs:\n  a:\n    runs-on: ubuntu-latest\n    steps: [{ run: echo }]\n`);
  assert.equal(decideTrigger(tagsOnly, { event: 'push', refName: 'main', changedFiles: ['src/a.ts'] }).matched, false);
  assert.equal(decideTrigger(tagsOnly, { event: 'push', refName: 'v2.0', refType: 'tag', changedFiles: [] }).matched, true);
});
