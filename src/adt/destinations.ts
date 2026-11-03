import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';

export interface AdtDestination {
  id: string;
  protocol: string;
  properties: Record<string, string>;
}

/**
 * ADT keeps no public API for destinations, but its language server persists them
 * in ~/.adtls/destinations.json. We only read non-secret connection properties.
 */
export async function readAdtDestinations(customFile?: string): Promise<AdtDestination[]> {
  const file = customFile?.trim() || path.join(os.homedir(), '.adtls', 'destinations.json');
  let raw: string;
  try {
    raw = await fs.readFile(file, 'utf8');
  } catch {
    throw new Error(`ADT destinations file not found: ${file}. Create a destination in ADT first.`);
  }
  const parsed = JSON.parse(raw) as { destinations?: AdtDestination[] };
  return (parsed.destinations ?? []).filter((d) => typeof d?.id === 'string');
}

export function describeDestination(d: AdtDestination): string {
  const p = d.properties ?? {};
  return [p.systemId, p.client && `client ${p.client}`, p.user].filter(Boolean).join(' · ');
}
