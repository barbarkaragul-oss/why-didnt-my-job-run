/**
 * Builds the `github` context the way the runner does: the webhook payload becomes `github.event`,
 * and the derived fields (ref, sha, head_ref, base_ref, ref_name, ref_type, event_name, actor, ...)
 * follow the rules documented in "Events that trigger workflows" and "Contexts".
 *
 * The simulator starts from a real example payload for the chosen event (GitHub's own
 * @octokit/webhooks-examples) and lets the user patch the parts that matter (branch, tag, fork,
 * labels, draft, actor, inputs). Every knob below is a plain patch on the payload, so the
 * evaluation always runs against a complete, realistic `github.event`.
 */

export type Json = Record<string, unknown>;

export interface Scenario {
  event: string;
  /** Activity type for events that have one (opened, labeled, published, ...). */
  action?: string;
  /** Branch name for branch events (push, workflow_dispatch, schedule, pull_request base). */
  branch?: string;
  /** Tag name for tag pushes and releases. */
  tag?: string;
  /** Head branch of a pull request. */
  headBranch?: string;
  /** Whether the pull request comes from a fork. */
  fork?: boolean;
  draft?: boolean;
  labels?: string[];
  actor?: string;
  /** Files changed by the push or pull request (for `paths` filters). */
  changedFiles?: string[];
  commitMessage?: string;
  inputs?: Record<string, string | boolean | number>;
  repository?: string;
  defaultBranch?: string;
  /** Extra overrides applied last to the github context (advanced). */
  overrides?: Json;
}

export interface BuiltContext {
  github: Json;
  inputs: Json;
  /** Human-readable notes about how derived fields were computed, for the UI. */
  notes: string[];
}

const ZERO_SHA = '0000000000000000000000000000000000000000';

export function buildGithubContext(payload: Json, sc: Scenario): BuiltContext {
  const p = structuredClone(payload);
  const notes: string[] = [];
  const repoFull = sc.repository ?? str((p['repository'] as Json | undefined)?.['full_name']) ?? 'octo-org/octo-repo';
  const [owner = 'octo-org', repoName = 'octo-repo'] = repoFull.split('/');
  const defaultBranch = sc.defaultBranch ?? str((p['repository'] as Json | undefined)?.['default_branch']) ?? 'main';
  const actor = sc.actor ?? str((p['sender'] as Json | undefined)?.['login']) ?? 'octocat';

  patchRepository(p, owner, repoName, defaultBranch);
  setPath(p, ['sender', 'login'], actor);
  if (sc.action !== undefined && 'action' in p) p['action'] = sc.action;

  const gh: Json = {
    event_name: sc.event,
    event: p,
    repository: repoFull,
    repository_owner: owner,
    repository_id: str((p['repository'] as Json | undefined)?.['id']) ?? '1',
    repository_owner_id: str(((p['repository'] as Json | undefined)?.['owner'] as Json | undefined)?.['id']) ?? '1',
    actor,
    actor_id: '1',
    triggering_actor: actor,
    workflow: 'CI',
    workflow_ref: `${repoFull}/.github/workflows/ci.yml@refs/heads/${defaultBranch}`,
    workflow_sha: ZERO_SHA,
    job: '',
    run_id: '1',
    run_number: '1',
    run_attempt: '1',
    retention_days: '90',
    action: '',
    action_path: '',
    action_ref: '',
    action_repository: '',
    action_status: '',
    server_url: 'https://github.com',
    api_url: 'https://api.github.com',
    graphql_url: 'https://api.github.com/graphql',
    workspace: '/home/runner/work/' + repoName + '/' + repoName,
    path: '',
    env: '',
    secret_source: 'Actions',
    token: '***',
    head_ref: '',
    base_ref: '',
    ref_protected: false,
  };

  const setRef = (ref: string, sha = ZERO_SHA) => {
    gh['ref'] = ref;
    gh['sha'] = sha;
    gh['ref_name'] = ref.replace(/^refs\/(heads|tags|pull)\//, '');
    gh['ref_type'] = ref.startsWith('refs/tags/') ? 'tag' : 'branch';
  };

  switch (sc.event) {
    case 'push': {
      const ref = sc.tag ? `refs/tags/${sc.tag}` : `refs/heads/${sc.branch ?? defaultBranch}`;
      p['ref'] = ref;
      if (sc.commitMessage !== undefined) setPath(p, ['head_commit', 'message'], sc.commitMessage);
      // The webhook example carries per-commit file lists, but the payload GitHub hands to Actions does not
      // (recorded head_commit keys: author, committer, distinct, id, message, timestamp, tree_id, url). Typed
      // changed files feed the paths filter only; github.event must look like what a workflow really sees.
      for (const c of [p['head_commit'], ...(Array.isArray(p['commits']) ? (p['commits'] as unknown[]) : [])]) {
        if (c && typeof c === 'object') for (const k of ['added', 'modified', 'removed']) delete (c as Record<string, unknown>)[k];
      }
      notes.push('push: github.event.head_commit and github.event.commits carry no added/modified/removed lists in Actions (they are stripped from the webhook payload); paths filters use the files you typed.');
      setRef(ref, str(p['after']) ?? ZERO_SHA);
      gh['base_ref'] = str(p['base_ref']) ?? '';
      notes.push(`push: github.ref is the pushed ref (${ref}); github.sha is the commit after the push.`);
      break;
    }
    case 'pull_request':
    case 'pull_request_target':
    case 'pull_request_review':
    case 'pull_request_review_comment': {
      const pr = (p['pull_request'] as Json | undefined) ?? {};
      p['pull_request'] = pr;
      const number = Number(p['number'] ?? pr['number'] ?? 1);
      p['number'] = number;
      pr['number'] = number;
      const base = sc.branch ?? str((pr['base'] as Json | undefined)?.['ref']) ?? defaultBranch;
      const head = sc.headBranch ?? str((pr['head'] as Json | undefined)?.['ref']) ?? 'feature';
      setPath(pr, ['base', 'ref'], base);
      setPath(pr, ['head', 'ref'], head);
      setPath(pr, ['head', 'repo', 'fork'], sc.fork ?? Boolean(((pr['head'] as Json | undefined)?.['repo'] as Json | undefined)?.['fork']));
      if (sc.fork) setPath(pr, ['head', 'repo', 'full_name'], `${actor}/${repoName}`);
      else setPath(pr, ['head', 'repo', 'full_name'], repoFull);
      if (sc.draft !== undefined) pr['draft'] = sc.draft;
      if (sc.labels) pr['labels'] = sc.labels.map((name, i) => ({ id: 1000 + i, name, color: 'ededed', default: false, description: null }));
      if (sc.action === 'labeled' && sc.labels?.length) p['label'] = { id: 1000, name: sc.labels[sc.labels.length - 1], color: 'ededed' };
      const baseSha = str((pr['base'] as Json | undefined)?.['sha']) ?? ZERO_SHA;
      if (sc.event === 'pull_request') {
        setRef(`refs/pull/${number}/merge`, 'merge' + ZERO_SHA.slice(5));
        notes.push(`pull_request: github.ref is refs/pull/${number}/merge and github.sha is the merge commit, not the head commit.`);
      } else if (sc.event === 'pull_request_target') {
        setRef(`refs/heads/${base}`, baseSha);
        notes.push(`pull_request_target: github.ref is the base branch (refs/heads/${base}) and github.sha its last commit; the workflow runs with the base branch's code.`);
      } else {
        setRef(`refs/pull/${number}/merge`, 'merge' + ZERO_SHA.slice(5));
      }
      gh['head_ref'] = head;
      gh['base_ref'] = base;
      break;
    }
    case 'release': {
      const rel = (p['release'] as Json | undefined) ?? {};
      p['release'] = rel;
      const tag = sc.tag ?? str(rel['tag_name']) ?? 'v1.0.0';
      rel['tag_name'] = tag;
      setRef(`refs/tags/${tag}`);
      notes.push(`release: github.ref is the tag of the release (refs/tags/${tag}).`);
      break;
    }
    case 'create':
    case 'delete': {
      const isTag = Boolean(sc.tag) || p['ref_type'] === 'tag';
      const name = sc.tag ?? sc.branch ?? str(p['ref']) ?? defaultBranch;
      p['ref'] = name;
      p['ref_type'] = isTag ? 'tag' : 'branch';
      setRef(sc.event === 'create' ? (isTag ? `refs/tags/${name}` : `refs/heads/${name}`) : `refs/heads/${defaultBranch}`);
      notes.push(sc.event === 'create' ? `create: github.ref is the created ref.` : `delete: github.ref is the default branch, because the deleted ref no longer exists.`);
      break;
    }
    case 'workflow_run': {
      const wr = (p['workflow_run'] as Json | undefined) ?? {};
      const branch = sc.branch ?? str(wr['head_branch']) ?? defaultBranch;
      setPath(p, ['workflow_run', 'head_branch'], branch);
      setRef(`refs/heads/${defaultBranch}`, str(wr['head_sha']) ?? ZERO_SHA);
      notes.push(`workflow_run: github.ref is the default branch; the triggering run's branch is github.event.workflow_run.head_branch (${branch}).`);
      break;
    }
    case 'merge_group': {
      const mg = (p['merge_group'] as Json | undefined) ?? {};
      const ref = str(mg['head_ref']) ?? `refs/heads/gh-readonly-queue/${defaultBranch}/pr-1-${ZERO_SHA}`;
      setRef(ref, str(mg['head_sha']) ?? ZERO_SHA);
      gh['base_ref'] = str(mg['base_ref']) ?? `refs/heads/${defaultBranch}`;
      notes.push('merge_group: github.ref is the temporary merge queue branch (gh-readonly-queue/...).');
      break;
    }
    default: {
      // workflow_dispatch, schedule, issues, issue_comment, repository_dispatch, discussion, label, ...
      const branch = sc.branch ?? defaultBranch;
      setRef(`refs/heads/${branch}`);
      if (sc.event === 'issues' || sc.event === 'issue_comment') {
        const issue = (p['issue'] as Json | undefined) ?? {};
        p['issue'] = issue;
        if (sc.labels) issue['labels'] = sc.labels.map((name, i) => ({ id: 1000 + i, name, color: 'ededed' }));
        if (sc.action === 'labeled' && sc.labels?.length) p['label'] = { id: 1000, name: sc.labels[sc.labels.length - 1], color: 'ededed' };
      }
      if (sc.event === 'workflow_dispatch') {
        p['inputs'] = stringifyInputs(sc.inputs ?? {});
        p['ref'] = `refs/heads/${branch}`;
      }
      notes.push(`${sc.event}: github.ref is the branch the workflow ran on (refs/heads/${branch})${sc.event === 'schedule' || sc.event === 'issues' || sc.event === 'issue_comment' || sc.event === 'discussion' || sc.event === 'label' || sc.event === 'repository_dispatch' ? ', which for this event is always the default branch' : ''}.`);
    }
  }

  const inputs: Json = sc.inputs ? typedInputs(sc.inputs) : {};
  Object.assign(gh, sc.overrides ?? {});
  return { github: gh, inputs, notes };
}

/** `inputs` context keeps booleans and numbers typed; `github.event.inputs` is all strings. */
function typedInputs(inputs: Record<string, string | boolean | number>): Json {
  const out: Json = {};
  for (const [k, v] of Object.entries(inputs)) out[k] = v;
  return out;
}

function stringifyInputs(inputs: Record<string, string | boolean | number>): Json {
  const out: Json = {};
  for (const [k, v] of Object.entries(inputs)) out[k] = String(v);
  return out;
}

function patchRepository(p: Json, owner: string, name: string, defaultBranch: string): void {
  const repo = (p['repository'] as Json | undefined) ?? {};
  p['repository'] = repo;
  repo['name'] = name;
  repo['full_name'] = `${owner}/${name}`;
  repo['default_branch'] = defaultBranch;
  const o = (repo['owner'] as Json | undefined) ?? {};
  repo['owner'] = o;
  o['login'] = owner;
}

function setPath(obj: Json, path: string[], value: unknown): void {
  let cur = obj;
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i]!;
    const next = cur[key];
    if (!next || typeof next !== 'object') cur[key] = {};
    cur = cur[key] as Json;
  }
  cur[path[path.length - 1]!] = value;
}

function str(v: unknown): string | undefined {
  return v === undefined || v === null ? undefined : String(v);
}
