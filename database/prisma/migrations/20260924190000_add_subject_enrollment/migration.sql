-- Add subject enrollment support for authenticated users and anonymous learners.
CREATE TABLE "SubjectEnrollment" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "subjectId" UUID NOT NULL,
    "userId" UUID,
    "anonymousSessionId" UUID,
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubjectEnrollment_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "SubjectEnrollment_actor_check" CHECK (
        ("userId" IS NOT NULL) <> ("anonymousSessionId" IS NOT NULL)
    )
);

CREATE UNIQUE INDEX "SubjectEnrollment_userId_subjectId_key"
    ON "SubjectEnrollment"("userId", "subjectId");

CREATE UNIQUE INDEX "SubjectEnrollment_anonymousSessionId_subjectId_key"
    ON "SubjectEnrollment"("anonymousSessionId", "subjectId");

CREATE INDEX "SubjectEnrollment_subjectId_idx"
    ON "SubjectEnrollment"("subjectId");

CREATE INDEX "SubjectEnrollment_userId_idx"
    ON "SubjectEnrollment"("userId");

CREATE INDEX "SubjectEnrollment_anonymousSessionId_idx"
    ON "SubjectEnrollment"("anonymousSessionId");

ALTER TABLE "SubjectEnrollment"
    ADD CONSTRAINT "SubjectEnrollment_subjectId_fkey"
    FOREIGN KEY ("subjectId") REFERENCES "Subject"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SubjectEnrollment"
    ADD CONSTRAINT "SubjectEnrollment_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SubjectEnrollment"
    ADD CONSTRAINT "SubjectEnrollment_anonymousSessionId_fkey"
    FOREIGN KEY ("anonymousSessionId") REFERENCES "AnonymousSession"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
