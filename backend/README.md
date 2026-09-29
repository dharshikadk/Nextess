# Nextess V2 API

Server authority for authentication, profile data, rewards, streak activity, badges, daily directives, league participation and mission catalogue reads.

Run the database migration and V2 seed before starting the API.

## Backend/API completion hardening

The backend remains data-driven and server-authoritative. Answer creation and wrong-answer penalties now commit together under serializable transaction retries, while persisted idempotency keys prevent duplicate attempts and rewards during retries or concurrent requests. Request validation covers mission/question IDs, registration profile types, feedback, answer payload shape, and simulation state.

No mission-specific routes or backend architecture were introduced. Existing anonymous exploration, authenticated persistence, published mission versioning, generic challenge evaluation, progression, hints, answer reveal, simulation state, and reward contracts remain in place.


## Final security hardening

- Passwords are stored with memory-hard scrypt hashes. Existing legacy SHA-256 password records are accepted only after successful authentication and are upgraded immediately.
- Authentication session lifetime is controlled by SESSION_DAYS and is bounded to a safe range.
- Security response headers are applied centrally; HSTS is enabled in production.
- Mission task submission, hint requests, and answer reveals are restricted to the investigation's server-authoritative current task.
- Simulation state can only be written for a simulation attached to the investigation's current level.
- Malformed JSON/request payloads use the normal API error envelope rather than Express stack/error pages.
- The existing anonymous-session, published-version, evaluator, reward, and idempotency architecture is preserved.
