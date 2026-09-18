/**
 * Parse a workflow file with GitHub's own parser (@actions/workflow-parser) and reduce it to the
 * model the simulator needs. Nothing here re-implements YAML or the workflow schema: parse errors,
 * defaults (a job without `if:` gets `success()`), needs, strategy and steps all come from the
 * same code GitHub ships in its language server.
 */
import { parseWorkflow, convertWorkflowTemplate, NoOperationTraceWriter, isMapping, isString } from '@actions/workflow-parser';
import { ErrorPolicy } from '@actions/workflow-parser/model/convert';
import type { WorkflowTemplate, WorkflowJob, Step } from '@actions/workflow-parser/model/workflow-template';
import type { TemplateToken } from '@actions/workflow-parser/templates/tokens/template-token';

export interface ParsedStep {
  id: string;
  name: string | undefined;
  /** Condition without `${{ }}`; the parser already wrapped defaults, e.g. `success()`. */
  if: string | undefined;
  kind: 'run' | 'uses' | 'other';
  summary: string;
  line: number | undefined;
  /** The whole `run:` script as written (a matrix reads job outputs; the page looks here for an example value). */
  run?: string;
}

export interface ParsedJob {
  id: string;
  name: string | undefined;
  needs: string[];
  /** Condition as GitHub evaluates it, including the implicit `success() && (...)` wrapper. */
  if: string;
  /** The condition as written in the file (inside `${{ }}` or bare), or undefined when omitted. */
  ifSource: string | undefined;
  line: number | undefined;
  /** Raw strategy token (matrix), expanded by matrix.ts; undefined when the job has none. */
  strategy: TemplateToken | undefined;
  /** `outputs:` as written, name -> value (`${{ steps.x.outputs.y }}` stays text); undefined when the job has none. */
  outputs?: Record<string, string>;
  runsOn: string | undefined;
  reusable: boolean;
  /** For a reusable workflow job, the workflow it calls (`uses:`). */
  uses?: string;
  /** `environment:` as written, or its `name:`. Its protection rules live in the repository's settings. */
  environment?: string;
  /** `concurrency:` as written (the group); only its presence matters to the simulation, which does not model it. */
  concurrency?: string;
  steps: ParsedStep[];
}

export interface ParsedWorkflow {
  name: string | undefined;
  /** on: configuration exactly as the parser normalised it (types, branches, paths, ...). */
  events: WorkflowTemplate['events'];
  jobs: ParsedJob[];
  errors: string[];
  /** The workflow-level `concurrency:` group as written. */
  concurrency?: string;
}

const SUCCESS_WRAPPER = /^success\(\) && \((.*)\)$/s;

export async function parseWorkflowFile(content: string, fileName = 'workflow.yml'): Promise<ParsedWorkflow> {
  const result = parseWorkflow({ name: fileName, content }, new NoOperationTraceWriter());
  const errors = result.context.errors.getErrors().map((e) => e.message);
  if (!result.value) return { name: undefined, events: {}, jobs: [], errors: errors.length ? errors : ['The file could not be parsed as a workflow.'] };
  let template: WorkflowTemplate;
  try {
    // TryConversion: keep whatever converted so the UI can still show jobs next to the errors.
    template = await convertWorkflowTemplate(result.context, result.value, undefined, { errorPolicy: ErrorPolicy.TryConversion });
  } catch (e) {
    return { name: undefined, events: {}, jobs: [], errors: [...errors, (e as Error).message] };
  }
  for (const e of template.errors ?? []) errors.push(e.Message);
  return {
    name: readName(content),
    events: template.events ?? {},
    jobs: (template.jobs ?? []).map(toJob),
    errors: [...new Set(errors)],
    ...(template.concurrency ? { concurrency: groupText(template.concurrency) } : {}),
  };
}

function toJob(job: WorkflowJob): ParsedJob {
  const expr = job.if?.expression ?? 'success()';
  const m = SUCCESS_WRAPPER.exec(expr);
  const ifSource = job.if?.source ?? (m ? m[1] : expr === 'success()' ? undefined : expr);
  const steps: ParsedStep[] = job.type === 'job' ? job.steps.map(toStep) : [];
  const runsOn = job.type === 'job' && job['runs-on'] ? tokenText(job['runs-on']) : undefined;
  return {
    id: job.id.value,
    name: job.name ? tokenText(job.name) : undefined,
    needs: (job.needs ?? []).map((n) => n.value),
    if: expr,
    ifSource,
    line: job.id.line,
    strategy: job.strategy,
    outputs: job.outputs ? Object.fromEntries([...job.outputs].map((p) => [tokenText(p.key), sourceText(p.value)])) : undefined,
    runsOn,
    reusable: job.type === 'reusableWorkflowJob',
    ...(job.type === 'reusableWorkflowJob' ? { uses: tokenText(job.ref) } : {}),
    ...(job.type === 'job' && job.environment ? { environment: fieldText(job.environment, 'name') } : {}),
    ...(job.concurrency ? { concurrency: groupText(job.concurrency) } : {}),
    steps,
  };
}

function toStep(step: Step, index: number): ParsedStep {
  const anyStep = step as unknown as Record<string, unknown>;
  const kind: ParsedStep['kind'] = 'run' in anyStep ? 'run' : 'uses' in anyStep ? 'uses' : 'other';
  // A run script with ${{ }} in it is a format() call to the parser; the summary shows the script as written.
  const runSource = kind === 'run' ? sourceText(anyStep['run'] as TemplateToken) : '';
  const summary = kind === 'run' ? (runSource !== tokenText(anyStep['run'] as TemplateToken) ? runSource.split('\n').map((l) => l.trim()).find(Boolean) ?? '' : runSource.split('\n')[0] ?? '') : kind === 'uses' ? tokenText(anyStep['uses'] as TemplateToken) : Object.keys(anyStep).filter((k) => !['id', 'name', 'if', 'continue-on-error'].includes(k)).join(', ');
  const ifToken = (anyStep['if'] as { expression?: string; line?: number } | undefined);
  return {
    id: step.id || `step-${index + 1}`,
    name: step.name ? tokenText(step.name) : undefined,
    if: ifToken?.expression,
    kind,
    summary,
    line: ifToken?.line,
    run: kind === 'run' ? runSource : undefined,
  };
}

/** The text as written in the file: a string that mixes text and `${{ }}` keeps its source, not the format() call it became. */
function sourceText(token: TemplateToken): string {
  const t = token as unknown as { expression?: unknown; source?: unknown };
  return typeof t.expression === 'string' && typeof t.source === 'string' ? t.source : tokenText(token);
}

/** `concurrency: ci-${{ github.ref }}` or `concurrency: { group: ..., cancel-in-progress: true }`: the group. */
function groupText(token: TemplateToken): string {
  return fieldText(token, 'group');
}

/** A scalar as written, or one key of a mapping (`environment: { name: production, url: ... }`). */
function fieldText(token: TemplateToken, key: string): string {
  if (isMapping(token)) {
    for (const pair of token) if (isString(pair.key) && pair.key.value === key) return sourceText(pair.value);
    return token.toString();
  }
  return sourceText(token);
}

function tokenText(token: TemplateToken | undefined): string {
  if (!token) return '';
  const t = token as unknown as { value?: unknown; expression?: string; toString(): string };
  if (typeof t.value === 'string') return t.value;
  if (typeof t.value === 'number' || typeof t.value === 'boolean') return String(t.value);
  if (typeof t.expression === 'string') return '${{ ' + t.expression + ' }}';
  return t.toString();
}

function readName(content: string): string | undefined {
  const m = /^name:\s*(.+?)\s*$/m.exec(content);
  return m ? m[1]?.replace(/^["']|["']$/g, '') : undefined;
}
