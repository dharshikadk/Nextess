import { strict as assert } from 'node:assert';
import test from 'node:test';

const key = (type: string, userId: string) => `nextess:contextual-nudge:${type.toLowerCase()}:${userId}:shown`;

test('leaderboard nudge uses a session-scoped per-user suppression key', () => {
  assert.match(key('LEADERBOARD_NUDGE', 'user-1'), /nextess:contextual-nudge:leaderboard_nudge:user-1:shown/);
});
