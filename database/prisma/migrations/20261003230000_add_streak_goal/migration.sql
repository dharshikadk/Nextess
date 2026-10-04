-- Nextess engagement and streak-goal persistence
ALTER TABLE "User" ADD COLUMN "firstLoginCompletedAt" TIMESTAMP(3), ADD COLUMN "streakGoalDays" INTEGER, ADD COLUMN "streakGoalRewardedAt" TIMESTAMP(3);
