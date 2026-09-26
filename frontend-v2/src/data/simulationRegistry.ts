export const simulationRegistry={
 'physics-bike-braking':'/mission-phy-01-bicycle-braking.html',
 'physics-solar-panel-angle':'/mission-phy-02-solar-panel-angle.html',
 'economics-canteen-revenue':'/mission-eco-01-canteen-revenue.html',
 'economics-bus-fare-demand':'/mission-eco-02-bus-fare-demand.html'
} as const;
export type SimulationMissionKey=keyof typeof simulationRegistry;
