// Browser kill test: same engine, bundled for the browser, no Node builtins allowed.
import { parseWorkflow, convertWorkflowTemplate, NoOperationTraceWriter } from '@actions/workflow-parser';
import { Lexer, Parser, Evaluator, data } from '@actions/expressions';
import type { FunctionDefinition, FunctionInfo } from '@actions/expressions/funcs/info';

const WORKFLOW = `
on:
  push:
    branches: [main]
  pull_request:
jobs:
  build:
    runs-on: ubuntu-latest
    steps: [{ run: npm test }]
  fork-check:
    if: github.event.pull_request.head.repo.fork == false
    runs-on: ubuntu-latest
    steps: [{ run: echo internal }]
  release-label:
    if: contains(github.event.pull_request.labels.*.name, 'release')
    runs-on: ubuntu-latest
    steps: [{ run: echo release }]
  deploy:
    needs: [build]
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    runs-on: ubuntu-latest
    steps: [{ run: echo deploy }]
  notify:
    needs: [build]
    if: \${{ always() }}
    runs-on: ubuntu-latest
    steps: [{ run: echo notify }]
`;

const toData = (obj: unknown): data.ExpressionData => JSON.parse(JSON.stringify(obj ?? null), data.reviver);
const bool = (b: boolean) => new data.BooleanData(b);
const funcs = new Map<string, FunctionDefinition>([
  ['success', { name: 'success', minArgs: 0, maxArgs: 0, call: () => bool(true) }],
  ['failure', { name: 'failure', minArgs: 0, maxArgs: 0, call: () => bool(false) }],
  ['cancelled', { name: 'cancelled', minArgs: 0, maxArgs: 0, call: () => bool(false) }],
  ['always', { name: 'always', minArgs: 0, maxArgs: 0, call: () => bool(true) }],
  ['hashFiles', { name: 'hashFiles', minArgs: 1, maxArgs: 255, call: () => new data.StringData('') }],
]);
const infos: FunctionInfo[] = [...funcs.values()].map(({ name, minArgs, maxArgs }) => ({ name, minArgs, maxArgs }));
const CONTEXTS = ['github', 'needs', 'inputs', 'vars', 'secrets', 'env', 'matrix', 'strategy', 'runner', 'job', 'steps'];

async function run(): Promise<string[]> {
  const out: string[] = [];
  const parsed = parseWorkflow({ name: 'ci.yml', content: WORKFLOW }, new NoOperationTraceWriter());
  out.push(`parse errors: ${parsed.context.errors.count}`);
  const template = await convertWorkflowTemplate(parsed.context, parsed.value!);
  const scenarios = [
    { label: 'pull_request from fork with release label', github: { event_name: 'pull_request', ref: 'refs/pull/7/merge', event: { pull_request: { head: { repo: { fork: true } }, labels: [{ name: 'release' }, { name: 'bug' }] } } } },
    { label: 'push to main', github: { event_name: 'push', ref: 'refs/heads/main', event: { ref: 'refs/heads/main' } } },
  ];
  for (const sc of scenarios) {
    out.push(`== ${sc.label}`);
    const dict = new data.Dictionary({ key: 'github', value: toData(sc.github) }, { key: 'needs', value: toData({ build: { result: 'success', outputs: {} } }) });
    for (const job of template.jobs) {
      const ast = new Parser(new Lexer(job.if.expression).lex().tokens, CONTEXTS, infos).parse();
      const v = new Evaluator(ast, dict, funcs).evaluate();
      out.push(`${v.coerceString() === 'true' ? 'RUN ' : 'SKIP'} ${job.id.value}: ${job.if.expression} -> ${v.coerceString()}`);
    }
  }
  return out;
}

run().then((lines) => {
  const pre = document.getElementById('out')!;
  pre.textContent = lines.join('\n');
  (window as unknown as { __RESULT__: string[] }).__RESULT__ = lines;
}).catch((e) => {
  document.getElementById('out')!.textContent = 'ERROR ' + (e as Error).stack;
});
