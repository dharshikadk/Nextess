const SAFE_SIMULATION_FILE = /^[A-Za-z0-9][A-Za-z0-9._-]*\.html$/i;

export function resolveSimulationSource(fileName?: string): string | null {
  const normalized = String(fileName || '').trim().replace(/^\/+/, '');
  if (!normalized || !SAFE_SIMULATION_FILE.test(normalized)) return null;
  return `/${encodeURIComponent(normalized)}`;
}
