const SAFE_SIMULATION_FILE = /^[A-Za-z0-9][A-Za-z0-9._-]*\.html$/i;

const LEGACY_SIMULATION_ASSETS: Record<string, string> = {
  "bicycle_braking_simulation.html": "mission-phy-01-bicycle-braking.html",
  "solar_panel_angle_simulation.html": "mission-phy-02-solar-panel-angle.html",
  "canteen_revenue_graph.html": "mission-eco-01-canteen-revenue.html",
  "bus_fare_demand_dashboard.html": "mission-eco-02-bus-fare-demand.html",
};

type SimulationAssetLike = { storageKey?: string | null; status?: string | null; assetType?: string | null };

export function resolveSimulationSource(fileName?: string, assets: SimulationAssetLike[] = []): string | null {
  const readyAsset = assets.find((asset) => asset.status !== 'UNAVAILABLE' && asset.storageKey);
  const candidate = String(readyAsset?.storageKey || fileName || '').trim().replace(/^\/+/, '');
  if (!candidate) return null;

  // Database-owned simulation assets are the canonical mapping. Only use a
  // filename under the public simulations directory; never interpret a
  // database value as an arbitrary URL.
  const basename = candidate.split('/').pop() || '';
  if (!SAFE_SIMULATION_FILE.test(basename)) return null;

  const assetName = readyAsset?.storageKey
    ? basename
    : LEGACY_SIMULATION_ASSETS[candidate] || candidate;
  return '/simulations/' + encodeURIComponent(assetName);
}
