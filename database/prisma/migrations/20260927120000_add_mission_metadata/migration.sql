-- Add frontend-consumable published mission metadata without changing existing content rows.
ALTER TABLE "ProjectVersion" ADD COLUMN "contentMetadata" JSONB;
ALTER TABLE "CaseFile" ADD COLUMN "metadata" JSONB;