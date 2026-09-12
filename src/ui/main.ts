import { parseWorkflowFile, type ParsedWorkflow } from '../engine/workflow.js';
import { simulate, type Simulation, type JobVerdict } from '../engine/simulate.js';
import type { JobResult, EvaluationResult, EvaluationFailure } from '../engine/evaluate.js';
import { SAMPLES } from './samples.js';
import { PAYLOADS, EVENT_ORDER } from './payloads.js';
import { DEFAULT_STATE, PR_EVENTS, BRANCH_EVENTS, LABEL_EVENTS, defaultAction, toEngineInputs, type ScenarioState } from './scenario.js';
import { encodeShare, decodeShare } from './share.js';
import githubFields from '../../data/docs/github-fields.json' with { type: 'json' };

type FieldDoc = { field: string; description: string; quote: string; url: string };
const FIELD_DOCS = new Map((githubFields as FieldDoc[]).map((f) => [f.field.replace(/^github\./, ''), f]));

// ---------- state ----------
let yaml = '';
let state: ScenarioState = { ...DEFAULT_STATE };
let workflow: ParsedWorkflow | null = null;
let sim: Simulation | null = null;
let parseTimer: number | undefined;

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const yamlEl = $<HTMLTextAreaElement>('yaml');
const samplesEl = $<HTMLSelectElement>('samples');
const eventEl = $<HTMLSelectElement>('event');
const actionEl = $<HTMLSelectElement>('action');
const knobsEl = $<HTMLDivElement>('knobs');

function h<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Record<string, string | boolean | undefined> = {}, ...children: Array<Node | string | null | undefined>): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === false) continue;
    if (k === 'class') el.className = String(v);
    else if (k === 'text') el.textContent = String(v);
    else el.setAttribute(k, v === true ? '' : String(v));
  }
  for (const c of children) if (c !== null && c !== undefined) el.append(typeof c === 'string' ? document.createTextNode(c) : c);
  return el;
}

// ---------- init ----------
function init() {
  for (const s of SAMPLES) samplesEl.append(h('option', { value: s.id, text: s.title }));
  samplesEl.append(h('option', { value: '__custom', text: 'Custom (edited)' }));
  for (const e of EVENT_ORDER) eventEl.append(h('option', { value: e, text: e }));

  const shared = decodeShare(location.hash);
  if (shared) {
    yaml = shared.yaml;
    state = { ...DEFAULT_STATE, ...shared.scenario };
    samplesEl.value = '__custom';
  } else {
    loadSample(SAMPLES[0]!.id);
  }
  yamlEl.value = yaml;
  eventEl.value = state.event;

  samplesEl.addEventListener('change', () => { if (samplesEl.value !== '__custom') loadSample(samplesEl.value); yamlEl.value = yaml; eventEl.value = state.event; refreshActions(); renderKnobs(); schedule(0); });
  yamlEl.addEventListener('input', () => { yaml = yamlEl.value; samplesEl.value = '__custom'; $('sample-blurb').textContent = ''; schedule(180); });
  eventEl.addEventListener('change', () => { state.event = eventEl.value; state.action = defaultAction(state.event); refreshActions(); renderKnobs(); schedule(0); });
  actionEl.addEventListener('change', () => { state.action = actionEl.value; schedule(0); });
  bindText('repository', 'repository'); bindText('default-branch', 'defaultBranch'); bindText('actor', 'actor');
  $<HTMLInputElement>('cancelled').addEventListener('change', (e) => { state.cancelled = (e.target as HTMLInputElement).checked; schedule(0); });
  $('share').addEventListener('click', () => {
    const url = location.origin + location.pathname + encodeShare(yaml, state);
    history.replaceState(null, '', encodeShare(yaml, state));
    navigator.clipboard?.writeText(url).then(() => toast('Link copied. It contains the workflow and the scenario, nothing else.'), () => toast('Link is in the address bar.'));
  });
  $('theme').addEventListener('click', () => {
    const cur = document.documentElement.getAttribute('data-theme');
    const next = cur === 'dark' ? 'light' : cur === 'light' ? 'dark' : matchMedia('(prefers-color-scheme: dark)').matches ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch { /* ignore */ }
  });
  try { const t = localStorage.getItem('theme'); if (t) document.documentElement.setAttribute('data-theme', t); } catch { /* ignore */ }

  refreshActions();
  renderKnobs();
  syncCommonFields();
  schedule(0);
}

function bindText(id: string, key: 'repository' | 'defaultBranch' | 'actor') {
  const el = $<HTMLInputElement>(id);
  el.addEventListener('input', () => { state[key] = el.value; schedule(120); });
}

function syncCommonFields() {
  $<HTMLInputElement>('repository').value = state.repository;
  $<HTMLInputElement>('default-branch').value = state.defaultBranch;
  $<HTMLInputElement>('actor').value = state.actor;
  $<HTMLInputElement>('cancelled').checked = state.cancelled;
}

function loadSample(id: string) {
  const s = SAMPLES.find((x) => x.id === id) ?? SAMPLES[0]!;
  yaml = s.yaml;
  state = { ...DEFAULT_STATE, ...(s.scenario as Partial<ScenarioState>) };
  if (!state.action) state.action = defaultAction(state.event);
  $('sample-blurb').textContent = s.blurb;
  syncCommonFields();
}

function refreshActions() {
  const actions = PAYLOADS[state.event]?.actions ?? [];
  actionEl.replaceChildren();
  const wrap = $('action-wrap');
  if (!actions.length) { wrap.style.display = 'none'; state.action = ''; return; }
  wrap.style.display = '';
  for (const a of actions) actionEl.append(h('option', { value: a, text: a }));
  if (!actions.includes(state.action)) state.action = defaultAction(state.event);
  actionEl.value = state.action;
}

// ---------- scenario knobs ----------
function renderKnobs() {
  knobsEl.replaceChildren();
  const ev = state.event;
  const text = (label: string, key: keyof ScenarioState, opts: { wide?: boolean; placeholder?: string } = {}) => {
    const input = h('input', { type: 'text', spellcheck: 'false', placeholder: opts.placeholder });
    input.value = String(state[key] ?? '');
    input.addEventListener('input', () => { (state as unknown as Record<string, unknown>)[key] = input.value; schedule(120); });
    knobsEl.append(h('label', { class: opts.wide ? 'wide' : '' }, label, input));
  };
  const check = (label: string, key: 'fork' | 'draft') => {
    const input = h('input', { type: 'checkbox' });
    input.checked = state[key];
    input.addEventListener('change', () => { state[key] = input.checked; schedule(0); });
    knobsEl.append(h('label', { class: 'check wide' }, input, label));
  };
  const area = (label: string, key: 'changedFiles' | 'labels', placeholder: string) => {
    const ta = h('textarea', { spellcheck: 'false', placeholder });
    ta.value = state[key];
    ta.addEventListener('input', () => { state[key] = ta.value; schedule(150); });
    knobsEl.append(h('label', { class: 'wide' }, label, ta));
  };

  if (ev === 'push' || ev === 'create' || ev === 'delete') {
    const sel = h('select');
    sel.append(h('option', { value: 'branch', text: 'branch' }), h('option', { value: 'tag', text: 'tag' }));
    sel.value = state.refType;
    sel.addEventListener('change', () => { state.refType = sel.value as 'branch' | 'tag'; renderKnobs(); schedule(0); });
    knobsEl.append(h('label', {}, 'Ref type', sel));
    if (state.refType === 'tag') text('Tag', 'tag', { placeholder: 'v1.2.0' });
    else text('Branch', 'branch', { placeholder: 'main' });
    if (ev === 'push') {
      text('Head commit message', 'commitMessage', { wide: true });
      area('Changed files (one per line; GitHub strips these from the Actions payload, so you type them)', 'changedFiles', 'src/app.ts\ndocs/guide.md');
    }
  } else if (PR_EVENTS.has(ev)) {
    text('Head branch', 'headBranch', { placeholder: 'feature/login' });
    text('Base branch', 'baseBranch', { placeholder: 'main' });
    check('Pull request comes from a fork', 'fork');
    check('Draft pull request', 'draft');
    area('Labels on the pull request (comma-separated)', 'labels', 'release, bug');
    area('Changed files (one per line)', 'changedFiles', 'src/app.ts');
  } else if (ev === 'release') {
    text('Tag', 'tag', { placeholder: 'v1.2.0', wide: true });
  } else if (ev === 'workflow_dispatch') {
    text('Branch (ref chosen in the Run workflow dialog)', 'branch', { wide: true, placeholder: 'main' });
    renderDispatchInputs();
  } else if (BRANCH_EVENTS.has(ev)) {
    text(ev === 'workflow_run' ? 'Branch of the triggering run' : 'Branch (default branch for this event)', 'branch', { wide: true, placeholder: 'main' });
    if (LABEL_EVENTS.has(ev)) area('Labels (comma-separated)', 'labels', 'bug');
  }
}

function renderDispatchInputs() {
  const defs = (workflow && ((workflow.events as Record<string, unknown>)['workflow_dispatch'] as { inputs?: Record<string, { type?: string; default?: unknown; options?: string[]; description?: string }> } | null | undefined)?.inputs) ?? {};
  const names = Object.keys(defs);
  if (!names.length) { knobsEl.append(h('p', { class: 'muted wide', text: workflow ? 'This workflow declares no workflow_dispatch inputs.' : '' })); return; }
  for (const name of names) {
    const def = defs[name]!;
    const current = state.inputs[name] !== undefined ? state.inputs[name] : def.default;
    if (def.type === 'boolean') {
      const input = h('input', { type: 'checkbox' });
      input.checked = current === true || current === 'true';
      input.addEventListener('change', () => { state.inputs = { ...state.inputs, [name]: input.checked }; schedule(0); });
      knobsEl.append(h('label', { class: 'check wide' }, input, `inputs.${name} (boolean)`));
    } else if (def.type === 'choice' && def.options?.length) {
      const sel = h('select');
      for (const o of def.options) sel.append(h('option', { value: o, text: o }));
      sel.value = String(current ?? def.options[0]);
      sel.addEventListener('change', () => { state.inputs = { ...state.inputs, [name]: sel.value }; schedule(0); });
      knobsEl.append(h('label', {}, `inputs.${name} (choice)`, sel));
    } else {
      const input = h('input', { type: 'text', spellcheck: 'false' });
      input.value = current === undefined ? '' : String(current);
      input.addEventListener('input', () => { state.inputs = { ...state.inputs, [name]: input.value }; schedule(120); });
      knobsEl.append(h('label', {}, `inputs.${name} (${def.type ?? 'string'})`, input));
    }
  }
}

// ---------- run ----------
function schedule(ms: number) {
  if (parseTimer) clearTimeout(parseTimer);
  parseTimer = window.setTimeout(run, ms);
}

async function run() {
  const status = $('parse-status');
  try {
    const hadDispatchInputs = workflow ? JSON.stringify((workflow.events as Record<string, unknown>)['workflow_dispatch'] ?? null) : '';
    workflow = await parseWorkflowFile(yaml);
    const nowDispatchInputs = JSON.stringify((workflow.events as Record<string, unknown>)['workflow_dispatch'] ?? null);
    if (state.event === 'workflow_dispatch' && hadDispatchInputs !== nowDispatchInputs) renderKnobs();
    const inputs = toEngineInputs(state, workflow);
    sim = simulate({ workflow, github: inputs.github, inputs: inputs.inputs, trigger: inputs.trigger, forcedResults: state.forcedResults, cancelled: state.cancelled });
    status.textContent = workflow.errors.length ? `${workflow.jobs.length} jobs · ${workflow.errors.length} problem${workflow.errors.length === 1 ? '' : 's'}` : `${workflow.jobs.length} job${workflow.jobs.length === 1 ? '' : 's'} · parsed with @actions/workflow-parser`;
    render(inputs.github, inputs.notes);
  } catch (e) {
    status.textContent = 'Could not simulate';
    $('problems').replaceChildren(h('div', { class: 'problem', text: (e as Error).message }));
  }
}

// ---------- render ----------
function render(github: Record<string, unknown>, notes: string[]) {
  if (!sim || !workflow) return;
  const trig = $('trigger');
  const t = sim.trigger;
  trig.replaceChildren(
    h('div', { class: `card trigger ${t.matched ? '' : 'no'}` },
      h('h3', {}, h('span', { class: `pill ${t.matched ? 'yes' : 'no'}`, text: t.matched ? 'triggers' : 'does not trigger' }), `${state.event}${state.action ? ' · ' + state.action : ''} → ${workflow.name ?? 'this workflow'}`),
      h('details', { open: !t.matched }, h('summary', { text: 'How the on: block was matched' }), h('ul', { class: 'reasons' }, ...t.reasons.map((r) => h('li', { text: r })))),
      ...sim.triggerNotes.map((n) => h('div', { class: 'note', text: n })),
    ),
  );

  const problems = $('problems');
  problems.replaceChildren(
    ...sim.fileProblems.map((p) => h('div', { class: 'problem' }, h('strong', { text: 'GitHub rejects this file: ' }), p)),
    ...sim.graphProblems.map((p) => h('div', { class: 'problem' }, h('strong', { text: 'GitHub rejects this file: ' }), p)),
    ...(sim.rejected ? [h('div', { class: 'note', text: 'A rejected file produces a failed run named after the file path, with no jobs. Nothing below runs until the file is fixed.' })] : []),
  );

  const jobs = $('jobs');
  jobs.replaceChildren(...sim.jobs.map(renderJob));

  const ctx = $('context');
  const rows = Object.entries(github).filter(([k]) => k !== 'event' && k !== 'token');
  ctx.replaceChildren(
    ...notes.map((n) => h('p', { class: 'muted', text: n })),
    h('table', { class: 'ctx' }, ...rows.map(([k, v]) => {
      const doc = FIELD_DOCS.get(k);
      return h('tr', {}, h('td', { title: doc ? `${doc.description}\n\n"${doc.quote}"\n${doc.url}` : undefined, text: 'github.' + k }), h('td', { text: typeof v === 'string' ? JSON.stringify(v) : JSON.stringify(v) }));
    })),
    h('details', {}, h('summary', { text: 'github.event (the webhook payload, patched with your scenario)' }), h('pre', { class: 'json', text: JSON.stringify(github['event'], null, 2) })),
  );
}

function renderJob(v: JobVerdict): HTMLElement {
  const job = v.job;
  const card = h('div', { class: 'card' });
  const title = h('h3', {}, h('span', { class: `pill ${v.outcome}`, text: pillText(v.outcome) }), h('span', { class: 'mono', text: job.id }), job.name && job.name !== job.id ? h('span', { class: 'muted', text: job.name }) : null, job.reusable ? h('span', { class: 'chip', text: 'reusable workflow' }) : null);
  if (v.outcome === 'runs' || v.outcome === 'fails' || v.outcome === 'cancelled') {
    const sel = h('select');
    for (const r of ['success', 'failure', 'cancelled'] as JobResult[]) sel.append(h('option', { value: r, text: r }));
    sel.value = state.forcedResults[job.id] ?? (state.cancelled ? 'cancelled' : 'success');
    sel.addEventListener('change', () => { state.forcedResults = { ...state.forcedResults, [job.id]: sel.value as JobResult }; schedule(0); });
    title.append(h('span', { class: 'force' }, 'ends with', sel));
  }
  card.append(title);
  if (v.outcome === 'rejected') {
    // The parser may have dropped the very condition it rejected, so showing the if: line here would mislead.
    card.append(h('p', { class: 'reason', text: v.headline }));
    return card;
  }
  if (job.needs.length) {
    card.append(h('div', { class: 'needs' }, 'needs: ', ...job.needs.map((n) => h('span', { class: 'chip', text: `${n} → ${v.needsResults[n] ?? '?'}` }))));
    const upstream = Object.entries(v.ancestorResults).filter(([id, r]) => !job.needs.includes(id) && r !== 'success');
    if (upstream.length) card.append(h('div', { class: 'needs' }, 'further upstream: ', ...upstream.map(([id, r]) => h('span', { class: 'chip', text: `${id} → ${r}` })), h('span', { class: 'muted', text: 'status functions look at every ancestor' })));
    // Why did those upstream jobs not succeed? Show each one's own condition and decisive values right here, so the
    // reader does not have to scroll up to chase the chain.
    const culprits = Object.entries(v.ancestorResults).filter(([, r]) => r !== 'success').map(([id]) => sim!.jobs.find((x) => x.job.id === id)).filter((x): x is JobVerdict => !!x);
    if (culprits.length && (v.outcome === 'skipped' || v.outcome === 'runs' || v.outcome === 'fails')) {
      const list = h('ul', { class: 'upstream' });
      for (const c of culprits) {
        const cond = c.job.ifSource ? `if: ${c.job.ifSource}` : 'no if:';
        list.append(h('li', {}, h('code', { text: c.job.id }), h('span', { class: 'muted', text: ` ${cond} → ` }), h('span', { text: c.headline })));
      }
      card.append(h('details', { open: v.outcome === 'skipped' }, h('summary', { text: `why ${culprits.length === 1 ? 'that upstream job' : 'those upstream jobs'} did not succeed` }), list));
    }
  }
  const ifLine = h('code', { class: 'expr' });
  if (job.ifSource) {
    const wrapped = job.if !== job.ifSource;
    ifLine.append(h('span', { class: 'wrap', text: 'if: ' }), job.ifSource, wrapped ? h('span', { class: 'wrap', text: `   → evaluated as ${job.if}` }) : '');
  } else {
    ifLine.append(h('span', { class: 'wrap', text: 'no if: → evaluated as ' }), job.if);
  }
  card.append(ifLine);
  card.append(h('p', { class: 'reason', text: v.headline }));
  for (const p of v.problems) card.append(h('div', { class: 'problem', text: p.message }));
  if (v.evaluation && v.evaluation.ok && v.evaluation.subValues.length) card.append(traceDetails(v.evaluation));
  if (v.evaluation && !v.evaluation.ok) card.append(h('div', { class: 'problem', text: v.evaluation.error }));
  if (job.steps.length) {
    const list = h('ul', { class: 'steps' });
    for (const s of v.stepVerdicts) {
      const ev = s.evaluation;
      const pill = !s.if ? h('span', { class: 'pill runs', text: 'runs' }) : s.unknown ? h('span', { class: 'pill blocked', text: 'unknown' }) : ev && ev.ok ? h('span', { class: `pill ${ev.truthy ? 'runs' : 'skipped'}`, text: ev.truthy ? 'runs' : 'skipped' }) : h('span', { class: 'pill blocked', text: 'unknown' });
      const li = h('li', {}, pill, h('code', { text: s.summary || s.id }), s.if ? h('span', { class: 'muted', text: `if: ${s.if}` }) : null);
      if (s.unknown) li.append(h('span', { class: 'muted', text: `→ ${s.unknown}` }));
      else if (ev && ev.ok && s.if) li.append(h('span', { class: 'muted', text: `→ ${ev.reason}` }));
      if (ev && !ev.ok) li.append(h('span', { class: 'muted', text: ev.error }));
      for (const p of s.problems) li.append(h('span', { class: 'problem', text: p.message }));
      list.append(li);
    }
    card.append(h('details', {}, h('summary', { text: `${job.steps.length} step${job.steps.length === 1 ? '' : 's'}` }), list));
  }
  return card;
}

function traceDetails(ev: EvaluationResult): HTMLElement {
  const table = h('table', { class: 'trace' });
  for (const s of ev.subValues) table.append(h('tr', {}, h('td', { text: s.text }), h('td', { text: `${s.value}` })));
  return h('details', {}, h('summary', { text: 'Every sub-expression and its value' }), table);
}

function pillText(o: JobVerdict['outcome']): string {
  return o === 'runs' ? 'runs' : o === 'skipped' ? 'skipped' : o === 'fails' ? 'runs, fails' : o === 'cancelled' ? 'cancelled' : 'not run';
}

let toastTimer: number | undefined;
function toast(msg: string) {
  let el = document.querySelector<HTMLDivElement>('.toast');
  if (!el) { el = h('div', { class: 'toast' }); document.body.append(el); }
  el.textContent = msg;
  el.classList.add('show');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => el!.classList.remove('show'), 2500);
}

init();
export type { EvaluationFailure };
