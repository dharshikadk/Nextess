export const DEFAULT_LEADERBOARD_NUDGE_XP_THRESHOLD = 500;

export type LeaderboardNudgeReason =
  | 'CLOSE_TO_TOP'
  | 'NOT_CLOSE_ENOUGH'
  | 'ALREADY_TOP'
  | 'INSUFFICIENT_LEADERBOARD_DATA';

export interface LeaderboardSnapshot {
  id: string;
  xp: number;
  coins: number;
}

export interface LeaderboardNudgeResult {
  shouldShow: boolean;
  reason: LeaderboardNudgeReason;
  currentUser?: { rank: number; xp: number; coins: number };
  topUser?: { rank: 1; xp: number; coins: number };
  difference?: { xp: number; coins: number };
  threshold: { xp: number };
  message?: { title: string; body: string };
}

export function getLeaderboardNudgeThreshold(): number {
  const configured = Number(process.env.LEADERBOARD_NUDGE_XP_THRESHOLD);
  return Number.isFinite(configured) && configured >= 0
    ? Math.trunc(configured)
    : DEFAULT_LEADERBOARD_NUDGE_XP_THRESHOLD;
}

export function calculateLeaderboardNudge(
  orderedUsers: LeaderboardSnapshot[],
  currentUserId: string,
  threshold = getLeaderboardNudgeThreshold(),
): LeaderboardNudgeResult {
  const safeThreshold = Math.max(0, Math.trunc(threshold));
  if (orderedUsers.length < 2) {
    return {
      shouldShow: false,
      reason: 'INSUFFICIENT_LEADERBOARD_DATA',
      threshold: { xp: safeThreshold },
    };
  }

  const currentIndex = orderedUsers.findIndex((user) => user.id === currentUserId);
  if (currentIndex < 0) {
    return {
      shouldShow: false,
      reason: 'NOT_CLOSE_ENOUGH',
      threshold: { xp: safeThreshold },
    };
  }

  const current = orderedUsers[currentIndex];
  const top = orderedUsers[0];

  if (currentIndex === 0) {
    return {
      shouldShow: false,
      reason: 'ALREADY_TOP',
      threshold: { xp: safeThreshold },
    };
  }

  const xpDifference = Math.max(0, top.xp - current.xp);
  const coinDifference = Math.max(0, top.coins - current.coins);

  if (xpDifference > safeThreshold) {
    return {
      shouldShow: false,
      reason: 'NOT_CLOSE_ENOUGH',
      currentUser: { rank: currentIndex + 1, xp: current.xp, coins: current.coins },
      topUser: { rank: 1, xp: top.xp, coins: top.coins },
      difference: { xp: xpDifference, coins: coinDifference },
      threshold: { xp: safeThreshold },
    };
  }

  return {
    shouldShow: true,
    reason: 'CLOSE_TO_TOP',
    currentUser: { rank: currentIndex + 1, xp: current.xp, coins: current.coins },
    topUser: { rank: 1, xp: top.xp, coins: top.coins },
    difference: { xp: xpDifference, coins: coinDifference },
    threshold: { xp: safeThreshold },
    message: {
      title: "You're close to the top!",
      body: `You need only ${xpDifference} XP and ${coinDifference} coins to reach the current top leaderboard position.`,
    },
  };
}
