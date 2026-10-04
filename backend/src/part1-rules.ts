export const STREAK_FREEZE_COSTS = { 1: 60, 2: 120 } as const;

export function getStreakFreezeCost(days: number): number | null {
  return days === 1 || days === 2 ? STREAK_FREEZE_COSTS[days] : null;
}
