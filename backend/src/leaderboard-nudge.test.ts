import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateLeaderboardNudge } from './leaderboard-nudge.js';

test('returns insufficient data for a single leaderboard user', () => {
  const result = calculateLeaderboardNudge([{ id: 'u1', xp: 1000, coins: 100 }], 'u1');
  assert.equal(result.shouldShow, false);
  assert.equal(result.reason, 'INSUFFICIENT_LEADERBOARD_DATA');
});

test('returns already top for the first ranked user', () => {
  const result = calculateLeaderboardNudge([
    { id: 'u1', xp: 2000, coins: 100 },
    { id: 'u2', xp: 1800, coins: 150 },
  ], 'u1');
  assert.equal(result.reason, 'ALREADY_TOP');
});

test('uses authoritative top-user differences and clamps negative coin differences', () => {
  const result = calculateLeaderboardNudge([
    { id: 'u1', xp: 4500, coins: 250 },
    { id: 'u2', xp: 4380, coins: 285 },
  ], 'u2', 500);
  assert.equal(result.shouldShow, true);
  assert.deepEqual(result.difference, { xp: 120, coins: 0 });
  assert.equal(result.currentUser?.rank, 2);
});

test('suppresses users outside the configured XP threshold', () => {
  const result = calculateLeaderboardNudge([
    { id: 'u1', xp: 5000, coins: 200 },
    { id: 'u2', xp: 4300, coins: 180 },
  ], 'u2', 500);
  assert.equal(result.shouldShow, false);
  assert.equal(result.reason, 'NOT_CLOSE_ENOUGH');
  assert.deepEqual(result.difference, { xp: 700, coins: 20 });
});

test('allows the threshold boundary', () => {
  const result = calculateLeaderboardNudge([
    { id: 'u1', xp: 5000, coins: 200 },
    { id: 'u2', xp: 4500, coins: 180 },
  ], 'u2', 500);
  assert.equal(result.shouldShow, true);
});
