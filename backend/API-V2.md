# Nextess V2 API surface

Authentication:
- POST /v1/auth/register
- POST /v1/auth/login
- POST /v1/auth/logout
- GET /v1/auth/me

Profile/settings:
- GET/PATCH /v1/profile
- GET/PATCH /v1/settings

User state:
- GET /v1/dashboard
- GET /v1/streak
- GET /v1/badges

Daily systems:
- GET /v1/quotes/daily
- GET /v1/directives
- POST /v1/directives/:id/claim

League:
- GET /v1/leaderboard
- POST /v1/league/join

Catalogue:
- GET /v1/subjects
- GET /v1/subjects/:subjectId/projects
- GET /v1/projects/:projectId

Mission lifecycle:
- POST /v1/projects/:projectId/start — starts/resumes an authenticated or anonymous mission according to project.anonymousAccess.
- GET /v1/investigations/:id — returns the persisted mission/version/task state for its owner.
- POST /v1/investigations/:id/answers — server-authoritative challenge evaluation and progression.
- POST /v1/investigations/:id/hints — consumes/reveals the next configured hint.
- POST /v1/investigations/:id/reveal-answer — controlled answer reveal; evaluation metadata is not included in normal mission payloads.
- POST /v1/investigations/:id/simulation-state — persists generic simulation state under the investigation.
- POST /v1/investigations/:id/complete — returns the completion report for authenticated learners; anonymous completion returns no persistent reward report.

Challenge evaluation:
- Current reusable types: structured-choice, numerical, what-if, data-analysis, quantitative-investigation, engineering-decision, decision.
- Evaluation is selected by challenge type through backend/src/evaluators.ts.
- Unknown future types can use the generic deterministic answer contract until a dedicated evaluator is added.
- Correctness is never accepted from the frontend.

Security/retry behavior:
- Mission investigations are scoped to the authenticated user or an expiring anonymous session.
- Published mission attempts retain their projectVersionId.
- Current task progression is enforced by the investigation's currentQuestionId.
- Level rewards use unique RewardLedger idempotency keys, preventing duplicate reward grants on repeated successful submissions.
- Hint/reveal actions are also protected by unique reward-ledger keys for authenticated learners.
- API errors use { error: { code, message, requestId, details } }.

Rewards are server-authoritative. The frontend never submits XP or coins as authoritative values.
