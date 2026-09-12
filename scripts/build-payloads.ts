/**
 * Curates example webhook payloads for the simulator from GitHub's own @octokit/webhooks-examples
 * (the payloads GitHub publishes for its webhook documentation). One payload per event keeps the
 * bundle small; the scenario knobs patch the payload (action, branch, labels, fork, draft, inputs).
 * Written to data/webhooks/<event>.json as { actions: string[], payload }.
 *
 *   npx tsx scripts/build-payloads.ts
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import examples from '@octokit/webhooks-examples';

const EVENTS = [
  'push', 'pull_request', 'pull_request_target', 'pull_request_review', 'pull_request_review_comment',
  'workflow_dispatch', 'schedule', 'release', 'issues', 'issue_comment', 'create', 'delete',
  'workflow_run', 'merge_group', 'repository_dispatch', 'discussion', 'discussion_comment', 'label',
  'fork', 'watch', 'milestone', 'check_run', 'check_suite', 'deployment', 'deployment_status', 'status',
];
const PREFERRED_ACTIONS = ['opened', 'created', 'published', 'completed', 'submitted', 'started'];

type Example = { name: string; actions?: string[]; examples: Array<Record<string, unknown>> };
const list = examples as unknown as Example[];
const out = path.resolve('data/webhooks');
mkdirSync(out, { recursive: true });

let total = 0;
for (const event of EVENTS) {
  const source = event === 'pull_request_target' ? 'pull_request' : event;
  const group = list.find((e) => e.name === source);
  let payload: Record<string, unknown> | undefined;
  let actions: string[] = [];
  if (group) {
    payload = group.examples.find((p) => PREFERRED_ACTIONS.includes(String(p['action']))) ?? group.examples[0];
    actions = [...new Set(group.examples.map((p) => (typeof p['action'] === 'string' ? (p['action'] as string) : '')).filter(Boolean))].sort();
  } else if (event === 'schedule') {
    payload = { schedule: '0 6 * * 1', repository: { name: 'octo-repo', full_name: 'octo-org/octo-repo', default_branch: 'main', owner: { login: 'octo-org' } }, sender: { login: 'octocat' } };
  } else {
    console.log(`no examples for ${event}`);
    continue;
  }
  if (!payload) continue;
  const json = JSON.stringify({ actions, payload });
  total += json.length;
  writeFileSync(path.join(out, `${event}.json`), json + '\n');
  console.log(`${event.padEnd(28)} actions ${String(actions.length).padStart(2)}  ${(json.length / 1024).toFixed(0).padStart(3)} KB`);
}
console.log(`total ${(total / 1024).toFixed(0)} KB`);
