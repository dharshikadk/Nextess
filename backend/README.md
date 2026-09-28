# Nextess V2 API

Server authority for authentication, profile data, rewards, streak activity, badges, daily directives, league participation and mission catalogue reads.

Run the database migration and V2 seed before starting the API.

## Backend/API hardening

Mission execution remains data-driven and server-authoritative. Answer submissions use the existing `Idempotency-Key` contract and are committed with serializable transaction retries so duplicate/concurrent submissions cannot create duplicate answers or split wrong-answer penalties from the recorded attempt. Request validation rejects malformed mission/question IDs and invalid simulation state before database work.

The backend continues to support anonymous mission exploration, authenticated persistence, published mission versions, generic challenge evaluation, hints, answer reveal, simulation state, progression, and server-authoritative rewards without mission-specific routes.

CI runs evaluator tests, validation tests, Prisma validation/migrations/seeding, backend build, API smoke checks, and database-backed mission runtime smoke tests including cross-user isolation and concurrent idempotent answer submission.
