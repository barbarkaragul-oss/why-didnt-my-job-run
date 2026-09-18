import { parseWorkflowFile, type ParsedWorkflow } from '../engine/workflow.js';
import { simulate, type Simulation, type JobVerdict, type StepVerdict, type CombinationVerdict } from '../engine/simulate.js';
import { matrixOutputFields } from '../engine/matrix.js';
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
  // A shared scenario lives in the URL fragment; jumping to the results must not replace it with #results.
  document.querySelector('.mobile-note a')?.addEventListener('click', (e) => { e.preventDefault(); $('results').scrollIntoView({ block: 'start' }); });

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
  outputFieldsKey = '';
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

// ---------- job outputs a matrix reads ----------
// A matrix built from `fromJSON(needs.<job>.outputs.<name>)` depends on what that job writes at run time. The page
// asks for the value instead of guessing: unknown, empty, or the example the workflow itself echoes.
let outputFieldsKey = '';
let outputTimer: number | undefined;

function renderOutputFields() {
  const el = $('outputs');
  const fields = workflow ? matrixOutputFields(workflow) : [];
  const key = JSON.stringify(fields);
  if (key === outputFieldsKey) return;
  outputFieldsKey = key;
  el.replaceChildren();
  if (!fields.length) return;
  el.append(
    h('h3', { text: 'Job outputs a matrix reads' }),
    h('p', { class: 'muted', text: 'The value is the string the job writes to $GITHUB_OUTPUT, usually JSON. Left empty, it is unknown and the matrix is not expanded.' }),
  );
  for (const f of fields) {
    const input = h('input', { type: 'text', spellcheck: 'false', placeholder: 'unknown', 'aria-label': `needs.${f.job}.outputs.${f.output}` });
    input.value = state.jobOutputs?.[f.job]?.[f.output] ?? '';
    const set = (value: string | undefined) => {
      const all = { ...(state.jobOutputs ?? {}) };
      const forJob = { ...(all[f.job] ?? {}) };
      if (value === undefined || value === '') delete forJob[f.output];
      else forJob[f.output] = value;
      if (Object.keys(forJob).length) all[f.job] = forJob;
      else delete all[f.job];
      state.jobOutputs = all;
    };
    input.addEventListener('input', () => {
      if (outputTimer) clearTimeout(outputTimer);
      outputTimer = window.setTimeout(() => { set(input.value); schedule(0); }, 150);
    });
    const choice = (label: string, value: string | undefined) => {
      const b = h('button', { type: 'button', text: label });
      b.addEventListener('click', () => { set(value); input.value = value ?? ''; schedule(0); });
      return b;
    };
    const empty = f.wholeMatrix ? '{"include":[]}' : '[]';
    el.append(h('div', { class: 'output' },
      h('div', {}, h('code', { text: `needs.${f.job}.outputs.${f.output}` }), h('span', { class: 'muted', text: ` read by ${f.readBy.join(', ')}` })),
      input,
      h('div', { class: 'choices' },
        choice('unknown', undefined),
        choice(`${empty} (empty)`, empty),
        f.example !== undefined && f.example !== empty ? choice(`${f.example} (from the file)`, f.example) : null),
    ));
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
    renderOutputFields();
    const inputs = toEngineInputs(state, workflow);
    sim = simulate({ workflow, github: inputs.github, inputs: inputs.inputs, trigger: inputs.trigger, forcedResults: state.forcedResults, cancelled: state.cancelled, outputs: state.jobOutputs });
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

  // What the simulation takes on trust for this workflow, said before the verdicts that rest on it.
  $('limits').replaceChildren(...(sim.limits.length ? [h('div', { class: 'limits', role: 'note' },
    h('p', { class: 'limits-head', text: 'What this simulation cannot fully decide here' }),
    h('ul', {}, ...sim.limits.map((l) => h('li', {}, h('strong', { text: l.title }), `: ${l.where.join('; ')}. `, h('span', { class: 'instead', text: l.instead })))),
  )] : []));

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
  const combinations = v.matrix?.combinations ?? [];
  const title = h('h3', {}, h('span', { class: `pill ${v.outcome}`, text: pillText(v.outcome) }), h('span', { class: 'mono', text: job.id }), job.name && job.name !== job.id ? h('span', { class: 'muted', text: job.name }) : null, job.reusable ? h('span', { class: 'chip', text: 'reusable workflow' }) : null, v.matrix ? h('span', { class: 'chip', text: combinations.length ? `matrix · ${combinations.length} job${combinations.length === 1 ? '' : 's'}` : 'matrix' }) : null);
  // A matrix that expanded is marked combination by combination below.
  if ((v.outcome === 'runs' || v.outcome === 'fails' || v.outcome === 'cancelled') && !combinations.length) title.append(forceSelect(job.id, state.forcedResults[job.id]));
  card.append(title);
  // A job skipped because of a job upstream: where the skip started comes first, before the chips and the condition.
  if (v.rootCause) {
    const rc = v.rootCause;
    card.append(h('p', { class: 'rootcause' }, ...rc.segments.map((seg) => (seg.code ? h('code', { text: seg.text }) : seg.text)), v.headline.slice(rc.line.length)));
  }
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
    if (culprits.length && (v.outcome === 'skipped' || v.outcome === 'runs' || v.outcome === 'fails' || v.outcome === 'not-created')) {
      const list = h('ul', { class: 'upstream' });
      for (const c of culprits) {
        const cond = c.job.ifSource ? `if: ${c.job.ifSource}` : 'no if:';
        list.append(h('li', {}, h('code', { text: c.job.id }), h('span', { class: 'muted', text: ` ${cond} → ` }), h('span', { text: c.headline })));
      }
      // Open for a skipped job, unless its root cause above already says it.
      card.append(h('details', { open: v.outcome === 'skipped' && !v.rootCause }, h('summary', { text: `why ${culprits.length === 1 ? 'that upstream job' : 'those upstream jobs'} did not succeed` }), list));
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
  if (!v.rootCause) card.append(h('p', { class: 'reason', text: v.headline }));
  for (const p of v.problems) card.append(h('div', { class: 'problem', text: p.message }));
  if (v.evaluation && v.evaluation.ok && v.evaluation.subValues.length) card.append(traceDetails(v.evaluation));
  if (v.evaluation && !v.evaluation.ok) card.append(h('div', { class: 'problem', text: v.evaluation.error }));
  if (v.matrix) card.append(renderMatrix(v));
  // Each combination lists its own steps; a job that was never created has none.
  if (job.steps.length && !combinations.length && v.outcome !== 'not-created') {
    card.append(h('details', {}, h('summary', { text: `${job.steps.length} step${job.steps.length === 1 ? '' : 's'}` }), renderSteps(v.stepVerdicts)));
  }
  return card;
}

function forceSelect(key: string, forced: JobResult | undefined): HTMLElement {
  const sel = h('select', { 'aria-label': `${key} ends with` });
  for (const r of ['success', 'failure', 'cancelled'] as JobResult[]) sel.append(h('option', { value: r, text: r }));
  sel.value = forced ?? (state.cancelled ? 'cancelled' : 'success');
  sel.addEventListener('change', () => { state.forcedResults = { ...state.forcedResults, [key]: sel.value as JobResult }; schedule(0); });
  return h('span', { class: 'force' }, 'ends with', sel);
}

function renderSteps(steps: StepVerdict[]): HTMLElement {
  const list = h('ul', { class: 'steps' });
  for (const s of steps) {
    const ev = s.evaluation;
    const pill = !s.if ? h('span', { class: 'pill runs', text: 'runs' }) : s.unknown ? h('span', { class: 'pill blocked', text: 'unknown' }) : ev && ev.ok ? h('span', { class: `pill ${ev.truthy ? 'runs' : 'skipped'}`, text: ev.truthy ? 'runs' : 'skipped' }) : h('span', { class: 'pill blocked', text: 'unknown' });
    const li = h('li', {}, pill, h('code', { text: s.summary || s.id }), s.if ? h('span', { class: 'muted', text: `if: ${s.if}` }) : null);
    if (s.unknown) li.append(h('span', { class: 'muted', text: `→ ${s.unknown}` }));
    else if (ev && ev.ok && s.if) li.append(h('span', { class: 'muted', text: `→ ${ev.reason}` }));
    if (ev && !ev.ok) li.append(h('span', { class: 'muted', text: ev.error }));
    for (const p of s.problems) li.append(h('span', { class: 'problem', text: p.message }));
    list.append(li);
  }
  return list;
}

/** The strategy in one line, then one row per combination, or why there is none. */
function renderMatrix(v: JobVerdict): HTMLElement {
  const m = v.matrix!;
  const box = h('div', { class: 'matrix' }, h('code', { class: 'expr' }, h('span', { class: 'wrap', text: 'strategy: ' }), m.line.replace(/^strategy: /, '')));
  const e = m.expansion;
  if (e.kind === 'not-expanded') {
    if (v.outcome === 'skipped') box.append(h('p', { class: 'muted', text: 'One skipped job, not one per combination: GitHub decides the job\'s if: before it expands the matrix, and lists the job under its plain name.' }));
  } else if (e.kind === 'unknown') {
    const names = e.reads.filter((r) => r.source === 'unknown').map((r) => `needs.${r.job}.outputs.${r.output}`);
    box.append(h('p', { class: 'muted', text: `Give ${names.join(' and ')} a value under "Job outputs a matrix reads" (in the Event panel) to see the jobs it makes.` }));
  } else if (e.kind === 'empty' || e.kind === 'error') {
    const dependents = sim!.jobs.filter((x) => x.job.needs.includes(v.job.id));
    if (dependents.length) {
      box.append(h('div', { class: 'needs' }, `needs.${v.job.id}.result is failure for: `, ...dependents.map((d) => h('span', { class: 'chip', text: `${d.job.id} → ${pillText(d.outcome)}${d.job.ifSource ? '' : ' (no if:)'}` }))));
    }
  } else if (e.kind === 'combinations') {
    const list = h('ul', { class: 'combos' });
    for (const c of m.combinations) list.append(renderCombination(v, c));
    box.append(list);
  }
  return box;
}

function renderCombination(v: JobVerdict, c: CombinationVerdict): HTMLElement {
  const head = h('div', { class: 'combo-head' }, h('span', { class: `pill ${c.outcome}`, text: pillText(c.outcome) }), h('span', { class: 'mono', text: c.combination.name }), c.combination.origin === 'include' ? h('span', { class: 'chip', text: 'from include' }) : null, forceSelect(c.key, state.forcedResults[c.key] ?? state.forcedResults[v.job.id]));
  const li = h('li', { class: 'combo' }, head);
  if (c.annotation) li.append(h('div', { class: 'note' }, h('strong', { text: 'Annotation: ' }), c.annotation));
  else if (c.headline !== 'Runs.') li.append(h('div', { class: 'muted', text: c.headline }));
  const steps = c.stepVerdicts;
  // The parser gives a step without if: the condition success(); that one is not worth counting.
  const decided = steps.filter((s) => s.if && s.if !== 'success()').length;
  li.append(h('details', {},
    h('summary', { text: `matrix values${steps.length ? ` and ${steps.length} step${steps.length === 1 ? '' : 's'}${decided ? ` (${decided} with a condition)` : ''}` : ''}` }),
    h('code', { class: 'expr', text: `matrix: ${JSON.stringify(c.combination.matrix)}` }),
    steps.length ? renderSteps(steps) : null));
  return li;
}

function traceDetails(ev: EvaluationResult): HTMLElement {
  const table = h('table', { class: 'trace' });
  for (const s of ev.subValues) table.append(h('tr', {}, h('td', { text: s.text }), h('td', { text: `${s.value}` })));
  return h('details', {}, h('summary', { text: 'Every sub-expression and its value' }), table);
}

function pillText(o: JobVerdict['outcome']): string {
  return o === 'runs' ? 'runs' : o === 'skipped' ? 'skipped' : o === 'fails' ? 'runs, fails' : o === 'cancelled' ? 'cancelled' : o === 'not-created' ? 'no job created' : 'not run';
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
