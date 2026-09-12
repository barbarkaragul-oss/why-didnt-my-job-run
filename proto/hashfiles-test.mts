import { parseWorkflow, convertWorkflowTemplate, NoOperationTraceWriter } from '@actions/workflow-parser';
const y = `on: push
jobs:
  a:
    if: hashFiles('**/package.json') != ''
    runs-on: ubuntu-latest
    steps: [{ run: echo }]
  b:
    runs-on: ubuntu-latest
    steps:
      - if: hashFiles('**/x') != ''
        run: echo
  c:
    if: matrix.node == 22
    runs-on: ubuntu-latest
    steps: [{ run: echo }]
  d:
    if: steps.x.outputs.y == '1'
    runs-on: ubuntu-latest
    steps: [{ run: echo }]
`;
const r = parseWorkflow({ name: 'w.yml', content: y }, new NoOperationTraceWriter());
console.log('parse errors:', r.context.errors.getErrors().map((e) => e.message));
const t = await convertWorkflowTemplate(r.context, r.value!);
console.log('jobs:', t.jobs.map((j) => j.id.value + ' if=' + j.if.expression));
