const SIMULATION_SOURCES: Record<string,string> = {
  'mission-phy-01-bicycle-braking.html':'/mission-phy-01-bicycle-braking.html',
  'mission-phy-02-solar-panel-angle.html':'/mission-phy-02-solar-panel-angle.html',
  'mission-eco-01-canteen-revenue.html':'/mission-eco-01-canteen-revenue.html',
  'mission-eco-02-bus-fare-demand.html':'/mission-eco-02-bus-fare-demand.html',
};
export const simulationRegistry={
  'physics-bike-braking':SIMULATION_SOURCES['mission-phy-01-bicycle-braking.html'],
  'physics-solar-panel-angle':SIMULATION_SOURCES['mission-phy-02-solar-panel-angle.html'],
  'economics-canteen-revenue':SIMULATION_SOURCES['mission-eco-01-canteen-revenue.html'],
  'economics-bus-fare-demand':SIMULATION_SOURCES['mission-eco-02-bus-fare-demand.html'],
} as const;
export function resolveSimulationSource(fileName?:string,missionKey?:string):string|null{
  const normalized=String(fileName||'').trim().replace(/^\/+/,'');
  if(normalized&&SIMULATION_SOURCES[normalized])return SIMULATION_SOURCES[normalized];
  if(missionKey&&missionKey in simulationRegistry)return simulationRegistry[missionKey as keyof typeof simulationRegistry];
  return null;
}
export type SimulationMissionKey=keyof typeof simulationRegistry;