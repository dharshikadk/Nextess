import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateLeaderboardNudge } from './leaderboardNudge.js';

test('does not nudge with one user', () => {
  assert.equal(calculateLeaderboardNudge([{ id: 'a', xp: 100, coins: 50 }], 'a', 500).reason, 'INSUFFICIENT_LEADERBOARD_DATA');
});

test('does not nudge the current leader', () => {
  assert.equal(calculateLeaderboardNudge([{ id: 'a', xp: 500, coins: 10 }, { id: 'b', xp: 100, coins: 5 }], 'a', 500).reason, 'ALREADY_TOP');
});

test('calculates non-negative XP and coin differences', () => {
  const result = calculateLeaderboardNudge([
    { id: 'a', xp: 4500, coins: 250 },
    { id: 'b', xp: 4380, coins: 215 },
  ], 'b', 500);
  assert.equal(result.shouldShow, true);
  assert.deepEqual(result.difference, { xp: 120, coins: 35 });
});

test('does not nudge when XP gap exceeds threshold', () => {
  const result = calculateLeaderboardNudge([
    { id: 'a', xp: 5000, coins: 100 },
    { id: 'b', xp: 4000, coins: 300 },
  ], 'b', 500);
  assert.equal(result.reason, 'NOT_CLOSE_ENOUGH');
});
