export function utcDay(value: Date | string | number): Date {
  const date = new Date(value);
  date.setUTCHours(0, 0, 0, 0);
  return date;
}

export function calculateStreak(activityDates: Array<Date | string | number>, now = new Date()) {
  const uniqueDays = [...new Set(activityDates.map(value => utcDay(value).getTime()))].sort((a,b)=>b-a);
  const today = utcDay(now).getTime();
  const latest = uniqueDays[0];
  if (latest === undefined) {
    return { streakDays: 0, latestDiffDays: null, missedDays: 0, atRisk: false, streakLost: false };
  }

  const latestDiffDays = Math.max(0, Math.round((today - latest) / 86400000));
  const anchor = latestDiffDays <= 1 ? latest : null;
  if (anchor === null) {
    return { streakDays: 0, latestDiffDays, missedDays: latestDiffDays, atRisk: false, streakLost: true };
  }

  let streakDays = 0;
  let expected = anchor;
  for (const timestamp of uniqueDays) {
    if (timestamp !== expected) break;
    streakDays += 1;
    expected -= 86400000;
  }

  return {
    streakDays,
    latestDiffDays,
    missedDays: latestDiffDays,
    atRisk: latestDiffDays === 1,
    streakLost: false
  };
}
