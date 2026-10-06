import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { assertValidMissionPackage } from "./mission-validator.js";

const files = [
  ["physics-escape-ramp-brake-failure.json","escape_ramp_simulation.html"],
  ["physics-crane-cable-overstretch.json","crane_cable_simulation.html"],
  ["economics-metro-fare-dilemma.json","metro_fare_simulation.html"],
  ["economics-two-inflations-price-index.json","price_index_simulation.html"]
] as const;

test("all four Class 11 mission files validate and point to served simulations", () => {
  const keys = new Set<string>();
  for (const [fileName, simulationFile] of files) {
    const filePath = path.resolve(process.cwd(), "content/class11", fileName);
    const pkg = JSON.parse(fs.readFileSync(filePath, "utf8"));
    assert.doesNotThrow(() => assertValidMissionPackage(pkg));
    assert.equal(pkg.projects.length, 1);
    const mission = pkg.projects[0];
    assert.equal(mission.requiredEvidence.files.length, 3);
    assert.equal(mission.requiredSimulation.fileName, simulationFile);
    assert.equal(keys.has(mission.key), false);
    keys.add(mission.key);

    const frontendSimulation = path.resolve(process.cwd(), "../frontend-v2/public/simulations", simulationFile);
    const repositorySimulation = path.resolve(process.cwd(), "../simulations", simulationFile);
    assert.ok(fs.existsSync(frontendSimulation), `Missing frontend simulation: ${simulationFile}`);
    assert.ok(fs.existsSync(repositorySimulation), `Missing repository simulation: ${simulationFile}`);
  }
  assert.equal(keys.size, 4);
});
