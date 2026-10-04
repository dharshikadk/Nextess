export type ContextualEventType =
  | 'LEADERBOARD_NUDGE'
  | 'LEVEL_UP'
  | 'MISSION_COMPLETED'
  | 'STREAK_AT_RISK'
  | 'STREAK_FREEZE_AVAILABLE'
  | 'ACHIEVEMENT_UNLOCKED'
  | 'REWARD_AVAILABLE'
  | 'PROFILE_COMPLETION';

export interface ContextualEvent {
  type: ContextualEventType;
  priority: number;
  dedupeKey: string;
  payload?: Record<string, unknown>;
}

export const CONTEXTUAL_EVENT_PRIORITY: Record<ContextualEventType, number> = {
  MISSION_COMPLETED: 100,
  LEVEL_UP: 80,
  REWARD_AVAILABLE: 70,
  ACHIEVEMENT_UNLOCKED: 70,
  STREAK_AT_RISK: 60,
  STREAK_FREEZE_AVAILABLE: 50,
  LEADERBOARD_NUDGE: 40,
  PROFILE_COMPLETION: 20,
};

export const getContextualSessionKey = (type: ContextualEventType, userId: string) =>
  `nextess:contextual-nudge:${type.toLowerCase()}:${userId}:shown`;

export const sortContextualEvents = (events: ContextualEvent[]) =>
  [...events].sort((a, b) => b.priority - a.priority);
