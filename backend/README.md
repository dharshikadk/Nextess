# Nextess V2 API

Server authority for authentication, profile data, rewards, streak activity, badges, daily directives, league participation and mission catalogue reads.

Run the database migration and V2 seed before starting the API.

## Backend/API completion hardening

The backend remains data-driven and server-authoritative. Answer creation and wrong-answer penalties now commit together under serializable transaction retries, while persisted idempotency keys prevent duplicate attempts and rewards during retries or concurrent requests. Request validation covers mission/question IDs, registration profile types, feedback, answer payload shape, and simulation state.

No mission-specific routes or backend architecture were introduced. Existing anonymous exploration, authenticated persistence, published mission versioning, generic challenge evaluation, progression, hints, answer reveal, simulation state, and reward contracts remain in place.
