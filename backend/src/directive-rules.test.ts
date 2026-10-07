import test from "node:test";
import assert from "node:assert/strict";
import { dayRange, directiveCondition } from "./directive-rules.js";

test("known daily directives have deterministic learning conditions", () => {
  assert.equal(directiveCondition("00000000-0000-0000-0000-000000000001"), "INVESTIGATION_COMPLETED");
  assert.equal(directiveCondition("00000000-0000-0000-0000-000000000002"), "LEVEL_REVIEWED");
  assert.equal(directiveCondition("00000000-0000-0000-0000-000000000003"), "SIMULATION_CHANGED");
  assert.equal(directiveCondition("unknown"), null);
});

test("daily condition ranges are one product day wide", () => {
  const start = new Date("2026-10-08T00:00:00.000Z");
  const range = dayRange(start);
  assert.equal(range.gte.toISOString(), "2026-10-08T00:00:00.000Z");
  assert.equal(range.lt.toISOString(), "2026-10-09T00:00:00.000Z");
});
