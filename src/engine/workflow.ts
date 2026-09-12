/**
 * Parse a workflow file with GitHub's own parser (@actions/workflow-parser) and reduce it to the
 * model the simulator needs. Nothing here re-implements YAML or the workflow schema: parse errors,
 * defaults (a job without `if:` gets `success()`), needs, strategy and steps all come from the
 * same code GitHub ships in its language server.
 */
import { parseWorkflow, convertWorkflowTemplate, NoOperationTraceWriter } from '@actions/workflow-parser';
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
  /** Raw strategy token (matrix), kept for later expansion; undefined when the job has none. */
  strategy: TemplateToken | undefined;
  runsOn: string | undefined;
  reusable: boolean;
  steps: ParsedStep[];
}

export interface ParsedWorkflow {
  name: string | undefined;
  /** on: configuration exactly as the parser normalised it (types, branches, paths, ...). */
  events: WorkflowTemplate['events'];
  jobs: ParsedJob[];
  errors: string[];
}

const SUCCESS_WRAPPER = /^success\(\) && \((.*)\)$/s;

export async function parseWorkflowFile(content: string, fileName = 'workflow.yml'): Promise<ParsedWorkflow> {
  const result = parseWorkflow({ name: fileName, content }, new NoOperationTraceWriter());
  const errors = result.context.errors.getErrors().map((e) => e.message);
  if (!result.value) return { name: undefined, events: {}, jobs: [], errors: errors.length ? errors : ['The file could not be parsed as a workflow.'] };
  let template: WorkflowTemplate;
  try {
    template = await convertWorkflowTemplate(result.context, result.value);
  } catch (e) {
    return { name: undefined, events: {}, jobs: [], errors: [...errors, (e as Error).message] };
  }
  for (const e of template.errors ?? []) errors.push(e.Message);
  return {
    name: readName(content),
    events: template.events ?? {},
    jobs: template.jobs.map(toJob),
    errors: [...new Set(errors)],
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
    runsOn,
    reusable: job.type === 'reusableWorkflowJob',
    steps,
  };
}

function toStep(step: Step, index: number): ParsedStep {
  const anyStep = step as unknown as Record<string, unknown>;
  const kind: ParsedStep['kind'] = 'run' in anyStep ? 'run' : 'uses' in anyStep ? 'uses' : 'other';
  const summary = kind === 'run' ? tokenText(anyStep['run'] as TemplateToken).split('\n')[0] ?? '' : kind === 'uses' ? tokenText(anyStep['uses'] as TemplateToken) : Object.keys(anyStep).filter((k) => !['id', 'name', 'if', 'continue-on-error'].includes(k)).join(', ');
  const ifToken = (anyStep['if'] as { expression?: string; line?: number } | undefined);
  return {
    id: step.id || `step-${index + 1}`,
    name: step.name ? tokenText(step.name) : undefined,
    if: ifToken?.expression,
    kind,
    summary,
    line: ifToken?.line,
  };
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
