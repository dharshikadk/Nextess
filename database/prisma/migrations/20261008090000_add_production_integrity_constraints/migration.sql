-- Production ownership integrity preflight.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "Investigation"
    WHERE ("userId" IS NULL) = ("anonymousSessionId" IS NULL)
  ) THEN
    RAISE EXCEPTION 'Migration aborted: Investigation contains rows with invalid ownership. Exactly one of userId/anonymousSessionId must be set.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM "SubjectEnrollment"
    WHERE ("userId" IS NULL) = ("anonymousSessionId" IS NULL)
  ) THEN
    RAISE EXCEPTION 'Migration aborted: SubjectEnrollment contains rows with invalid ownership. Exactly one of userId/anonymousSessionId must be set.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "InvestigationAnswer" a
    JOIN "Investigation" i ON i.id = a."investigationId"
    WHERE (i."userId" IS NULL AND a."userId" IS NOT NULL)
       OR (i."userId" IS NOT NULL AND a."userId" IS DISTINCT FROM i."userId")
  ) THEN
    RAISE EXCEPTION 'Migration aborted: InvestigationAnswer ownership does not match its investigation.';
  END IF;
END $$;

ALTER TABLE "Investigation"
  ADD CONSTRAINT "Investigation_exactly_one_owner"
  CHECK (("userId" IS NOT NULL) <> ("anonymousSessionId" IS NOT NULL));

ALTER TABLE "SubjectEnrollment"
  ADD CONSTRAINT "SubjectEnrollment_exactly_one_owner"
  CHECK (("userId" IS NOT NULL) <> ("anonymousSessionId" IS NOT NULL));

CREATE OR REPLACE FUNCTION nextess_validate_investigation_answer_owner()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  investigation_user_id uuid;
BEGIN
  SELECT "userId" INTO investigation_user_id
  FROM "Investigation"
  WHERE id = NEW."investigationId";

  IF investigation_user_id IS NULL AND NEW."userId" IS NOT NULL THEN
    RAISE EXCEPTION 'InvestigationAnswer userId must be NULL for an anonymous investigation';
  END IF;

  IF investigation_user_id IS NOT NULL AND NEW."userId" IS DISTINCT FROM investigation_user_id THEN
    RAISE EXCEPTION 'InvestigationAnswer userId must match investigation owner';
  END IF;

  RETURN NEW;
END;
$$;

CREATE CONSTRAINT TRIGGER "InvestigationAnswer_owner_consistency"
AFTER INSERT OR UPDATE OF "investigationId", "userId"
ON "InvestigationAnswer"
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION nextess_validate_investigation_answer_owner();
