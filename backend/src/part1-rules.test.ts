import test from 'node:test';
import assert from 'node:assert/strict';
import { getStreakFreezeCost, shouldChargeReveal } from './part1-rules.js';

test('streak freeze costs are server-defined at 60 and 120 coins', () => {
  assert.equal(getStreakFreezeCost(1), 60);
  assert.equal(getStreakFreezeCost(2), 120);
});

test('unsupported streak freeze durations have no price', () => {
  assert.equal(getStreakFreezeCost(0), null);
  assert.equal(getStreakFreezeCost(3), null);
});

test('reveal does not charge after an answer was already submitted', () => {
  assert.equal(shouldChargeReveal(true, true, false), false);
  assert.equal(shouldChargeReveal(true, false, false), true);
  assert.equal(shouldChargeReveal(true, false, true), false);
  assert.equal(shouldChargeReveal(false, false, false), false);
});
