/** Scenario state (what the user picks) and its translation into engine inputs. */
import { buildGithubContext, type Scenario, type Json } from '../engine/context.js';
import type { TriggerInput } from '../engine/filters.js';
import type { ParsedWorkflow } from '../engine/workflow.js';
import type { JobResult } from '../engine/evaluate.js';
import { PAYLOADS } from './payloads.js';

export interface ScenarioState {
  event: string;
  action: string;
  refType: 'branch' | 'tag';
  branch: string;
  tag: string;
  headBranch: string;
  baseBranch: string;
  fork: boolean;
  draft: boolean;
  labels: string;
  actor: string;
  repository: string;
  defaultBranch: string;
  changedFiles: string;
  commitMessage: string;
  inputs: Record<string, string | boolean | number>;
  forcedResults: Record<string, JobResult>;
  cancelled: boolean;
}

export const DEFAULT_STATE: ScenarioState = {
  event: 'push',
  action: '',
  refType: 'branch',
  branch: 'main',
  tag: 'v1.0.0',
  headBranch: 'feature/login',
  baseBranch: 'main',
  fork: false,
  draft: false,
  labels: '',
  actor: 'octocat',
  repository: 'octo-org/octo-repo',
  defaultBranch: 'main',
  changedFiles: 'src/app.ts',
  commitMessage: 'Update app',
  inputs: {},
  forcedResults: {},
  cancelled: false,
};

export const PR_EVENTS = new Set(['pull_request', 'pull_request_target', 'pull_request_review', 'pull_request_review_comment']);
export const BRANCH_EVENTS = new Set(['workflow_dispatch', 'workflow_run', 'schedule', 'issues', 'issue_comment', 'discussion', 'discussion_comment', 'label', 'repository_dispatch', 'merge_group', 'fork', 'watch', 'milestone', 'check_run', 'check_suite', 'deployment', 'deployment_status', 'status']);
export const LABEL_EVENTS = new Set(['pull_request', 'pull_request_target', 'issues', 'issue_comment', 'discussion']);

export function defaultAction(event: string): string {
  const actions = PAYLOADS[event]?.actions ?? [];
  if (!actions.length) return '';
  for (const pref of ['opened', 'created', 'published', 'completed', 'submitted', 'started']) if (actions.includes(pref)) return pref;
  return actions[0] ?? '';
}

export function parseLabels(s: string): string[] {
  return s.split(/[,\n]/).map((x) => x.trim()).filter(Boolean);
}

export function parseFiles(s: string): string[] {
  return s.split(/[\n,]/).map((x) => x.trim()).filter(Boolean);
}

/** Typed workflow_dispatch inputs: use the workflow's input definitions to coerce types and apply defaults. */
export function dispatchInputs(state: ScenarioState, workflow: ParsedWorkflow): Record<string, string | boolean | number> {
  const defs = ((workflow.events as Record<string, unknown>)['workflow_dispatch'] as { inputs?: Record<string, { type?: string; default?: unknown; options?: string[] }> } | null | undefined)?.inputs ?? {};
  const out: Record<string, string | boolean | number> = {};
  for (const [name, def] of Object.entries(defs)) {
    const raw = state.inputs[name];
    const fallback = def.default;
    const v = raw !== undefined ? raw : fallback;
    if (def.type === 'boolean') out[name] = v === true || v === 'true';
    else if (def.type === 'number') out[name] = v === undefined || v === '' ? 0 : Number(v);
    else out[name] = v === undefined ? '' : String(v);
  }
  return out;
}

export interface EngineInputs {
  github: Json;
  inputs: Json;
  trigger: TriggerInput;
  notes: string[];
}

export function toEngineInputs(state: ScenarioState, workflow: ParsedWorkflow): EngineInputs {
  const file = PAYLOADS[state.event];
  const payload = (file?.payload ?? { repository: {}, sender: {} }) as Json;
  const isPr = PR_EVENTS.has(state.event);
  const inputs = state.event === 'workflow_dispatch' ? dispatchInputs(state, workflow) : {};
  const sc: Scenario = {
    event: state.event,
    action: state.action || undefined,
    branch: isPr ? state.baseBranch : state.event === 'push' && state.refType === 'tag' ? undefined : state.branch,
    tag: (state.event === 'push' && state.refType === 'tag') || state.event === 'release' || ((state.event === 'create' || state.event === 'delete') && state.refType === 'tag') ? state.tag : undefined,
    headBranch: isPr ? state.headBranch : undefined,
    fork: isPr ? state.fork : undefined,
    draft: isPr ? state.draft : undefined,
    labels: LABEL_EVENTS.has(state.event) ? parseLabels(state.labels) : undefined,
    actor: state.actor || undefined,
    changedFiles: parseFiles(state.changedFiles),
    commitMessage: state.event === 'push' ? state.commitMessage : undefined,
    inputs,
    repository: state.repository || undefined,
    defaultBranch: state.defaultBranch || undefined,
  };
  const built = buildGithubContext(payload, sc);
  const refType: 'branch' | 'tag' = String(built.github['ref'] ?? '').startsWith('refs/tags/') ? 'tag' : 'branch';
  const trigger: TriggerInput = {
    event: state.event,
    action: state.action || undefined,
    refName: String(built.github['ref_name'] ?? ''),
    refType,
    baseBranch: isPr ? state.baseBranch : undefined,
    changedFiles: parseFiles(state.changedFiles),
  };
  return { github: built.github, inputs: built.inputs, trigger, notes: built.notes };
}
