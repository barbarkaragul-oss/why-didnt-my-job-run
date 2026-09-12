import { parseWorkflowFile } from '../src/engine/workflow.js';
import { validateTriggers } from '../src/engine/filters.js';
const wf = await parseWorkflowFile("on:\n  push:\n    branches: [main]\n    branches-ignore: [dev]\n    paths: ['!docs/**']\n  release:\n    branches: [main]\njobs:\n  a:\n    runs-on: ubuntu-latest\n    steps: [{ run: echo }]\n");
console.log('errors:', wf.errors);
console.log('events:', JSON.stringify(wf.events));
console.log('problems:', validateTriggers(wf));
