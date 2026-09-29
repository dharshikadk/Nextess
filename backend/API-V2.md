# Nextess V2 API surface

## Runtime source of truth

Published PostgreSQL `ProjectVersion` records are the runtime source of truth for mission content. The JSON package under `database/content/` is authoring/seed input only. The frontend never loads mission content from a duplicate JSON catalogue.

## Authentication

- POST /v1/auth/register
- POST /v1/auth/login
- POST /v1/auth/logout
- GET /v1/auth/me

Authentication uses an HttpOnly session cookie. The API does not return the raw session token in the JSON response. If a valid anonymous-session cookie exists during register/login, eligible anonymous investigations, answers, subject enrollments and resumable project progress are migrated to the authenticated account atomically.

Usernames are normalized to trimmed lowercase on write and matched case-insensitively on login.

## Profile/settings

- GET/PATCH /v1/profile
- GET/PATCH /v1/settings

## User state

- GET /v1/dashboard
- GET /v1/streak
- GET /v1/badges

## Daily systems

- GET /v1/quotes/daily
- GET /v1/directives
- POST /v1/directives/:id/claim

`GET /v1/quotes/daily` returns `{ quote: { id, quote, author, date, category } | null }`. The selected quote is deterministic for the UTC day and rotates across the seeded quote set.

## League

- GET /v1/leaderboard
- POST /v1/league/join

## Catalogue

- GET /v1/subjects — returns ACTIVE and FUTURE subjects from the database catalogue.
- GET /v1/subjects/:subjectId/projects — returns only PUBLISHED projects whose current published version is also PUBLISHED.
- GET /v1/projects/:projectId — returns only a PUBLISHED project and its current PUBLISHED version.

The project list and project-detail endpoints therefore use the same publication boundary and current-version relation.

## Mission lifecycle

- POST /v1/projects/:projectId/start — creates or resumes a mission investigation for an authenticated or anonymous learner according to project.anonymousAccess.
- GET /v1/investigations/:id — returns persisted mission/version/task state only for the investigation owner.
- POST /v1/investigations/:id/answers — server-authoritative challenge evaluation and progression.
- POST /v1/investigations/:id/hints — consumes/reveals the next configured hint.
- POST /v1/investigations/:id/reveal-answer — controlled answer reveal; evaluation metadata is not included in normal mission payloads.
- POST /v1/investigations/:id/simulation-state — persists generic simulation state under the investigation.
- POST /v1/investigations/:id/complete — returns the completion report for authenticated learners; anonymous completion returns no persistent reward report.

## Challenge evaluation

Reusable evaluator types currently include:

- structured-choice
- numerical
- what-if
- data-analysis
- quantitative-investigation
- engineering-decision
- decision

Evaluation is selected by challenge type through `backend/src/evaluators.ts`. The shared evaluator performs deterministic scalar, array, and nested-object comparisons, so structured answer payloads can be reused across missions. Unknown future types can use the generic deterministic answer contract until a dedicated evaluator is added.

Correctness is never accepted from the frontend.

## Progression and rewards

- The investigation stores the immutable `projectVersionId` used by that attempt.
- The backend validates the current question before accepting a submission.
- Level completion and mission completion are calculated from persisted server-side answers.
- Reward values are taken from the published level's `rewardXp` and `rewardCoins` fields.
- RewardLedger idempotency keys prevent repeated submissions from awarding the same level reward twice. Answer idempotency keys are scoped to the learner and investigation, so reusing a client key in another mission cannot replay the first mission's answer.
- The frontend only displays reward results returned by the server.
- Answer creation, penalties, progression, level rewards, and mission completion are committed in one serializable transaction.
- localStorage values such as selected mission and stage are navigation state, never authoritative progression state.

## Security/retry behavior

- Mission investigations are scoped to the authenticated user or expiring anonymous session.
- Cross-user investigation access returns NOT_FOUND rather than exposing another learner's state.
- Published mission attempts retain their projectVersionId.
- Invalid investigation/question IDs and questions outside the investigation version are rejected.
- A submission for a question other than the investigation's currentQuestionId is rejected.
- Hint and answer-reveal requests are restricted to the current task.
- Simulation-state writes are restricted to the simulation attached to the current level.
- Hint/reveal charges use unique reward-ledger idempotency keys.
- API errors use `{ error: { code, message, requestId, details } }`.

## Simulation boundary

Simulation files are presentation assets referenced by published simulation metadata. The mission stage renderer accepts only safe same-origin asset paths; external URLs and unsafe path characters are rejected by the renderer. A simulation cannot directly grant KP/coins; mission completion remains backend-authoritative.

## Required verification

Every release candidate should verify:

1. frontend TypeScript and Vite build
2. backend TypeScript build and evaluator tests
3. Prisma validation
4. clean PostgreSQL migration
5. deterministic seed
6. subject catalogue counts
7. published mission discovery
8. daily quote response
9. anonymous mission start/resume
10. anonymous-to-account conversion
11. cross-user investigation rejection
12. duplicate submission/reward idempotency
13. simulation asset loading
14. end-to-end mission progression


## Mission execution integrity additions

Published ProjectVersion data is the runtime source of truth for Mission Chamber state. Answer submissions require an `Idempotency-Key`; the scoped key is persisted with the answer and a retry returns `replayed: true` without duplicating reward/penalty effects.
