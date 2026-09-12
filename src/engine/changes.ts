/**
 * Changed files for `paths` filters. For a push, GitHub looks at the files touched by the commits
 * in the push (the payload lists added/removed/modified per commit); for a pull request it diffs
 * the head against the base. The simulator takes the list from the payload when it has one and
 * otherwise from what the user typed.
 */
export function changedFilesFromPayload(event: Record<string, unknown> | undefined): string[] {
  if (!event) return [];
  const files = new Set<string>();
  const commits = Array.isArray(event['commits']) ? (event['commits'] as Array<Record<string, unknown>>) : [];
  const head = event['head_commit'] as Record<string, unknown> | undefined;
  for (const c of commits.length ? commits : head ? [head] : []) {
    for (const key of ['added', 'modified', 'removed']) {
      const list = c[key];
      if (Array.isArray(list)) for (const f of list) files.add(String(f));
    }
  }
  return [...files];
}
