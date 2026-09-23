-- Nextess initial PostgreSQL migration
-- Generated to match database/prisma/schema.prisma.
-- Content is versioned and immutable once published.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE "SubjectStatus" AS ENUM ('ACTIVE','FUTURE');
CREATE TYPE "ProjectStatus" AS ENUM ('DRAFT','PUBLISHED','RETIRED');
CREATE TYPE "VersionStatus" AS ENUM ('DRAFT','REVIEW','APPROVED','PUBLISHED','RETIRED');
CREATE TYPE "InvestigationStatus" AS ENUM ('IN_PROGRESS','COMPLETED','ABANDONED');
CREATE TYPE "ProgressStatus" AS ENUM ('NOT_STARTED','IN_PROGRESS','COMPLETED');
CREATE TYPE "RewardType" AS ENUM ('XP','COINS');
CREATE TYPE "BadgeKind" AS ENUM ('STREAK','PERFECT','MISSION','SUBJECT','CONTEST','MILESTONE');
CREATE TYPE "StreakState" AS ENUM ('QUALIFIED','RECOVERED');
CREATE TYPE "FeedbackStatus" AS ENUM ('OPEN','REVIEWED','RESOLVED');
CREATE TYPE "ActorType" AS ENUM ('USER','ANONYMOUS','SYSTEM','ADMIN');

CREATE TABLE "AnonymousSession" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "sessionHash" VARCHAR(128) NOT NULL UNIQUE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "User" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "username" VARCHAR(50) NOT NULL UNIQUE,
  "passwordHash" VARCHAR(255) NOT NULL,
  "gradeClass" VARCHAR(50),
  "level" INTEGER NOT NULL DEFAULT 1,
  "xp" INTEGER NOT NULL DEFAULT 0,
  "coins" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "lastActivityAt" TIMESTAMP(3)
);

CREATE TABLE "UserSetting" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL UNIQUE,
  "theme" VARCHAR(20) NOT NULL DEFAULT 'light',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "UserSetting_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE TABLE "Subject" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "key" VARCHAR(50) NOT NULL UNIQUE,
  "displayName" VARCHAR(100) NOT NULL,
  "status" "SubjectStatus" NOT NULL DEFAULT 'FUTURE',
  "ordering" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "Project" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "subjectId" UUID NOT NULL,
  "slug" VARCHAR(120) NOT NULL UNIQUE,
  "title" VARCHAR(200) NOT NULL,
  "mission" TEXT NOT NULL,
  "role" TEXT,
  "priority" VARCHAR(30),
  "problemType" VARCHAR(120),
  "estimatedLengthMinutes" INTEGER,
  "status" "ProjectStatus" NOT NULL DEFAULT 'DRAFT',
  "anonymousAccess" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "currentPublishedVersionId" UUID UNIQUE,
  CONSTRAINT "Project_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT
);

CREATE TABLE "ProjectVersion" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "projectId" UUID NOT NULL,
  "version" INTEGER NOT NULL,
  "status" "VersionStatus" NOT NULL DEFAULT 'DRAFT',
  "contentChecksum" VARCHAR(128) NOT NULL,
  "publishedAt" TIMESTAMP(3),
  "retiredAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProjectVersion_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE,
  CONSTRAINT "ProjectVersion_projectId_version_key" UNIQUE ("projectId","version")
);

ALTER TABLE "Project"
  ADD CONSTRAINT "Project_currentPublishedVersionId_fkey"
  FOREIGN KEY ("currentPublishedVersionId") REFERENCES "ProjectVersion"("id") ON DELETE SET NULL;

CREATE TABLE "SimulationDefinition" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "key" VARCHAR(120) NOT NULL,
  "version" INTEGER NOT NULL,
  "rendererKey" VARCHAR(120) NOT NULL,
  "purpose" TEXT NOT NULL,
  "configuration" JSONB NOT NULL,
  "frontendNotes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SimulationDefinition_key_version_key" UNIQUE ("key","version")
);

CREATE TABLE "Level" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "projectVersionId" UUID NOT NULL,
  "levelNumber" INTEGER NOT NULL,
  "title" VARCHAR(200) NOT NULL,
  "learningObjectives" JSONB,
  "completionRules" JSONB,
  "debrief" JSONB,
  "rewardXp" INTEGER NOT NULL DEFAULT 0,
  "rewardCoins" INTEGER NOT NULL DEFAULT 0,
  "simulationDefinitionId" UUID UNIQUE,
  CONSTRAINT "Level_projectVersionId_fkey" FOREIGN KEY ("projectVersionId") REFERENCES "ProjectVersion"("id") ON DELETE CASCADE,
  CONSTRAINT "Level_simulationDefinitionId_fkey" FOREIGN KEY ("simulationDefinitionId") REFERENCES "SimulationDefinition"("id") ON DELETE SET NULL,
  CONSTRAINT "Level_projectVersionId_levelNumber_key" UNIQUE ("projectVersionId","levelNumber")
);

CREATE TABLE "SimulationAsset" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "simulationId" UUID NOT NULL,
  "assetType" VARCHAR(40) NOT NULL,
  "storageKey" VARCHAR(500) NOT NULL,
  "status" VARCHAR(30) NOT NULL DEFAULT 'PLACEHOLDER',
  "mimeType" VARCHAR(120),
  "checksum" VARCHAR(128),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SimulationAsset_simulationId_fkey" FOREIGN KEY ("simulationId") REFERENCES "SimulationDefinition"("id") ON DELETE CASCADE,
  CONSTRAINT "SimulationAsset_simulationId_assetType_key" UNIQUE ("simulationId","assetType")
);

CREATE TABLE "SimulationVariable" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "simulationId" UUID NOT NULL,
  "variableKey" VARCHAR(100) NOT NULL,
  "label" VARCHAR(150) NOT NULL,
  "valueType" VARCHAR(30) NOT NULL,
  "minValue" NUMERIC(18,6),
  "maxValue" NUMERIC(18,6),
  "stepValue" NUMERIC(18,6),
  "defaultValue" JSONB NOT NULL,
  "unit" VARCHAR(50),
  "options" JSONB,
  CONSTRAINT "SimulationVariable_simulationId_fkey" FOREIGN KEY ("simulationId") REFERENCES "SimulationDefinition"("id") ON DELETE CASCADE,
  CONSTRAINT "SimulationVariable_simulationId_variableKey_key" UNIQUE ("simulationId","variableKey")
);

CREATE TABLE "SimulationConsequence" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "simulationId" UUID NOT NULL,
  "code" VARCHAR(60) NOT NULL,
  "label" VARCHAR(150) NOT NULL,
  "ruleDefinition" JSONB NOT NULL,
  "ordering" INTEGER NOT NULL,
  CONSTRAINT "SimulationConsequence_simulationId_fkey" FOREIGN KEY ("simulationId") REFERENCES "SimulationDefinition"("id") ON DELETE CASCADE,
  CONSTRAINT "SimulationConsequence_simulationId_code_key" UNIQUE ("simulationId","code")
);

CREATE TABLE "Question" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "levelId" UUID NOT NULL,
  "questionNumber" INTEGER NOT NULL,
  "questionType" VARCHAR(80) NOT NULL,
  "prompt" TEXT NOT NULL,
  "inputSchema" JSONB,
  "evaluationDefinition" JSONB NOT NULL,
  "consequenceDefinition" JSONB,
  "explanation" TEXT,
  "ordering" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Question_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "Level"("id") ON DELETE CASCADE,
  CONSTRAINT "Question_levelId_questionNumber_key" UNIQUE ("levelId","questionNumber")
);

CREATE TABLE "QuestionOption" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "questionId" UUID NOT NULL,
  "optionKey" VARCHAR(20) NOT NULL,
  "optionText" TEXT NOT NULL,
  "evaluationData" JSONB,
  CONSTRAINT "QuestionOption_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE,
  CONSTRAINT "QuestionOption_questionId_optionKey_key" UNIQUE ("questionId","optionKey")
);

CREATE TABLE "Hint" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "questionId" UUID NOT NULL,
  "level" INTEGER NOT NULL,
  "text" TEXT NOT NULL,
  "xpCost" INTEGER NOT NULL DEFAULT 0,
  "coinCost" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Hint_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE,
  CONSTRAINT "Hint_questionId_level_key" UNIQUE ("questionId","level")
);

CREATE TABLE "CaseFile" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "projectVersionId" UUID NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "mimeType" VARCHAR(120) NOT NULL,
  "content" TEXT,
  "storageKey" VARCHAR(500),
  "displayMode" VARCHAR(40) NOT NULL,
  "ordering" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CaseFile_projectVersionId_fkey" FOREIGN KEY ("projectVersionId") REFERENCES "ProjectVersion"("id") ON DELETE CASCADE
);

CREATE TABLE "EvaluationRule" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "questionId" UUID NOT NULL,
  "ruleKey" VARCHAR(100) NOT NULL,
  "evaluatorVersion" VARCHAR(40) NOT NULL,
  "definition" JSONB NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT "EvaluationRule_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE,
  CONSTRAINT "EvaluationRule_questionId_ruleKey_key" UNIQUE ("questionId","ruleKey")
);

CREATE TABLE "Investigation" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID,
  "anonymousSessionId" UUID,
  "projectId" UUID NOT NULL,
  "projectVersionId" UUID NOT NULL,
  "currentLevelId" UUID,
  "currentQuestionId" UUID,
  "status" "InvestigationStatus" NOT NULL DEFAULT 'IN_PROGRESS',
  "state" JSONB,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Investigation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
  CONSTRAINT "Investigation_anonymousSessionId_fkey" FOREIGN KEY ("anonymousSessionId") REFERENCES "AnonymousSession"("id") ON DELETE CASCADE,
  CONSTRAINT "Investigation_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT,
  CONSTRAINT "Investigation_projectVersionId_fkey" FOREIGN KEY ("projectVersionId") REFERENCES "ProjectVersion"("id") ON DELETE RESTRICT
);

CREATE TABLE "InvestigationAnswer" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "investigationId" UUID NOT NULL,
  "questionId" UUID NOT NULL,
  "userId" UUID,
  "attemptNumber" INTEGER NOT NULL,
  "answerPayload" JSONB NOT NULL,
  "normalizedAnswer" JSONB,
  "result" VARCHAR(40) NOT NULL,
  "evaluatorVersion" VARCHAR(40) NOT NULL,
  "consequenceCode" VARCHAR(60),
  "feedbackData" JSONB,
  "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "InvestigationAnswer_investigationId_fkey" FOREIGN KEY ("investigationId") REFERENCES "Investigation"("id") ON DELETE CASCADE,
  CONSTRAINT "InvestigationAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE RESTRICT,
  CONSTRAINT "InvestigationAnswer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL,
  CONSTRAINT "InvestigationAnswer_investigationId_questionId_attemptNumber_key" UNIQUE ("investigationId","questionId","attemptNumber")
);

CREATE TABLE "UserProjectProgress" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL,
  "projectId" UUID NOT NULL,
  "status" "ProgressStatus" NOT NULL DEFAULT 'NOT_STARTED',
  "currentLevelId" UUID,
  "currentQuestionId" UUID,
  "progressPercent" INTEGER NOT NULL DEFAULT 0,
  "lastActivityAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  CONSTRAINT "UserProjectProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
  CONSTRAINT "UserProjectProgress_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE,
  CONSTRAINT "UserProjectProgress_userId_projectId_key" UNIQUE ("userId","projectId")
);

CREATE TABLE "UserLevelProgress" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL,
  "levelId" UUID NOT NULL,
  "status" "ProgressStatus" NOT NULL DEFAULT 'NOT_STARTED',
  "currentQuestionId" UUID,
  "completedQuestions" INTEGER NOT NULL DEFAULT 0,
  "totalQuestions" INTEGER NOT NULL DEFAULT 0,
  "completedAt" TIMESTAMP(3),
  CONSTRAINT "UserLevelProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
  CONSTRAINT "UserLevelProgress_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "Level"("id") ON DELETE CASCADE,
  CONSTRAINT "UserLevelProgress_userId_levelId_key" UNIQUE ("userId","levelId")
);

CREATE TABLE "UserPerformance" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL,
  "skillKey" VARCHAR(100) NOT NULL,
  "scorePercent" NUMERIC(5,2) NOT NULL DEFAULT 0,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "correctCount" INTEGER NOT NULL DEFAULT 0,
  "mistakeTags" JSONB,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "UserPerformance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
  CONSTRAINT "UserPerformance_userId_skillKey_key" UNIQUE ("userId","skillKey")
);

CREATE TABLE "RewardLedger" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL,
  "investigationId" UUID,
  "sourceId" UUID NOT NULL,
  "rewardType" "RewardType" NOT NULL,
  "amount" INTEGER NOT NULL,
  "reasonCode" VARCHAR(100) NOT NULL,
  "idempotencyKey" VARCHAR(180) NOT NULL UNIQUE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RewardLedger_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
  CONSTRAINT "RewardLedger_investigationId_fkey" FOREIGN KEY ("investigationId") REFERENCES "Investigation"("id") ON DELETE SET NULL
);

CREATE TABLE "Badge" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "key" VARCHAR(100) NOT NULL UNIQUE,
  "name" VARCHAR(120) NOT NULL,
  "description" TEXT NOT NULL,
  "kind" "BadgeKind" NOT NULL,
  "criteria" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "UserBadge" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL,
  "badgeId" UUID NOT NULL,
  "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "metadata" JSONB,
  CONSTRAINT "UserBadge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
  CONSTRAINT "UserBadge_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "Badge"("id") ON DELETE CASCADE,
  CONSTRAINT "UserBadge_userId_badgeId_key" UNIQUE ("userId","badgeId")
);

CREATE TABLE "StreakActivity" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL,
  "activityDate" TIMESTAMP(3) NOT NULL,
  "state" "StreakState" NOT NULL DEFAULT 'QUALIFIED',
  "sourceId" UUID,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StreakActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
  CONSTRAINT "StreakActivity_userId_activityDate_key" UNIQUE ("userId","activityDate")
);

CREATE TABLE "UserNote" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL,
  "investigationId" UUID,
  "title" VARCHAR(200),
  "content" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "UserNote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE TABLE "ProjectCompletionReport" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL,
  "projectId" UUID NOT NULL,
  "investigationId" UUID NOT NULL UNIQUE,
  "overallScore" NUMERIC(5,2),
  "primaryCause" TEXT,
  "keyEvidence" JSONB,
  "decisions" JSONB,
  "outcome" JSONB,
  "skillPerformance" JSONB,
  "mistakePatterns" JSONB,
  "strengths" JSONB,
  "improvementAreas" JSONB,
  "conceptsToReview" JSONB,
  "xpEarned" INTEGER NOT NULL DEFAULT 0,
  "coinsEarned" INTEGER NOT NULL DEFAULT 0,
  "recommendedProjectId" UUID,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProjectCompletionReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
  CONSTRAINT "ProjectCompletionReport_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT,
  CONSTRAINT "ProjectCompletionReport_investigationId_fkey" FOREIGN KEY ("investigationId") REFERENCES "Investigation"("id") ON DELETE RESTRICT
);

CREATE TABLE "Feedback" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID,
  "category" VARCHAR(80) NOT NULL,
  "message" TEXT NOT NULL,
  "status" "FeedbackStatus" NOT NULL DEFAULT 'OPEN',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Feedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL
);

CREATE TABLE "AuditEvent" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "actorType" "ActorType" NOT NULL,
  "actorId" UUID,
  "action" VARCHAR(120) NOT NULL,
  "entityType" VARCHAR(80) NOT NULL,
  "entityId" UUID,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL
);

CREATE INDEX "AnonymousSession_expiresAt_idx" ON "AnonymousSession"("expiresAt");
CREATE INDEX "AnonymousSession_lastActivityAt_idx" ON "AnonymousSession"("lastActivityAt");
CREATE INDEX "User_lastActivityAt_idx" ON "User"("lastActivityAt");
CREATE INDEX "Subject_status_ordering_idx" ON "Subject"("status","ordering");
CREATE INDEX "Project_subjectId_status_idx" ON "Project"("subjectId","status");
CREATE INDEX "ProjectVersion_projectId_status_idx" ON "ProjectVersion"("projectId","status");
CREATE INDEX "Level_projectVersionId_levelNumber_idx" ON "Level"("projectVersionId","levelNumber");
CREATE INDEX "CaseFile_projectVersionId_ordering_idx" ON "CaseFile"("projectVersionId","ordering");
CREATE INDEX "Question_levelId_ordering_idx" ON "Question"("levelId","ordering");
CREATE INDEX "Investigation_userId_status_idx" ON "Investigation"("userId","status");
CREATE INDEX "Investigation_anonymousSessionId_status_idx" ON "Investigation"("anonymousSessionId","status");
CREATE INDEX "Investigation_projectId_status_idx" ON "Investigation"("projectId","status");
CREATE INDEX "Investigation_projectVersionId_idx" ON "Investigation"("projectVersionId");
CREATE INDEX "InvestigationAnswer_userId_submittedAt_idx" ON "InvestigationAnswer"("userId","submittedAt");
CREATE INDEX "UserProjectProgress_userId_status_idx" ON "UserProjectProgress"("userId","status");
CREATE INDEX "UserPerformance_userId_idx" ON "UserPerformance"("userId");
CREATE INDEX "RewardLedger_userId_createdAt_idx" ON "RewardLedger"("userId","createdAt");
CREATE INDEX "RewardLedger_sourceId_rewardType_idx" ON "RewardLedger"("sourceId","rewardType");
CREATE INDEX "UserBadge_userId_earnedAt_idx" ON "UserBadge"("userId","earnedAt");
CREATE INDEX "StreakActivity_userId_activityDate_idx" ON "StreakActivity"("userId","activityDate");
CREATE INDEX "UserNote_userId_idx" ON "UserNote"("userId");
CREATE INDEX "ProjectCompletionReport_userId_createdAt_idx" ON "ProjectCompletionReport"("userId","createdAt");
CREATE INDEX "AuditEvent_actorId_createdAt_idx" ON "AuditEvent"("actorId","createdAt");
CREATE INDEX "AuditEvent_entityType_entityId_idx" ON "AuditEvent"("entityType","entityId");

-- Exactly one owner is required for every investigation.
-- This CHECK allows either a registered user or anonymous session, never both.
ALTER TABLE "Investigation"
  ADD CONSTRAINT "Investigation_owner_xor_check"
  CHECK (("userId" IS NOT NULL AND "anonymousSessionId" IS NULL)
      OR ("userId" IS NULL AND "anonymousSessionId" IS NOT NULL));

-- Published project versions are immutable by application policy.
-- The database stores the checksum/version; the backend must reject edits after publish.
