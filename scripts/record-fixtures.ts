/**
 * Records ground truth from the private fixtures repository (barbarkaragul-oss/wdmjr-fixtures):
 * for every completed workflow run, the event, the real `github` context (dumped by the run
 * itself), and each job's conclusion. The simulator's tests replay these and must agree.
 *
 *   npx tsx scripts/record-fixtures.ts            # writes tests/fixtures/runs/*.json
 *
 * Needs a GitHub token with access to the fixtures repo: GITHUB_TOKEN env, or the token stored in
 * Git Credential Manager for github.com (read via `git credential fill`, never printed).
 */
import { execSync } from 'node:child_process';
import { mkdirSync, writeFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

const REPO = process.env['FIXTURES_REPO'] ?? 'barbarkaragul-oss/wdmjr-fixtures';
const OUT = path.resolve('tests/fixtures/runs');

function token(): string {
  if (process.env['GITHUB_TOKEN']) return process.env['GITHUB_TOKEN'];
  const out = execSync('git credential fill', { input: 'protocol=https\nhost=github.com\n\n', encoding: 'utf8' });
  const m = /^password=(.+)$/m.exec(out);
  if (!m) throw new Error('no GitHub token available');
  return m[1]!.trim();
}

const TOKEN = token();
async function gh<T>(url: string): Promise<T> {
  const res = await fetch(url.startsWith('http') ? url : `https://api.github.com${url}`, {
    headers: { authorization: `Bearer ${TOKEN}`, accept: 'application/vnd.github+json', 'x-github-api-version': '2022-11-28' },
  });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return (await res.json()) as T;
}
async function ghText(url: string): Promise<string> {
  const res = await fetch(`https://api.github.com${url}`, { headers: { authorization: `Bearer ${TOKEN}`, accept: 'application/vnd.github+json' }, redirect: 'follow' });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.text();
}

interface Run { id: number; name: string; path: string; event: string; head_branch: string | null; head_sha: string; status: string; conclusion: string | null; run_attempt: number; created_at: string; display_title: string }
interface Job { id: number; name: string; conclusion: string | null; status: string; steps?: Array<{ name: string; conclusion: string | null; number: number }> }

function extract(log: string, marker: string): unknown {
  // The script echo appears earlier in the log (inside the ##[group]Run block); the real output is the last occurrence.
  const start = log.lastIndexOf(`::${marker}_START::`);
  const end = log.lastIndexOf(`::${marker}_END::`);
  if (start < 0 || end < 0 || end < start) return undefined;
  const body = log.slice(start, end).split('\n').slice(1).map((l) => l.replace(/^\S+Z\s/, '').trim()).filter(Boolean).join('');
  try {
    return JSON.parse(Buffer.from(body, 'base64').toString('utf8'));
  } catch {
    return undefined;
  }
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const existing = new Set(readdirSync(OUT));
  const runs: Run[] = [];
  for (let page = 1; page <= 5; page++) {
    const r = await gh<{ workflow_runs: Run[] }>(`/repos/${REPO}/actions/runs?per_page=100&page=${page}`);
    runs.push(...r.workflow_runs);
    if (r.workflow_runs.length < 100) break;
  }
  console.log(`${runs.length} runs`);
  let written = 0;
  for (const run of runs) {
    if (run.status !== 'completed') { console.log(`skip ${run.id} (${run.status})`); continue; }
    const wfName = path.basename(run.path, '.yml');
    const file = `${wfName}--${run.event}--${(run.head_branch ?? 'none').replace(/[^\w.-]+/g, '_')}--${run.id}.json`;
    if (existing.has(file)) continue;
    const jobsRes = await gh<{ jobs: Job[] }>(`/repos/${REPO}/actions/runs/${run.id}/jobs?per_page=100`);
    const jobs = jobsRes.jobs.map((j) => ({ name: j.name, conclusion: j.conclusion, steps: (j.steps ?? []).map((s) => ({ name: s.name, conclusion: s.conclusion })) }));
    const ctxJob = jobsRes.jobs.find((j) => j.name === 'context' || j.name === 'ran');
    let github: unknown;
    let inputs: unknown;
    if (ctxJob && ctxJob.conclusion === 'success') {
      try {
        const log = await ghText(`/repos/${REPO}/actions/jobs/${ctxJob.id}/logs`);
        github = extract(log, 'WDMJR_GITHUB');
        inputs = extract(log, 'WDMJR_INPUTS');
        // The job-scoped token is dead once the job ends, but it has no place in a fixture.
        if (github && typeof github === 'object') delete (github as Record<string, unknown>)['token'];
      } catch (e) {
        console.log(`  log fetch failed for ${run.id}: ${(e as Error).message}`);
      }
    }
    // The payload GitHub hands to Actions omits the per-commit file lists, so record the changed files
    // through the API: the pushed commit's files, or the pull request's files.
    let changed_files: string[] | undefined;
    try {
      if (run.event === 'push') {
        const c = await gh<{ files?: Array<{ filename: string }> }>(`/repos/${REPO}/commits/${run.head_sha}`);
        changed_files = (c.files ?? []).map((f) => f.filename);
      } else if (run.event === 'pull_request' && github && typeof github === 'object') {
        const number = ((github as Record<string, unknown>)['event'] as Record<string, unknown> | undefined)?.['number'];
        if (number) {
          const files = await gh<Array<{ filename: string }>>(`/repos/${REPO}/pulls/${number}/files?per_page=100`);
          changed_files = files.map((f) => f.filename);
        }
      }
    } catch (e) {
      console.log(`  changed files lookup failed for ${run.id}: ${(e as Error).message}`);
    }
    const fixture = {
      recorded_at: new Date().toISOString(),
      repo: REPO,
      run_id: run.id,
      workflow: wfName,
      workflow_path: run.path,
      event: run.event,
      head_branch: run.head_branch,
      head_sha: run.head_sha,
      conclusion: run.conclusion,
      display_title: run.display_title,
      changed_files,
      github,
      inputs,
      jobs,
    };
    writeFileSync(path.join(OUT, file), JSON.stringify(fixture, null, 2) + '\n');
    written++;
    console.log(`wrote ${file} (${jobs.length} jobs${github ? ', github context captured' : ''})`);
  }
  console.log(`done: ${written} new fixtures`);
}
main().catch((e) => { console.error(e); process.exit(1); });
