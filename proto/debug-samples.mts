import { parseWorkflowFile } from '../src/engine/workflow.js';
import { simulate } from '../src/engine/simulate.js';
import { SAMPLES } from '../src/ui/samples.js';
import { DEFAULT_STATE, toEngineInputs, type ScenarioState } from '../src/ui/scenario.js';
import { parseExpression, statusFunctions } from '../src/engine/evaluate.js';
import { checkAvailability, collectNames } from '../src/engine/availability.js';
for (const id of ['skipped-needs', 'hashfiles-job-if']) {
  const sample = SAMPLES.find((s) => s.id === id)!;
  const state: ScenarioState = { ...DEFAULT_STATE, ...(sample.scenario as Partial<ScenarioState>) };
  const workflow = await parseWorkflowFile(sample.yaml);
  console.log('==', id, 'errors:', workflow.errors, 'jobs:', workflow.jobs.map((j) => j.id + ' if=' + j.if));
  const inputs = toEngineInputs(state, workflow);
  const sim = simulate({ workflow, github: inputs.github, inputs: inputs.inputs, trigger: inputs.trigger });
  console.log('trigger', sim.trigger.matched, sim.trigger.reasons);
  for (const j of sim.jobs) console.log(' ', j.job.id, j.outcome, '|', j.headline, '| problems', JSON.stringify(j.problems));
}
const ast = parseExpression("success() && (hashFiles('**/package-lock.json') != '')", statusFunctions({ needs: {} }));
const names = { contexts: new Set<string>(), functions: new Set<string>() };
collectNames(ast, names);
console.log('names', [...names.contexts], [...names.functions], checkAvailability(ast, 'jobs.<job_id>.if'));
