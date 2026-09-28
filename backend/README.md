# Nextess V2 API

Server authority for authentication, profile data, rewards, streak activity, badges, daily directives, league participation and mission catalogue reads.

Run the database migration and V2 seed before starting the API.

## Backend/API hardening

The mission answer path is retry-safe and server-authoritative: answer creation and wrong-answer penalties are committed in one serializable transaction, with persisted idempotency keys preventing duplicate attempts and rewards. Request validation rejects malformed UUIDs, invalid registration profile types, invalid answer arrays, oversized simulation identifiers, and non-object simulation state before persistence.

The existing data-driven mission architecture is preserved. No mission-specific routes, controllers, or database structures were introduced.
