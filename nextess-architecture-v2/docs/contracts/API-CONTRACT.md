# Nextess API Contract

## Authentication

```text
POST /v1/auth/register
POST /v1/auth/login
POST /v1/auth/logout
GET  /v1/auth/me
```

Authentication is optional during initial exploration.

## Anonymous exploration

```text
GET  /v1/explore
GET  /v1/subjects
GET  /v1/subjects/{subjectId}/projects
GET  /v1/projects/{projectId}
POST /v1/projects/{projectId}/start
GET  /v1/investigations/{investigationId}
POST /v1/investigations/{investigationId}/answers
POST /v1/investigations/{investigationId}/hints
POST /v1/investigations/{investigationId}/reveal-answer
```

Only explicitly anonymous-accessible content can be used.

## Authenticated application

```text
GET /v1/dashboard
GET /v1/streak
GET /v1/leaderboard
GET /v1/badges
GET /v1/profile
PATCH /v1/profile
GET /v1/settings
PATCH /v1/settings
POST /v1/feedback
GET /v1/faqs
```

## Investigation

```text
POST /v1/projects/{projectId}/start
GET  /v1/investigations/{investigationId}
POST /v1/investigations/{investigationId}/answers
POST /v1/investigations/{investigationId}/hints
POST /v1/investigations/{investigationId}/reveal-answer
POST /v1/investigations/{investigationId}/simulation-state
POST /v1/investigations/{investigationId}/complete
```

## Answer request

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
  "idempotencyKey": "unique-client-key"
}
```

XP/coins are never accepted as authoritative request fields.

## Error contract

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

## Contract rule

Agents must not silently change an API shape. Contract changes require documentation and tests.


## Runtime safety guarantees

- Answer submissions require an Idempotency-Key header. The server scopes that key to the learner and investigation.
- Answer creation, wrong-answer penalties, progression, level rewards, and mission completion are committed atomically in a serializable transaction.
- Hints and answer reveal are restricted to the current task.
- Simulation-state writes are restricted to the simulation attached to the current level.
- Malformed JSON and other unhandled API failures use the standard error envelope instead of leaking parser/stack details.
