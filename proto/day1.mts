// Day-1 kill test: can GitHub's own parser + expression engine evaluate job `if:` conditions
// against a real webhook payload, in plain JS (no Node builtins)?
import { parseWorkflow, convertWorkflowTemplate, NoOperationTraceWriter } from '@actions/workflow-parser';
import { Lexer, Parser, Evaluator, data, ExpressionError } from '@actions/expressions';
import type { Expr } from '@actions/expressions';
import type { FunctionDefinition, FunctionInfo } from '@actions/expressions/funcs/info';
import examples from '@octokit/webhooks-examples';

// ---------- context building ----------
type Json = Record<string, unknown>;
const toData = (obj: unknown): data.ExpressionData => JSON.parse(JSON.stringify(obj ?? null), data.reviver);

function payloadFor(event: string, action?: string, pick = 0): Json {
  const group = (examples as unknown as Array<{ name: string; examples: Json[] }>).find((e) => e.name === event);
  if (!group) throw new Error(`no webhook examples for ${event}`);
  const list = action ? group.examples.filter((p) => p['action'] === action) : group.examples;
  if (!list.length) throw new Error(`no ${event}/${action} example`);
  return list[pick] as Json;
}

function githubContext(event: string, payload: Json, overrides: Json = {}): Json {
  const repo = payload['repository'] as Json | undefined;
  const pr = payload['pull_request'] as Json | undefined;
  const base: Json = {
    event_name: event,
    event: payload,
    repository: repo?.['full_name'] ?? 'octo-org/octo-repo',
    repository_owner: (repo?.['owner'] as Json | undefined)?.['login'] ?? 'octo-org',
    actor: (payload['sender'] as Json | undefined)?.['login'] ?? 'octocat',
    workflow: 'CI',
    job: '',
    run_id: '1',
    run_number: '1',
    run_attempt: '1',
    action: '',
    server_url: 'https://github.com',
    api_url: 'https://api.github.com',
    head_ref: '',
    base_ref: '',
  };
  if (event === 'push') {
    const ref = String(payload['ref'] ?? 'refs/heads/main');
    Object.assign(base, {
      ref,
      ref_name: ref.replace(/^refs\/(heads|tags)\//, ''),
      ref_type: ref.startsWith('refs/tags/') ? 'tag' : 'branch',
      sha: payload['after'] ?? '0000000000000000000000000000000000000000',
      base_ref: payload['base_ref'] ?? '',
    });
  } else if (event === 'pull_request' || event === 'pull_request_target') {
    const number = payload['number'] ?? pr?.['number'] ?? 1;
    const head = pr?.['head'] as Json | undefined;
    const baseB = pr?.['base'] as Json | undefined;
    if (event === 'pull_request') {
      Object.assign(base, { ref: `refs/pull/${number}/merge`, ref_name: `${number}/merge`, ref_type: 'branch', sha: 'merge0000000000000000000000000000000000000' });
    } else {
      Object.assign(base, { ref: `refs/heads/${baseB?.['ref'] ?? 'main'}`, ref_name: baseB?.['ref'] ?? 'main', ref_type: 'branch', sha: baseB?.['sha'] ?? '' });
    }
    Object.assign(base, { head_ref: head?.['ref'] ?? '', base_ref: baseB?.['ref'] ?? '' });
  } else if (event === 'release') {
    const rel = payload['release'] as Json | undefined;
    const tag = String(rel?.['tag_name'] ?? 'v0.0.0');
    Object.assign(base, { ref: `refs/tags/${tag}`, ref_name: tag, ref_type: 'tag', sha: '' });
  } else {
    const def = (repo?.['default_branch'] as string | undefined) ?? 'main';
    Object.assign(base, { ref: `refs/heads/${def}`, ref_name: def, ref_type: 'branch', sha: '' });
  }
  return { ...base, ...overrides };
}

// ---------- evaluation ----------
type JobResult = 'success' | 'failure' | 'cancelled' | 'skipped';

function statusFunctions(needsResults: Record<string, JobResult>): Map<string, FunctionDefinition> {
  const results = Object.values(needsResults);
  const bool = (b: boolean) => new data.BooleanData(b);
  const defs: FunctionDefinition[] = [
    { name: 'success', minArgs: 0, maxArgs: 0, call: () => bool(results.every((r) => r === 'success')) },
    { name: 'failure', minArgs: 0, maxArgs: 0, call: () => bool(results.some((r) => r === 'failure')) },
    { name: 'cancelled', minArgs: 0, maxArgs: 0, call: () => bool(results.some((r) => r === 'cancelled')) },
    { name: 'always', minArgs: 0, maxArgs: 0, call: () => bool(true) },
    { name: 'hashFiles', minArgs: 1, maxArgs: 255, call: () => new data.StringData('') },
  ];
  return new Map(defs.map((d) => [d.name, d]));
}

/** Evaluator that remembers the value of every sub-expression (for hover tooltips). */
class TracingEvaluator extends Evaluator {
  readonly trace = new Map<Expr, data.ExpressionData>();
  protected override eval(n: Expr): data.ExpressionData {
    const v = super.eval(n);
    this.trace.set(n, v);
    return v;
  }
}

const CONTEXTS = ['github', 'needs', 'inputs', 'vars', 'secrets', 'env', 'matrix', 'strategy', 'runner', 'job', 'steps'];

function evaluateIf(expression: string, ctx: Record<string, unknown>, funcs: Map<string, FunctionDefinition>) {
  const tokens = new Lexer(expression).lex().tokens;
  const funcInfos: FunctionInfo[] = [...funcs.values()].map(({ name, minArgs, maxArgs }) => ({ name, minArgs, maxArgs }));
  const ast = new Parser(tokens, CONTEXTS, funcInfos).parse();
  const dict = new data.Dictionary(...Object.entries(ctx).map(([key, value]) => ({ key, value: toData(value) })));
  const ev = new TracingEvaluator(ast, dict, funcs);
  const value = ev.evaluate();
  const truthy = value.kind === data.Kind.Boolean ? (value as data.BooleanData).value : value.kind === data.Kind.Null ? false : value.kind === data.Kind.Number ? value.number() !== 0 : value.kind === data.Kind.String ? value.coerceString() !== '' : true;
  return { value, truthy, trace: ev.trace, ast };
}

// ---------- test workflows ----------
const WORKFLOW = `
name: CI
on:
  push:
    branches: [main]
    tags: ['v*']
  pull_request:
    types: [opened, synchronize, labeled]
  release:
    types: [published]
jobs:
  build:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node: [20, 22]
    steps:
      - uses: actions/checkout@v4
      - run: npm test
  fork-check:
    if: github.event.pull_request.head.repo.fork == false
    runs-on: ubuntu-latest
    steps: [{ run: echo internal }]
  release-label:
    if: contains(github.event.pull_request.labels.*.name, 'release')
    runs-on: ubuntu-latest
    steps: [{ run: echo release }]
  deploy:
    needs: [build, fork-check]
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    runs-on: ubuntu-latest
    steps: [{ run: echo deploy }]
  notify:
    needs: [build]
    if: \${{ always() }}
    runs-on: ubuntu-latest
    steps: [{ run: echo notify }]
  on-failure:
    needs: [build, deploy]
    if: failure()
    runs-on: ubuntu-latest
    steps: [{ run: echo failed }]
  tag-only:
    if: startsWith(github.ref, 'refs/tags/v')
    runs-on: ubuntu-latest
    steps: [{ run: echo tag }]
`;

async function main() {
  const parsed = parseWorkflow({ name: 'ci.yml', content: WORKFLOW }, new NoOperationTraceWriter());
  if (parsed.context.errors.count) {
    for (const e of parsed.context.errors.getErrors()) console.log('PARSE ERROR', e.message);
  }
  const template = await convertWorkflowTemplate(parsed.context, parsed.value!);
  console.log('events:', JSON.stringify(template.events));
  console.log('jobs:', template.jobs.map((j) => `${j.id.value}${j.needs?.length ? ' needs=' + j.needs.map((n) => n.value).join(',') : ''} if=<${j.if.expression}>`).join('\n      '));
  console.log('matrix token type on build:', template.jobs[0]?.strategy?.constructor.name);

  const scenarios: Array<{ label: string; event: string; action?: string; overrides?: Json; needs: Record<string, JobResult> }> = [
    { label: 'push to main', event: 'push', needs: { build: 'success', 'fork-check': 'success', deploy: 'success' } },
    { label: 'push to main, build FAILED', event: 'push', needs: { build: 'failure', 'fork-check': 'skipped', deploy: 'skipped' } },
    { label: 'pull_request opened', event: 'pull_request', action: 'opened', needs: { build: 'success', 'fork-check': 'success', deploy: 'skipped' } },
    { label: 'pull_request labeled', event: 'pull_request', action: 'labeled', needs: { build: 'success', 'fork-check': 'success', deploy: 'skipped' } },
    { label: 'release published', event: 'release', action: 'published', needs: { build: 'success', 'fork-check': 'skipped', deploy: 'skipped' } },
  ];

  for (const sc of scenarios) {
    const payload = payloadFor(sc.event, sc.action);
    const gh = githubContext(sc.event, payload, sc.overrides);
    console.log(`\n=== ${sc.label}   (ref=${gh['ref']}, head_ref=${gh['head_ref'] || '-'}, fork=${JSON.stringify(((payload['pull_request'] as Json)?.['head'] as Json)?.['repo'] && (((payload['pull_request'] as Json)['head'] as Json)['repo'] as Json)['fork'])}, labels=${JSON.stringify(((payload['pull_request'] as Json)?.['labels'] as Json[] | undefined)?.map((l) => l['name']))})`);
    for (const job of template.jobs) {
      const needsCtx: Json = {};
      for (const n of job.needs ?? []) needsCtx[n.value] = { result: sc.needs[n.value] ?? 'success', outputs: {} };
      const relevant: Record<string, JobResult> = {};
      for (const n of job.needs ?? []) relevant[n.value] = sc.needs[n.value] ?? 'success';
      try {
        const r = evaluateIf(job.if.expression, { github: gh, needs: needsCtx, inputs: {}, vars: {}, env: {}, matrix: {}, strategy: {}, runner: {}, job: {}, steps: {}, secrets: {} }, statusFunctions(relevant));
        const sub = [...r.trace.entries()].filter(([n]) => n.constructor.name !== 'Literal').map(([n, v]) => `${n.constructor.name}=${v.kind === data.Kind.Dictionary || v.kind === data.Kind.Array ? '<' + v.kind + '>' : JSON.stringify(v.coerceString())}`).slice(0, 6).join(' ');
        console.log(`  ${r.truthy ? 'RUN ' : 'SKIP'} ${job.id.value.padEnd(14)} ${job.if.expression.padEnd(70)} -> ${r.value.coerceString()}   [${sub}]`);
      } catch (e) {
        console.log(`  ERR  ${job.id.value.padEnd(14)} ${job.if.expression.padEnd(70)} -> ${e instanceof ExpressionError ? 'ExpressionError: ' : ''}${(e as Error).message}`);
      }
    }
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
