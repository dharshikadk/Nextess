import { strict as assert } from 'node:assert';
import test from 'node:test';
import { CONTEXTUAL_EVENT_PRIORITY, getContextualSessionKey, sortContextualEvents } from './contextualEvents.js';

test('mission completion has priority over leaderboard nudges', () => {
  assert.ok(CONTEXTUAL_EVENT_PRIORITY.MISSION_COMPLETED > CONTEXTUAL_EVENT_PRIORITY.LEADERBOARD_NUDGE);
});

test('queue sorting is deterministic and priority-first', () => {
  const sorted = sortContextualEvents([
    { type:'LEADERBOARD_NUDGE', priority:40, dedupeKey:'leader' },
    { type:'MISSION_COMPLETED', priority:100, dedupeKey:'mission' },
  ]);
  assert.deepEqual(sorted.map((event) => event.dedupeKey), ['mission','leader']);
});

test('leaderboard suppression is scoped to the authenticated user and browser session', () => {
  assert.equal(
    getContextualSessionKey('LEADERBOARD_NUDGE', 'user-1'),
    'nextess:contextual-nudge:leaderboard_nudge:user-1:shown',
  );
});
