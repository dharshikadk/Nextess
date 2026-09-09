# Nextess Master Architecture

## 1. Product definition

Nextess is a real-world problem-solving learning platform for high-school Physics and Economics.

The core learning loop is:

`REAL-WORLD CASE → INFORMATION FILE → SIMULATION/OBSERVATION → QUESTION → ANALYSE → CONNECT CONCEPTS → CALCULATE/PREDICT → TEST → CONSEQUENCE → NEXT QUESTION → LEVEL SUMMARY`

A level contains approximately 3–4 connected problems/questions around the same situation. Difficulty increases through interacting concepts, variables, constraints and decisions rather than simply making calculations harder.

## 2. Explore-first onboarding

This is a **mandatory architectural product rule**:

```text
Open Nextess
      ↓
Start Exploring
      ↓
Experience the UI/UX
      ↓
Try Projects
      ↓
Decide whether to create an account
```

### Authentication must not be a first-screen gate

A visitor must be able to understand and try the product before creating an account.

Login/signup must remain accessible from appropriate points throughout the application.

The system therefore supports two user states:

```text
ANONYMOUS VISITOR
      |
      +--> Explore
      +--> Try eligible projects
      +--> Use eligible simulations
      +--> Answer eligible questions
      |
      +--> Login / Sign Up at any time
                    |
                    v
             AUTHENTICATED USER
```

## 3. Anonymous exploration

Anonymous visitors may access content explicitly configured for anonymous use.

Potential capabilities:

- explore active subjects
- inspect project descriptions
- open eligible case files
- use eligible simulations
- answer eligible questions
- see consequences
- see explanations
- navigate eligible investigations

The backend decides eligibility. The frontend must never grant access simply because a button is visible.

Anonymous interaction may use a secure, expiring server-side visitor/session identifier.

An anonymous visitor is **not** a full `User`.

## 4. Authenticated value

Account-based features can include:

- persistent cross-device progress
- profile
- durable XP/coins
- streak history
- badges
- leaderboard participation
- saved notes
- completed-project history

The exact authentication requirement for each operation belongs in authorization policy.

## 5. Optional anonymous-to-account transfer

If product implementation supports carrying anonymous progress into a new account:

```text
Anonymous session
      ↓
Signup/Login
      ↓
Authenticated account
      ↓
Explicit claim/merge operation
      ↓
Transactional transfer
```

The browser must never copy database state itself.

Claiming must verify ownership of the anonymous session, be idempotent and prevent cross-user claims.

## 6. System architecture

```text
Browser
  |
  | HTTPS / JSON
  v
Web Application
  |
  +--> Auth & Session
  +--> Content/Projects
  +--> Investigations
  +--> Evaluation
  +--> Rewards
  +--> Badges/Streak
  +--> Leaderboard
  +--> Notes/Feedback
  +--> Simulation adapters
  |
  v
PostgreSQL

Optional:
Redis/cache/rate limiting
Object storage
Observability
Background workers
```

The browser never connects directly to PostgreSQL.

The simulation never decides authoritative rewards.

AI never becomes the authority for correctness, XP, coins, badges, streaks or leaderboard values.

## 7. Recommended technical direction

- TypeScript
- React-based frontend
- Node.js backend
- PostgreSQL
- Prisma or equivalent typed migration ORM
- Docker
- OpenAPI/API schema
- automated unit/integration/E2E tests

Physics simulation may use VPython or another suitable browser-compatible engine through a narrow adapter. Do not execute arbitrary user-supplied Python/C++ on the backend.

## 8. Modules

Start as a modular monolith:

```text
auth
users
anonymous-sessions
content
projects
investigations
evaluation
rewards
badges
streaks
leaderboard
notes
feedback
simulations
audit
```

Do not introduce microservices merely because there are many modules.

## 9. Investigation architecture

A project is a persistent situation containing case files, levels and connected questions.

Files remain available according to the level/content configuration.

A question can use:

- observation
- diagnosis
- quantitative investigation
- what-if analysis
- prediction
- configuration
- engineering decision
- evidence comparison
- trend analysis
- policy/business decision

## 10. Physics and Economics

Physics uses simulation where appropriate:

`variables → simulation → consequence`

Economics follows the same investigation philosophy but uses domain-specific evidence, data, trends, relationships and decisions.

Do not force both subjects into one identical evaluator.

## 11. Deterministic evaluation

Authoritative evaluation must be deterministic and versioned.

For the same:

`content version + evaluator version + input`

the result must be reproducible.

AI may assist with optional tutoring but cannot determine authoritative correctness.

## 12. Rewards

XP represents accurate performance and coins represent correct answers according to the supplied product direction.

Rewards must be calculated server-side.

Use an immutable reward ledger:

```text
RewardLedger
- id
- userId
- sourceType
- sourceId
- rewardType
- amount
- reason
- idempotencyKey
- createdAt
```

Never accept client-supplied XP or coin amounts as authoritative.

## 13. Progress and transactions

Answer submission should atomically update:

- attempt
- answer result
- question progress
- level/project progress
- rewards
- relevant badges
- activity/streak event

Retries should use idempotency keys.

## 14. Streak and leaderboard

Streaks are calculated server-side from defined activity rules.

Leaderboard values are server-side.

Do not expose unnecessary private account information.

## 15. Security

Required baseline:

- TLS in production
- secure session/cookie handling
- modern password hashing
- authorization on every protected object
- input validation
- rate limiting
- abuse protection
- secure headers
- dependency/security scanning
- secret management
- least-privilege database access
- audit logging
- tested backups and restore

Anonymous access is still untrusted access and must receive validation, rate limiting, expiration and access controls.

## 16. Failure behavior

Examples:

- answer timeout → retry safely using same idempotency key
- simulation failure → preserve last valid state
- reward transaction failure → do not show reward success
- leaderboard failure → core investigation remains usable
- optional AI failure → deterministic explanation remains available

## 17. Observability

Capture:

- request ID
- endpoint
- latency
- status
- error category
- user/session identifier where appropriate
- content version
- evaluator version
- reward event ID

Never log passwords, tokens or unnecessary private content.

## 18. Content versioning

Published content is immutable.

Use:

`draft → review → approved → published → retired`

A student's investigation records the content version used so historical results remain reproducible.
