# Nextess Production Readiness Audit — 2026-10-08

## 1. Audit scope

This audit covers the current `main` branch of `dharshikadk/Nextess` at the latest inspected commit:

- Commit: `4f179819092e4864931751e5cd2f4c1e5273ab49`
- Repository: `dharshikadk/Nextess`
- Primary layers: `frontend-v2`, `backend`, `database`, Docker/CI, mission/content pipeline
- Checks requested:
  - production readiness
  - bugs and architecture gaps
  - data collection/persistence integrity
  - API/frontend integration
  - button/action coverage
  - mission runtime and reward persistence
  - database safety
  - production deployment configuration
  - test/CI coverage

### Execution limitation

A direct repository clone could not be executed from the audit environment because outbound DNS/network access to `github.com` is unavailable. Therefore, this document deliberately distinguishes:

1. **Repository inspection findings** — verified from the repository files through GitHub.
2. **CI/test configuration findings** — verified from `.github/workflows/ci.yml`.
3. **Runtime execution findings** — only considered verified when an existing automated test/CI result is available.

Do not mark the application production-ready solely because the configured CI suite exists. The CI pipeline itself must pass on this audit PR after these changes are implemented.

---

# 2. Production verdict

## CURRENT STATUS: NOT PRODUCTION READY

Nextess has a substantial working architecture and unusually good cross-layer coverage for the current stage, including:

- PostgreSQL + Prisma persistence
- anonymous sessions
- authenticated sessions
- mission versioning
- server-side evaluation
- idempotent answer submission
- reward ledger
- mission resume state
- guest-to-account migration
- Playwright browser E2E
- database-backed runtime smoke tests
- CI migration/seed/build checks
- subject/task extensibility

However, there are production blockers that must be addressed before release.

### Release blockers

| ID | Area | Severity | Status |
|---|---|---|---|
| PR-001 | Production Docker images run development servers | BLOCKER | Implement |
| PR-002 | No committed npm lockfiles | HIGH | Implement |
| PR-003 | Docker compose hard-codes development database credentials | HIGH | Implement |
| PR-004 | Database ownership invariants are not fully enforced at DB level | HIGH | Implement |
| PR-005 | Guest/user investigation ownership permits invalid dual/empty ownership states at schema level | HIGH | Implement |
| PR-006 | Streak calculation has an edge case when the user has activity yesterday but not today | HIGH | Implement + test |
| PR-007 | Runtime button/action coverage is incomplete | HIGH | Implement exhaustive action E2E |
| PR-008 | Production deployment/observability/backup readiness is incomplete | HIGH | Implement |
| PR-009 | API error handling in frontend hides many failures instead of exposing actionable state | MEDIUM/HIGH | Implement |
| PR-010 | Mission simulation persistence is present as an endpoint/model but needs end-to-end verification for every simulation | HIGH | Implement + test |
| PR-011 | Content import/seed path is coupled to a fixed mission filename and class-11 file list | MEDIUM | Implement configurable/content-discovery import |
| PR-012 | CI uses `npm install` rather than reproducible locked installs | HIGH | Implement |
| PR-013 | Production security headers/configuration need a final deployment verification layer | MEDIUM/HIGH | Implement |
| PR-014 | Database migration/seed commands are combined with container startup | HIGH | Implement separate release/init workflow |
| PR-015 | No production-grade automated accessibility/responsive regression gate is present | MEDIUM | Implement |

---

# 3. Verified strengths

## 3.1 Backend authority

The backend is correctly designed as the authority for:

- authentication
- progress
- evaluation
- reward allocation
- streak activity
- mission completion
- anonymous conversion

This matches the canonical architecture and should be preserved.

The backend also uses:

- hashed session tokens
- HTTP-only cookies
- idempotency keys
- serializable transactions for critical operations
- request IDs
- rate limiting
- CORS configuration
- security headers

Do not replace these with frontend-only logic.

## 3.2 Mission versioning

The database separates:

- Project
- ProjectVersion
- Level
- Question
- QuestionOption
- Hint
- CaseFile
- SimulationDefinition
- SimulationVariable
- SimulationConsequence
- EvaluationRule

This is appropriate for future mission additions and subject-specific task types.

## 3.3 Answer idempotency

`InvestigationAnswer.idempotencyKey` is unique and the backend uses scoped idempotency keys for mission submissions.

The existing runtime smoke test explicitly checks:

- first submission
- replay
- concurrent duplicate submission
- same idempotency key in a different investigation
- cross-user investigation access

Preserve these tests.

## 3.4 Guest-to-account conversion

The backend contains explicit guest migration logic that transfers:

- investigations
- answers
- project progress
- subject enrollments

This is an important product requirement and must remain intact.

---

# 4. Production blockers and exact changes

## PR-001 — Production Docker images run development servers

### Evidence

`backend/Dockerfile` ends with:

`CMD ["npm", "run", "dev"]`

`frontend-v2/Dockerfile` ends with:

`CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"]`

`docker-compose.yml` also starts the backend using `npm run dev` and the frontend using the Vite development server.

### Problem

A production deployment must not depend on development servers, hot reload behavior, or development startup commands.

### Required change

Backend:

1. Build TypeScript during image build.
2. Run the compiled `dist/server.js`.
3. Set `NODE_ENV=production`.
4. Do not run Prisma migrations automatically on every application container start.
5. Use a production-safe entrypoint.
6. Run as a non-root user.

Frontend:

1. Run `npm run build`.
2. Serve the generated static assets using a production web server.
3. Do not use Vite dev server in production.
4. Run as a non-root user where supported.

### Acceptance criteria

- Production backend starts without `tsx`.
- Production frontend starts without Vite dev mode.
- No HMR/dev file watcher is required.
- Container health checks use the production artifacts.
- Application startup does not mutate the database schema automatically.

---

## PR-002 — Missing lockfiles

### Evidence

The repository does not currently contain:

- `frontend-v2/package-lock.json`
- `backend/package-lock.json`
- `database/package-lock.json`

### Problem

CI and Docker use `npm install`, so dependency resolution is not fully reproducible.

### Required change

Generate and commit the appropriate npm lockfile for each package.

Then change CI/Docker installation from:

`npm install`

to:

`npm ci`

where a lockfile exists.

### Acceptance criteria

- All package dependency trees are reproducible.
- CI fails if package.json and lockfile are inconsistent.
- Docker builds use locked dependency installation.

---

## PR-003 — Hard-coded development database credentials

### Evidence

`docker-compose.yml` contains:

- `POSTGRES_USER: nextess`
- `POSTGRES_PASSWORD: nextess_dev_password`
- development DATABASE_URL containing the same password

### Problem

This is acceptable only for isolated local development. It must not become the production deployment configuration.

### Required change

Create a clear separation between:

- local development compose
- staging configuration
- production configuration

Production credentials must come from the deployment secret manager/environment.

Do not commit real credentials.

### Acceptance criteria

- Production compose/deployment has no hard-coded database password.
- Production DATABASE_URL comes from an environment secret.
- Database is not publicly exposed by default.
- Postgres port 5432 is not exposed to the public network in production.

---

## PR-004 — Database ownership invariants need stronger enforcement

### Evidence

`Investigation` contains both nullable:

- `userId`
- `anonymousSessionId`

`SubjectEnrollment` contains both nullable:

- `userId`
- `anonymousSessionId`

The application code decides which owner is valid.

### Problem

The database can potentially accept invalid ownership combinations unless all writes are perfectly controlled by application code.

Examples of invalid states:

- both `userId` and `anonymousSessionId` are NULL
- both are populated

### Required change

Add database-level integrity constraints where PostgreSQL supports them, or introduce a migration-safe equivalent.

For ownership records:

`exactly one of userId / anonymousSessionId must be non-null`

Apply this invariant to:

- `Investigation`
- `SubjectEnrollment`

Do not use a frontend validation as the only protection.

### Acceptance criteria

- Invalid ownership rows cannot be inserted directly into PostgreSQL.
- Existing valid rows remain valid during migration.
- Migration has explicit preflight checks and fails safely if bad legacy rows exist.

---

## PR-005 — Investigation answer ownership consistency

### Problem

`InvestigationAnswer` has an optional `userId`, while the investigation itself may be anonymous.

The application already updates answer ownership during guest conversion, but the data model should explicitly define the intended ownership lifecycle.

### Required change

Document and enforce:

- authenticated investigation -> answer may carry the same user
- anonymous investigation -> answer has no user until conversion
- converted investigation -> all eligible answers belong to the converted user
- answers cannot be moved to an unrelated user

Add integration tests for direct DB and API paths.

---

## PR-006 — Streak calculation edge case

### Evidence

The backend streak calculation starts from today's date and expects the first activity row to match today.

If there is no activity today but there is activity yesterday, the function can return zero rather than correctly identifying the previous streak state.

### Required change

Define the exact product semantics:

- activity today -> active streak includes today
- no activity today but activity yesterday -> current streak remains the previous consecutive count while status is at-risk, if that is the product rule
- activity gap > 1 day -> streak is lost
- freeze/recovery rules must be applied consistently

Do not change UX semantics without updating the source-of-truth documentation.

### Required tests

At minimum:

1. no activity
2. today only
3. yesterday only
4. today + yesterday
5. 3 consecutive days
6. gap of one day
7. gap of multiple days
8. frozen day
9. recovered streak
10. timezone boundary

---

## PR-007 — Every-button/action coverage is incomplete

### Current situation

The frontend contains many interactive actions, including:

- navigation
- mission selection
- mission start
- continue mission
- stage opening
- answer submission
- hints
- answer reveal
- level advancement
- mission completion
- simulation interaction
- sign in/sign up
- logout
- profile editing
- theme switching
- settings
- streak goal selection
- streak freeze
- leaderboard
- league join
- badge actions
- directives
- feedback
- guest conversion
- modal close controls

There is strong Playwright coverage for the mission lifecycle, but there is not enough evidence that every interactive control across every screen is covered.

### Required change

Create a dedicated action coverage suite.

Every button/control must be classified as:

- navigation
- mutation
- modal open
- modal close
- external/resource action
- disabled-by-design
- informational/non-interactive

For each actionable control, test:

1. visible state
2. enabled/disabled state
3. click/tap
4. expected UI transition
5. API call when applicable
6. persistence when applicable
7. error state
8. retry state where applicable

### Acceptance criteria

No production button is left without either:

- a dedicated E2E assertion, or
- an explicit documented reason why it is not actionable.

---

## PR-008 — Production observability, backup and recovery readiness

### Required change

Add production operational documentation and checks for:

- database backup schedule
- restore test
- migration rollback strategy
- application logs
- error aggregation
- request ID correlation
- health endpoint
- readiness endpoint
- database connectivity monitoring
- alerting
- disk/storage monitoring
- database connection exhaustion
- API latency
- 5xx rate
- authentication failures
- rate-limit events

The existing request ID and health/readiness mechanisms should be reused rather than replaced.

### Acceptance criteria

A production operator can answer:

- Is the API alive?
- Is it ready to serve traffic?
- Is PostgreSQL reachable?
- Are requests failing?
- Which request caused the failure?
- Can the database be restored?
- Can a migration be safely deployed?

---

## PR-009 — Frontend hides too many API failures

### Evidence

`App.tsx` contains several broad `catch{}` paths that silently fall back to empty data.

Examples include failures for:

- dashboard data
- streak
- directives
- badges
- leaderboard
- quote

### Problem

A network/database/API failure can look like valid empty application state.

This makes production debugging and user recovery difficult.

### Required change

Differentiate:

- unauthenticated guest state
- expected empty state
- temporary network failure
- server error
- authorization failure
- invalid/stale mission state

Show a recoverable error UI for important data.

Do not expose internal stack traces.

### Acceptance criteria

A failed dashboard API does not silently masquerade as a valid empty dashboard.

---

## PR-010 — Simulation persistence requires complete end-to-end verification

### Existing contract

The frontend API includes:

`simulationState(investigationId, simulationId, state)`

The database includes:

- SimulationDefinition
- SimulationVariable
- SimulationConsequence
- SimulationAsset

### Required change

For every currently published simulation:

1. load simulation definition
2. render the correct renderer
3. change a variable
4. observe output
5. save state
6. reload investigation
7. restore state
8. submit related task
9. verify server-side evaluation/consequence
10. verify progress persistence

Add at least one E2E test per currently active simulation family.

---

## PR-011 — Mission import is too coupled to fixed filenames

### Evidence

`database/prisma/seed.ts` directly references:

- `content/nextess_missions(4).json`
- four class-11 mission JSON files

### Problem

Adding missions later requires modifying seed code instead of simply adding valid content.

This conflicts with the goal that new missions should not require frontend/backend structural rewrites.

### Required change

Separate:

- seed/bootstrap data
- mission content discovery/import

Provide a controlled mission import command that can discover or explicitly receive content files.

The importer should:

- validate schema
- validate subject
- validate task types
- validate evidence references
- validate simulation references
- calculate checksum
- import draft
- publish only through explicit publish action

Do not automatically publish arbitrary files in production startup.

---

## PR-012 — CI reproducibility

### Evidence

CI currently uses `npm install`.

### Required change

After lockfiles are committed:

- use `npm ci`
- keep Prisma generation explicit
- keep migration deploy explicit
- seed only in isolated CI databases
- never seed production automatically

Add dependency audit/security scanning as a separate CI gate.

---

## PR-013 — Production security configuration

### Existing strengths

The backend already sets several security headers and uses secure cookies in production.

### Required change

Add a final production configuration test for:

- HTTPS-only cookies
- secure cookie flag
- SameSite behavior
- trusted proxy configuration
- CORS allowlist
- HSTS
- CSP
- frame protection
- content sniffing protection
- request body limits
- rate limits
- authentication endpoint throttling

Do not enable a permissive wildcard CORS configuration.

---

## PR-014 — Separate migration/release jobs from application startup

### Current issue

Docker Compose starts the backend with:

1. Prisma generation
2. Prisma migration
3. database seed
4. development server

### Problem

Application containers should not be responsible for mutating production schema/data on every restart.

### Required change

Production deployment flow:

1. build immutable artifacts
2. run migration job once
3. verify migration
4. optionally run controlled content/data deployment
5. start application containers
6. run readiness checks
7. route traffic

A restart must not reseed the production database.

---

## PR-015 — Accessibility and responsive regression gate

### Required change

Add automated coverage for:

- keyboard navigation
- visible focus
- modal focus trap
- Escape-to-close where appropriate
- button accessible names
- form labels
- error announcements
- responsive mobile layout
- tablet layout
- desktop layout
- reduced motion
- non-color-only error/success states

Do not treat visual styling alone as accessibility validation.

---

# 5. Data collection and persistence audit

## User/account data

### Verified model

The User model stores:

- name
- username
- password hash
- profile type
- profession
- education stage
- school class
- field of study
- profile status
- profile image data
- XP
- coins
- level
- streak goal

### Required safeguards

- validate maximum profile image size before persistence
- avoid storing unnecessarily large base64 images in PostgreSQL
- add content-type/format validation
- consider object storage for production profile images
- ensure user deletion/export policy is defined
- ensure password reset/recovery exists before production release

---

## Mission progress

### Verified model

Progress is split across:

- UserProjectProgress
- UserLevelProgress
- Investigation
- InvestigationAnswer

This is good for resume behavior, but the system must define which record is authoritative when values disagree.

### Required change

Document and test precedence:

1. published ProjectVersion
2. Investigation state
3. UserLevelProgress
4. UserProjectProgress as aggregate/resume summary

Do not allow stale client localStorage values to override server state.

---

## Rewards

### Verified model

RewardLedger provides immutable reward events and idempotency.

### Required change

Add reconciliation tests:

- User XP/coins == ledger-derived balance, according to the chosen accounting model
- duplicate requests do not double reward
- failed transaction does not partially reward
- mission completion cannot award twice
- level completion cannot award twice
- badge award cannot award twice

If balances remain denormalized on User for performance, add periodic reconciliation tooling.

---

## Anonymous activity

### Verified

Anonymous sessions have expiry and migration logic.

### Required change

Add cleanup job for expired anonymous sessions and dependent records according to retention policy.

Do not let anonymous investigation data grow without bound.

---

# 6. API contract audit

## Required endpoint groups

Verify and maintain automated tests for:

### Auth

- register
- login
- me
- logout
- expired session
- invalid credentials
- duplicate username

### Profile/settings

- read profile
- update profile
- read settings
- update settings
- guest behavior

### Mission catalogue

- subjects
- projects by subject
- project detail
- published version selection
- retired version behavior

### Mission runtime

- start
- resume
- investigation read
- answer submit
- answer retry
- hint
- reveal answer
- level advance
- complete
- simulation state

### Engagement

- streak
- streak goal
- freeze
- leaderboard
- league
- badges
- directives
- quote
- feedback

Every endpoint must have:

- success test
- validation failure
- auth failure
- ownership failure
- stale state/concurrency test where relevant

---

# 7. Frontend action audit

## Navigation controls

Verify:

- Dashboard
- Missions
- Streaks & Leaderboard
- Profile & Badges
- Settings
- About
- logo -> Dashboard
- mission chamber -> Back to stages
- profile avatar -> Profile
- KP -> Leaderboard
- streak -> Leaderboard
- sign-in controls -> Auth modal

## Mission controls

Verify:

- open Physics missions
- open Economics missions
- select mission
- close mission preview
- start mission
- continue mission
- open mission stages
- open each stage
- submit each supported task type
- next/advance level
- hint
- reveal answer
- save simulation state
- complete mission
- return to mission list
- resume after reload

## Account controls

Verify:

- sign in
- sign up
- auth modal close
- logout
- edit profile
- save profile
- theme toggle
- settings persistence
- guest conversion

## Engagement controls

Verify:

- streak goal
- streak freeze
- leaderboard
- league join
- directive claim
- badge actions
- contextual notification close
- feedback submission

---

# 8. Mission/content integrity audit

The current mission system is structurally suitable for the provided Physics/Economics mission package.

The mission content contract supports:

- mission metadata
- levels
- task types
- hints
- explanations
- evidence files
- simulations

The backend evaluator registry currently supports:

- numerical
- structured-choice
- what-if
- data-analysis
- quantitative-investigation
- engineering-decision
- decision

### Required change

The mission validator must guarantee that every published task type has:

1. a frontend renderer
2. a backend evaluator
3. a valid input schema
4. valid evaluation definition
5. required resource references
6. a regression test

A mission must not be publishable when any of these are missing.

---

# 9. Production test matrix

The final release gate must contain:

## Static

- TypeScript compile
- frontend lint/typecheck
- Prisma validate
- Prisma generate
- mission schema validation
- dependency audit
- secret scan
- production build

## Database

- clean migration
- migration from previous production schema
- seed/import validation
- foreign-key validation
- ownership constraints
- duplicate prevention
- transaction/concurrency tests
- restore test

## Backend

- unit tests
- API integration tests
- auth tests
- mission lifecycle
- rewards
- streaks
- guest conversion
- idempotency
- authorization/ownership

## Frontend

- unit/component tests
- navigation
- forms
- error states
- responsive layout
- accessibility

## Browser E2E

Run Chromium + Firefox + WebKit for:

- guest exploration
- registration
- login
- logout
- mission discovery
- mission start
- mission resume
- each supported task type
- hints
- answer reveal
- simulation
- completion
- reward update
- profile
- settings
- leaderboard
- directives
- badges

## Production artifact

Build and test:

- production backend container
- production frontend container
- migration job
- readiness endpoint
- health endpoint

---

# 10. Definition of production ready

Nextess must not be declared production-ready until all of the following are true:

- [ ] Production containers use production servers/build artifacts.
- [ ] Lockfiles are committed and CI uses `npm ci`.
- [ ] No production secret is hard-coded.
- [ ] PostgreSQL is private to the application network.
- [ ] Production migrations are separate from application startup.
- [ ] Database ownership invariants are enforced.
- [ ] Mission publishing validates renderer/evaluator availability.
- [ ] All current simulations pass save/reload/evaluation E2E.
- [ ] Every actionable production button has automated coverage.
- [ ] API errors produce recoverable UI states.
- [ ] Guest-to-account conversion is fully regression tested.
- [ ] Reward ledger and user balances reconcile.
- [ ] Streak edge cases and timezone behavior are tested.
- [ ] Authentication/session expiration is tested.
- [ ] Backup and restore are verified.
- [ ] Observability and alerting are configured.
- [ ] Accessibility regression checks pass.
- [ ] Responsive checks pass.
- [ ] Production build is tested independently from development mode.
- [ ] Clean database migration passes.
- [ ] Existing data migration passes without loss.
- [ ] Full CI passes on the release candidate.
- [ ] No known P0/P1 issue remains.

---

# 11. Implementation order

Do not implement these randomly.

### Phase 1 — Production infrastructure

1. lockfiles
2. production Dockerfiles
3. production environment configuration
4. migration/release separation
5. secret handling
6. database network isolation

### Phase 2 — Data integrity

7. ownership constraints
8. migration preflight checks
9. reward reconciliation
10. anonymous-session cleanup
11. mission publish validation

### Phase 3 — Backend correctness

12. streak semantics
13. simulation persistence/evaluation
14. API validation/ownership tests
15. error contract consistency

### Phase 4 — Frontend correctness

16. actionable error states
17. stale-state handling
18. button/action E2E coverage
19. accessibility
20. responsive regression

### Phase 5 — Release validation

21. clean DB migration
22. seeded runtime smoke
23. full backend tests
24. full frontend build
25. Chromium/Firefox/WebKit E2E
26. production container smoke
27. backup/restore verification
28. final production readiness review

---

# 12. Important implementation rules

- Do not rewrite the mission architecture.
- Do not create subject-specific duplicate pages.
- Do not move reward authority to the frontend.
- Do not expose authoritative answers before submission.
- Do not replace server persistence with localStorage.
- Do not automatically publish arbitrary mission files.
- Do not seed production on every container restart.
- Do not merge this audit PR automatically.
- Any database schema change requires an explicit migration and migration-safety test.
- Any API contract change must update all consumers and regression tests.
- Preserve existing Physics and Economics behavior while adding future-subject extensibility.

---

# 13. Final audit conclusion

Nextess is **architecturally close to a serious production application but is not yet production-ready**.

The most important gaps are not the basic mission architecture. They are:

1. production deployment discipline,
2. database-level integrity,
3. complete action/button verification,
4. simulation persistence verification,
5. failure-state visibility,
6. operational readiness,
7. reproducible builds.

Implement the changes in this document, run the complete release test matrix, and only then reassess the production-ready status.
