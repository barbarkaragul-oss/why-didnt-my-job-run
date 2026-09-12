/**
 * `on:` trigger matching: does this event, with these branches / tags / paths / activity types,
 * start the workflow at all? This is the one part GitHub does not ship as a package, so it is
 * implemented here from the documented rules and checked against (a) every example in the docs
 * filter cheat sheet and (b) real runs recorded in the fixtures repository.
 *
 * Pattern rules (docs, "Filter pattern cheat sheet"):
 *   *   matches zero or more characters but not `/`
 *   **  matches zero or more of any character, including `/`
 *   ?   matches zero or one of the preceding character
 *   +   matches one or more of the preceding character
 *   []  character class, ranges allowed
 *   !   at the start negates the pattern; order matters: a negative pattern after a match excludes
 *       again, a positive pattern after an exclusion includes again
 *   \   escapes a special character
 * Patterns are anchored: they must match the whole branch/tag name (without refs/heads/) or the
 * whole file path. Branch and tag filters on push are independent lists: if only `tags` is set,
 * branch pushes do not run, and vice versa; if neither is set, everything runs.
 */
import type { ParsedWorkflow } from './workflow.js';

export interface FilterDecision {
  matched: boolean;
  /** Rule-by-rule explanation, in the order GitHub applies them. */
  reasons: string[];
}

export interface TriggerInput {
  event: string;
  action?: string;
  /** Branch or tag name without refs/heads/ or refs/tags/ (push, create, delete, workflow_dispatch). */
  refName?: string;
  refType?: 'branch' | 'tag';
  /** Pull request base branch (pull_request, pull_request_target). */
  baseBranch?: string;
  changedFiles?: string[];
}

/**
 * Default activity types when `types:` is omitted. Docs: pull_request and pull_request_target
 * default to opened, synchronize and reopened; for every other event "all activity types trigger
 * workflows that run on this event", so any activity type passes.
 */
export const DEFAULT_TYPES: Record<string, string[]> = {
  pull_request: ['opened', 'synchronize', 'reopened'],
  pull_request_target: ['opened', 'synchronize', 'reopened'],
};

/** Events whose workflow file must exist on the default branch to trigger at all (docs note on each event). */
export const DEFAULT_BRANCH_ONLY = new Set(['branch_protection_rule', 'check_run', 'check_suite', 'delete', 'discussion', 'discussion_comment', 'fork', 'gollum', 'issue_comment', 'issues', 'label', 'milestone', 'page_build', 'public', 'registry_package', 'repository_dispatch', 'schedule', 'status', 'watch', 'workflow_dispatch', 'workflow_run']);

/** Documented filter keys per event; anything else is not a documented filter and is reported. */
export const FILTERS_BY_EVENT: Record<string, string[]> = {
  push: ['branches', 'branches-ignore', 'tags', 'tags-ignore', 'paths', 'paths-ignore'],
  pull_request: ['branches', 'branches-ignore', 'paths', 'paths-ignore', 'types'],
  pull_request_target: ['branches', 'branches-ignore', 'paths', 'paths-ignore', 'types'],
  workflow_run: ['branches', 'branches-ignore', 'workflows', 'types'],
};

/** Static problems in an `on:` block that make GitHub reject or misread the workflow. */
export function validateTriggers(workflow: ParsedWorkflow): string[] {
  const problems: string[] = [];
  for (const [event, raw] of Object.entries(workflow.events as Record<string, unknown>)) {
    const cfg = (raw ?? {}) as Record<string, unknown>;
    for (const [a, b] of [['branches', 'branches-ignore'], ['tags', 'tags-ignore'], ['paths', 'paths-ignore']] as const) {
      if (cfg[a] !== undefined && cfg[b] !== undefined) problems.push(`on.${event}: ${a} and ${b} cannot both be used for the same event (docs: workflow syntax; verified: GitHub creates a failed run with no jobs).`);
    }
  }
  return problems;
}

/** Things the docs frown on that are not verified rejections: reported as notes on the trigger card, not as a rejected file. */
export function triggerWarnings(workflow: ParsedWorkflow): string[] {
  const warnings: string[] = [];
  for (const [event, raw] of Object.entries(workflow.events as Record<string, unknown>)) {
    const cfg = (raw ?? {}) as Record<string, unknown>;
    for (const key of ['branches', 'tags', 'paths'] as const) {
      const list = asStrings(cfg[key]);
      if (list.length && list.every((p) => p.startsWith('!'))) warnings.push(`on.${event}.${key} has only negative patterns: nothing can match, and GitHub creates no run at all (verified with a real push). Add a pattern without ! or use ${key}-ignore.`);
    }
    const allowed = FILTERS_BY_EVENT[event];
    for (const key of Object.keys(cfg)) {
      if (['branches', 'branches-ignore', 'tags', 'tags-ignore', 'paths', 'paths-ignore'].includes(key) && !(allowed ?? []).includes(key)) warnings.push(`on.${event}.${key}: this filter is not documented for ${event}; not verified what GitHub does with it.`);
    }
  }
  return warnings;
}

/** Compile one GitHub filter pattern into an anchored RegExp. */
export function compilePattern(pattern: string): RegExp {
  let re = '';
  let i = 0;
  const src = pattern.startsWith('!') ? pattern.slice(1) : pattern;
  while (i < src.length) {
    const c = src[i]!;
    const next = src[i + 1];
    if (c === '\\' && next !== undefined) {
      re += escapeRe(next);
      i += 2;
      continue;
    }
    if (c === '*') {
      if (next === '*') {
        if (src[i + 2] === '/') {
          // "**/" means any number of directories including none: '**/README.md' matches 'README.md'
          re += '(?:.*/)?';
          i += 3;
          continue;
        }
        re += '.*';
        i += 2;
        continue;
      }
      re += '[^/]*';
      i += 1;
      continue;
    }
    if (c === '?') {
      // zero or one of the preceding character: the preceding atom is already emitted; make it optional
      re = makePrecedingOptional(re);
      i += 1;
      continue;
    }
    if (c === '+') {
      re += '+';
      i += 1;
      continue;
    }
    if (c === '[') {
      const end = src.indexOf(']', i + 1);
      if (end > i) {
        let cls = src.slice(i + 1, end);
        if (cls.startsWith('!')) cls = '^' + cls.slice(1);
        re += `[${cls.replace(/\\/g, '\\\\')}]`;
        i = end + 1;
        continue;
      }
    }
    re += escapeRe(c);
    i += 1;
  }
  return new RegExp(`^(?:${re})$`);
}

function makePrecedingOptional(re: string): string {
  // Find the last atom: either an escaped char (\\x), a class ([...]), or a single char / group.
  if (re.endsWith(']')) {
    const start = re.lastIndexOf('[');
    return re.slice(0, start) + `(?:${re.slice(start)})?`;
  }
  if (re.endsWith('.*') || re.endsWith('[^/]*')) return re; // wildcard followed by ?: already optional
  const m = /(\\.|[^\\])$/.exec(re);
  if (!m) return re;
  const atom = m[0];
  return re.slice(0, re.length - atom.length) + `(?:${atom})?`;
}

function escapeRe(c: string): string {
  return /[.*+?^${}()|[\]\\/]/.test(c) ? '\\' + c : c;
}

/**
 * Applies an ordered list of patterns (with `!` negations) to one name, GitHub-style.
 * Returns whether the name is included after all patterns are applied, plus the trace.
 */
export function matchPatterns(patterns: string[], name: string): { matched: boolean; trace: string[] } {
  let matched = false;
  const trace: string[] = [];
  const hasPositive = patterns.some((p) => !p.startsWith('!'));
  if (!hasPositive && patterns.length) {
    // Docs: a list with only negative patterns still needs a positive one; GitHub treats it as matching nothing.
    trace.push('only negative patterns: nothing can match (the docs require at least one pattern without !; verified: GitHub creates no run at all)');
  }
  for (const p of patterns) {
    const negative = p.startsWith('!');
    const hit = compilePattern(p).test(name);
    if (negative && hit) { matched = false; trace.push(`${p} excludes "${name}"`); }
    else if (!negative && hit) { matched = true; trace.push(`${p} matches "${name}"`); }
    else trace.push(`${p} does not match "${name}"`);
  }
  return { matched, trace };
}

/** Path filters: the workflow runs if at least one changed file is still included after all patterns. */
export function matchPaths(patterns: string[], files: string[], ignore: boolean): { matched: boolean; trace: string[] } {
  const trace: string[] = [];
  if (!files.length) {
    trace.push(ignore ? 'no changed files known: paths-ignore cannot exclude the run' : 'no changed files known: paths filter cannot match (GitHub also skips the run when no file matches)');
    return { matched: ignore, trace };
  }
  let any = false;
  if (!ignore && patterns.length && patterns.every((p) => p.startsWith('!'))) trace.push('only negative patterns: nothing can match (verified: GitHub creates no run at all for this workflow)');
  for (const f of files) {
    const r = matchPatterns(patterns, f);
    const included = ignore ? !r.matched : r.matched;
    if (included) { any = true; trace.push(ignore ? `"${f}" is not ignored → runs` : `"${f}" matches → runs`); }
    else trace.push(ignore ? `"${f}" is ignored` : `"${f}" matches no paths pattern`);
  }
  return { matched: any, trace };
}

/** Decide whether the workflow's `on:` block accepts this event. */
export function decideTrigger(workflow: ParsedWorkflow, input: TriggerInput): FilterDecision {
  const cfg = (workflow.events as Record<string, unknown>)[input.event] as Record<string, unknown> | undefined | null;
  if (cfg === undefined) {
    return { matched: false, reasons: [`The workflow does not listen to ${input.event} (on: ${Object.keys(workflow.events).join(', ') || 'nothing'}).`] };
  }
  const reasons: string[] = [`on: ${input.event} is present.`];
  const c = cfg ?? {};

  // Activity types
  const types = asStrings(c['types']);
  const defaults = DEFAULT_TYPES[input.event];
  if (input.action && (types.length || defaults)) {
    const allowed = types.length ? types : defaults ?? [];
    if (!allowed.includes(input.action)) {
      reasons.push(`activity type "${input.action}" is not in ${types.length ? 'types: [' + allowed.join(', ') + ']' : 'the default types (' + allowed.join(', ') + '); other types need an explicit types: list'}.`);
      return { matched: false, reasons };
    }
    reasons.push(`activity type "${input.action}" is ${types.length ? 'listed in types' : 'one of the default types'}.`);
  } else if (input.action) {
    reasons.push(`activity type "${input.action}": types is omitted, and for ${input.event} every activity type triggers the workflow by default.`);
  }

  // Branch / tag filters
  const branches = asStrings(c['branches']);
  const branchesIgnore = asStrings(c['branches-ignore']);
  const tags = asStrings(c['tags']);
  const tagsIgnore = asStrings(c['tags-ignore']);
  const refName = input.event === 'pull_request' || input.event === 'pull_request_target' ? input.baseBranch : input.refName;
  const refType = input.event === 'pull_request' || input.event === 'pull_request_target' ? 'branch' : input.refType ?? 'branch';

  if (input.event === 'push') {
    const hasBranchFilter = branches.length || branchesIgnore.length;
    const hasTagFilter = tags.length || tagsIgnore.length;
    if (refType === 'tag') {
      if (hasBranchFilter && !hasTagFilter) { reasons.push('only branch filters are set, so tag pushes never run this workflow.'); return { matched: false, reasons }; }
      if (tags.length) { const r = matchPatterns(tags, refName ?? ''); reasons.push(...r.trace.map((t) => `tags: ${t}`)); if (!r.matched) return { matched: false, reasons }; }
      if (tagsIgnore.length) { const r = matchPatterns(tagsIgnore, refName ?? ''); reasons.push(...r.trace.map((t) => `tags-ignore: ${t}`)); if (r.matched) { reasons.push('tag is ignored.'); return { matched: false, reasons }; } }
    } else {
      if (hasTagFilter && !hasBranchFilter) { reasons.push('only tag filters are set, so branch pushes never run this workflow.'); return { matched: false, reasons }; }
      if (branches.length) { const r = matchPatterns(branches, refName ?? ''); reasons.push(...r.trace.map((t) => `branches: ${t}`)); if (!r.matched) return { matched: false, reasons }; }
      if (branchesIgnore.length) { const r = matchPatterns(branchesIgnore, refName ?? ''); reasons.push(...r.trace.map((t) => `branches-ignore: ${t}`)); if (r.matched) { reasons.push('branch is ignored.'); return { matched: false, reasons }; } }
    }
  } else if (refName && (branches.length || branchesIgnore.length)) {
    if (branches.length) { const r = matchPatterns(branches, refName); reasons.push(...r.trace.map((t) => `branches: ${t}`)); if (!r.matched) return { matched: false, reasons }; }
    if (branchesIgnore.length) { const r = matchPatterns(branchesIgnore, refName); reasons.push(...r.trace.map((t) => `branches-ignore: ${t}`)); if (r.matched) return { matched: false, reasons }; }
  }

  // Path filters (push and pull_request family only)
  const paths = asStrings(c['paths']);
  const pathsIgnore = asStrings(c['paths-ignore']);
  if (paths.length || pathsIgnore.length) {
    if (refType === 'tag' && input.event === 'push') {
      reasons.push('paths filters are not evaluated for tag pushes.');
    } else {
      const files = input.changedFiles ?? [];
      if (paths.length) { const r = matchPaths(paths, files, false); reasons.push(...r.trace.map((t) => `paths: ${t}`)); if (!r.matched) return { matched: false, reasons }; }
      if (pathsIgnore.length) { const r = matchPaths(pathsIgnore, files, true); reasons.push(...r.trace.map((t) => `paths-ignore: ${t}`)); if (!r.matched) return { matched: false, reasons }; }
    }
  }
  return { matched: true, reasons };
}

function asStrings(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(String);
  if (typeof v === 'string') return [v];
  return [];
}
