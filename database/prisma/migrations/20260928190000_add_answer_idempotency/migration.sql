-- Add retry-safe idempotency for mission answer submissions.
ALTER TABLE "InvestigationAnswer"
  ADD COLUMN "idempotencyKey" VARCHAR(180);

CREATE UNIQUE INDEX "InvestigationAnswer_idempotencyKey_key"
  ON "InvestigationAnswer"("idempotencyKey");
