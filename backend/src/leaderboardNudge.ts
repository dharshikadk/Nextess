export type LeaderboardUser = { id: string; xp: number; coins: number };

export function calculateLeaderboardNudge(users: LeaderboardUser[], currentUserId: string, threshold: number) {
  const currentIndex = users.findIndex((user) => user.id === currentUserId);
  if (currentIndex < 0) return { shouldShow: false, reason: 'NOT_FOUND' as const };
  if (users.length < 2) return { shouldShow: false, reason: 'INSUFFICIENT_LEADERBOARD_DATA' as const };
  if (currentIndex === 0) return { shouldShow: false, reason: 'ALREADY_TOP' as const };

  const current = users[currentIndex];
  const top = users[0];
  const xpDifference = Math.max(0, top.xp - current.xp);
  const coinDifference = Math.max(0, top.coins - current.coins);
  const shouldShow = xpDifference <= Math.max(0, threshold);

  return {
    shouldShow,
    reason: shouldShow ? 'CLOSE_TO_TOP' as const : 'NOT_CLOSE_ENOUGH' as const,
    currentUser: { rank: currentIndex + 1, xp: current.xp, coins: current.coins },
    topUser: { rank: 1, xp: top.xp, coins: top.coins },
    difference: { xp: xpDifference, coins: coinDifference },
    threshold: { xp: Math.max(0, threshold) },
    ...(shouldShow ? {
      message: {
        title: "You're close to the top!",
        body: `You need only ${xpDifference} XP and ${coinDifference} coins to reach the current top leaderboard position.`,
      },
    } : {}),
  };
}
