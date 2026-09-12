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
  jobs: Array<{ name: string; conclusion: string | null }>;
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
