# Nextess API Contract

## Authentication

```text
POST /v1/auth/register
POST /v1/auth/login
POST /v1/auth/logout
GET  /v1/auth/me
POST /v1/auth/claim-anonymous-session   # only if transfer is enabled
```

Authentication is optional during initial exploration.

## Anonymous exploration

```text
GET  /v1/explore
GET  /v1/subjects
GET  /v1/subjects/{subjectId}/projects
GET  /v1/projects/{projectId}
POST /v1/projects/{projectId}/anonymous-start
GET  /v1/anonymous-investigations/{investigationId}
POST /v1/anonymous-investigations/{investigationId}/answers
POST /v1/anonymous-investigations/{investigationId}/hints
POST /v1/anonymous-investigations/{investigationId}/show-answer
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
POST /v1/investigations/{investigationId}/show-answer
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
