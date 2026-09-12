/**
 * Context and function availability per workflow key. GitHub's parser package does not enforce
 * this (its language server reports it separately), but GitHub itself rejects the whole workflow
 * file when a job-level `if:` uses `matrix`, `steps`, `env` or `hashFiles()`: the run appears as a
 * failed run named after the file path, on every event, with no jobs. That is exactly what the
 * private fixtures repository recorded for fixture-hashfiles.yml.
 *
 * Table from the docs, "Contexts" > "Context availability".
 */
import type { Expr } from '@actions/expressions';
import { ContextAccess, FunctionCall, Binary, Grouping, IndexAccess, Logical, Unary } from '@actions/expressions/ast';

export type WorkflowKey = 'jobs.<job_id>.if' | 'jobs.<job_id>.steps.if' | 'jobs.<job_id>.strategy' | 'jobs.<job_id>.runs-on' | 'jobs.<job_id>.env' | 'jobs.<job_id>.steps.env';

export const AVAILABILITY: Record<WorkflowKey, { contexts: string[]; functions: string[] }> = {
  'jobs.<job_id>.if': { contexts: ['github', 'needs', 'vars', 'inputs'], functions: ['always', 'cancelled', 'success', 'failure'] },
  'jobs.<job_id>.steps.if': { contexts: ['github', 'needs', 'strategy', 'matrix', 'job', 'runner', 'env', 'vars', 'steps', 'inputs'], functions: ['always', 'cancelled', 'success', 'failure', 'hashFiles'] },
  'jobs.<job_id>.strategy': { contexts: ['github', 'needs', 'vars', 'inputs'], functions: [] },
  'jobs.<job_id>.runs-on': { contexts: ['github', 'needs', 'strategy', 'matrix', 'vars', 'inputs'], functions: [] },
  'jobs.<job_id>.env': { contexts: ['github', 'needs', 'strategy', 'matrix', 'vars', 'secrets', 'inputs'], functions: [] },
  'jobs.<job_id>.steps.env': { contexts: ['github', 'needs', 'strategy', 'matrix', 'job', 'runner', 'env', 'vars', 'secrets', 'steps', 'inputs'], functions: ['hashFiles'] },
};

/** Functions every expression may use anywhere (docs, "Expressions" > "Functions"). */
const GENERAL_FUNCTIONS = new Set(['contains', 'startsWith', 'endsWith', 'format', 'join', 'toJSON', 'fromJSON']);

export interface AvailabilityProblem {
  kind: 'context' | 'function';
  name: string;
  message: string;
}

export function collectNames(n: Expr, out: { contexts: Set<string>; functions: Set<string> }): void {
  if (n instanceof ContextAccess) out.contexts.add(n.name.lexeme);
  else if (n instanceof FunctionCall) { out.functions.add(n.functionName.lexeme); n.args.forEach((a) => collectNames(a, out)); }
  else if (n instanceof IndexAccess) { collectNames(n.expr, out); collectNames(n.index, out); }
  else if (n instanceof Binary) { collectNames(n.left, out); collectNames(n.right, out); }
  else if (n instanceof Logical) n.args.forEach((a) => collectNames(a, out));
  else if (n instanceof Unary) collectNames(n.expr, out);
  else if (n instanceof Grouping) collectNames(n.group, out);
}

export function checkAvailability(ast: Expr, key: WorkflowKey): AvailabilityProblem[] {
  const names = { contexts: new Set<string>(), functions: new Set<string>() };
  collectNames(ast, names);
  const allowed = AVAILABILITY[key];
  const problems: AvailabilityProblem[] = [];
  for (const c of names.contexts) {
    if (!allowed.contexts.includes(c)) problems.push({ kind: 'context', name: c, message: `The ${c} context is not available in ${key}; GitHub rejects the workflow file. Allowed here: ${allowed.contexts.join(', ')}.` });
  }
  for (const f of names.functions) {
    const lower = [...GENERAL_FUNCTIONS].some((g) => g.toLowerCase() === f.toLowerCase());
    if (lower) continue;
    if (!allowed.functions.some((g) => g.toLowerCase() === f.toLowerCase())) problems.push({ kind: 'function', name: f, message: `${f}() is not available in ${key}; GitHub rejects the workflow file.${allowed.functions.length ? ' Allowed here: ' + allowed.functions.join(', ') + '.' : ''}` });
  }
  return problems;
}
