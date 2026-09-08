# Nextess API Contract

## Principles

- `/v1` is the initial API version.
- JSON request/response bodies.
- Validate every request at the API boundary.
- Server is authoritative.
- Commands should be idempotent where retries can occur.
- Never expose database models directly as public API contracts.

## Authentication

Recommended endpoints:

```text
POST /v1/auth/register
POST /v1/auth/login
POST /v1/auth/logout
GET  /v1/auth/me
POST /v1/auth/refresh        # only if refresh-token architecture is used
```

Never return password hashes.

## Dashboard

```text
GET /v1/dashboard
GET /v1/streak
GET /v1/leaderboard
GET /v1/badges
```

Dashboard response should provide only data required by the UI.

## Profile

```text
GET   /v1/profile
PATCH /v1/profile
```

Allow-list editable fields. Never accept arbitrary database fields.

## Settings

```text
GET   /v1/settings
PATCH /v1/settings
POST  /v1/feedback
GET   /v1/faqs
```

## Projects/content

```text
GET /v1/subjects
GET /v1/subjects/{subjectId}/projects
GET /v1/projects/{projectId}
GET /v1/projects/{projectId}/levels
GET /v1/levels/{levelId}
```

Published content should be versioned.

## Investigation

```text
POST /v1/projects/{projectId}/start
GET  /v1/investigations/{investigationId}
POST /v1/investigations/{investigationId}/answers
POST /v1/investigations/{investigationId}/hints
POST /v1/investigations/{investigationId}/show-answer
POST /v1/investigations/{investigationId}/simulation-state
POST /v1/investigations/{investigationId}/complete
```

### Answer command

Request:

```json
{
  "questionId": "q_123",
  "answer": {
    "type": "numeric",
    "value": 400
  },
  "simulationSnapshot": {
    "variables": {
      "potentialA": 300,
      "potentialB": 100,
      "separationCm": 5
    }
  },
  "idempotencyKey": "client-generated-unique-key"
}
```

Response:

```json
{
  "attemptId": "attempt_123",
  "result": "INCORRECT",
  "consequence": {
    "status": "LIMIT_EXCEEDED",
    "messageKey": "electric.field.limitExceeded"
  },
  "reward": {
    "xp": 0,
    "coins": 0
  },
  "progress": {
    "questionStatus": "RETRY_AVAILABLE"
  },
  "explanationAvailable": true
}
```

The server should ignore any client-submitted XP/coin values.

## Error contract

Use a stable shape:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The submitted value is not valid.",
    "requestId": "req_123",
    "details": []
  }
}
```

Do not expose stack traces or database errors.

## HTTP behavior

Suggested semantics:

- `200` successful reads/commands
- `201` resource created
- `204` successful deletion where appropriate
- `400` malformed/invalid request
- `401` unauthenticated
- `403` authenticated but not authorized
- `404` resource not found/visible
- `409` conflict/idempotency/state conflict
- `422` semantically invalid input
- `429` rate limit
- `500` unexpected server error

## Contract rules for AI agents

An agent implementing a feature must not silently alter an endpoint shape. Update this document and tests first if a contract genuinely needs to change.
