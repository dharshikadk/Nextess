const SAFE_SIMULATION_FILE = /^[A-Za-z0-9][A-Za-z0-9._-]*\.html$/i;

const SIMULATION_ASSETS: Record<string, string> = {
  "bicycle_braking_simulation.html": "mission-phy-01-bicycle-braking.html",
  "solar_panel_angle_simulation.html": "mission-phy-02-solar-panel-angle.html",
  "canteen_revenue_graph.html": "mission-eco-01-canteen-revenue.html",
  "bus_fare_demand_dashboard.html": "mission-eco-02-bus-fare-demand.html",
};

export function resolveSimulationSource(fileName?: string): string | null {
  const normalized = String(fileName || '').trim().replace(/^\/+/, '');
  if (!normalized || !SAFE_SIMULATION_FILE.test(normalized)) return null;
  const assetName = SIMULATION_ASSETS[normalized] || normalized;
  return `/simulations/${encodeURIComponent(assetName)}`;
}
