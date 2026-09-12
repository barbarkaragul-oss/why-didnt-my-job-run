/** Share links: the workflow and the scenario, compressed into the URL fragment. Nothing is sent anywhere. */
import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';
import type { ScenarioState } from './scenario.js';

export interface SharedState {
  v: 1;
  yaml: string;
  scenario: Partial<ScenarioState>;
}

export function encodeShare(yaml: string, scenario: ScenarioState): string {
  const s: SharedState = { v: 1, yaml, scenario };
  return '#s=' + compressToEncodedURIComponent(JSON.stringify(s));
}

export function decodeShare(hash: string): SharedState | null {
  const m = /^#s=(.+)$/.exec(hash);
  if (!m) return null;
  try {
    const json = decompressFromEncodedURIComponent(m[1]!);
    if (!json) return null;
    const s = JSON.parse(json) as SharedState;
    if (s.v !== 1 || typeof s.yaml !== 'string') return null;
    return s;
  } catch {
    return null;
  }
}
