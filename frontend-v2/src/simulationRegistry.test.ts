import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveSimulationSource } from './data/simulationRegistry.js';

test('simulation resolution prefers the mission requested filename', () => {
  const source = resolveSimulationSource('bus_fare_demand_dashboard.html', [
    { assetType: 'INTERACTIVE_SIMULATION', storageKey: 'simulations/wrong.html', status: 'PLACEHOLDER' },
    { assetType: 'INTERACTIVE_SIMULATION', storageKey: 'simulations/bus_fare_demand_dashboard.html', status: 'PLACEHOLDER' },
  ]);
  assert.equal(source, '/simulations/bus_fare_demand_dashboard.html');
});

test('simulation resolution falls back to the interactive simulation asset', () => {
  const source = resolveSimulationSource(undefined, [
    { assetType: 'CASE_FILE', storageKey: 'files/evidence.txt', status: 'PLACEHOLDER' },
    { assetType: 'INTERACTIVE_SIMULATION', storageKey: 'simulations/mission.html', status: 'PLACEHOLDER' },
  ]);
  assert.equal(source, '/simulations/mission.html');
});

test('unavailable simulation assets are not selected', () => {
  const source = resolveSimulationSource(undefined, [
    { assetType: 'INTERACTIVE_SIMULATION', storageKey: 'simulations/unavailable.html', status: 'UNAVAILABLE' },
  ]);
  assert.equal(source, null);
});
