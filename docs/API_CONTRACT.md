# Nextess API Contract

This is the frontend/backend integration contract for the current shared mission runtime.

## Authentication
- Cookie session: `nextess_session`, HttpOnly, SameSite=Lax, Secure in production.
- Anonymous mission state uses the HttpOnly `nextess_guest` cookie.
- Protected endpoints return `AUTH_REQUIRED` with HTTP 401.
- Cross-origin state-changing browser requests are rejected when an Origin header is present and does not match `FRONTEND_ORIGIN`.

## Error envelope

All expected API errors use:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable message.",
    "requestId": "correlation-id",
    "details": []
  }
}
```

Known codes include `VALIDATION_ERROR`, `AUTH_REQUIRED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `RATE_LIMITED`, `MISSION_UNAVAILABLE`, `INVALID_VERSION`, `INVALID_TASK`, `INVALID_STATE`, `IDEMPOTENCY_KEY_REQUIRED`, `INVESTIGATION_CLOSED`, `TASK_NOT_AVAILABLE`, `INSUFFICIENT_FUNDS`, `NO_MORE_HINTS`, `INVALID_CREDENTIALS`, and `INTERNAL_ERROR`.

## Mission lifecycle

- `GET /v1/subjects` — public catalogue.
- `GET /v1/subjects/:subjectId/projects` — published missions.
- `GET /v1/projects/:projectId` — published mission/version detail.
- `POST /v1/projects/:projectId/start` — starts or resumes a learner investigation.
- `GET /v1/investigations/:id` — authoritative investigation state.
- `POST /v1/investigations/:id/answers` — server-authoritative evaluation; requires `Idempotency-Key`.
- `POST /v1/investigations/:id/hints` — reveal next hint.
- `POST /v1/investigations/:id/reveal-answer` — reveal authoritative answer.
- `POST /v1/investigations/:id/simulation-state` — persist simulation state only for the simulation attached to the current level.
- `POST /v1/investigations/:id/complete` — finalize a completed investigation.

## Frontend rules

The frontend must:
1. Treat published mission versions returned by the API as authoritative.
2. Never calculate or award XP/coins itself.
3. Never expose evaluator answers before a reveal action.
4. Use scoped idempotency keys for answer submissions.
5. Render task behavior from the task registry instead of mission-specific pages.
6. Treat unsupported task types as explicit extension gaps, not silent fallbacks.


## Client error handling

The frontend preserves the server error envelope as an ApiError containing:
- code for programmatic handling;
- message for learner-facing text;
- status for HTTP semantics;
- requestId for support/debug correlation;
- details for structured validation information.

Mutations must not be retried blindly. Answer submission retries reuse the same Idempotency-Key; other mutations follow their endpoint-specific semantics.

## Mission extension contract

A new challenge type must add:
1. content/schema validation;
2. deterministic evaluator registration when applicable;
3. frontend task renderer registration;
4. automated contract tests;
5. an example mission.

A new mission must not require a new route, page, database table or evaluator architecture.
