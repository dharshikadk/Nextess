# Nextess Master Architecture

## 1. Product definition

Nextess is not a conventional question bank.

Its core learning loop is:

`REAL-WORLD CASE → INFORMATION FILE → SIMULATION/OBSERVATION → QUESTION → ANALYSE → CONNECT CONCEPTS → CALCULATE/PREDICT → TEST → CONSEQUENCE → NEXT QUESTION → LEVEL SUMMARY`

A level contains approximately 3–4 connected problems/questions around the same situation. A subject contains three levels built around the same situation while addressing different issues or progressively deeper analysis.

The key rule is:

> Students should discover which relationships/concepts are useful rather than being told which formula to substitute.

Difficulty increases through interacting concepts, variables, constraints and decisions, not by simply making arithmetic harder.

## 2. Product scope

### Current subjects

- Physics
- Economics

### Future subjects

The frontend currently shows Chemistry, Biology, History and Geography as "Coming Soon". These must not be treated as active backend domains until content and evaluation contracts exist.

### Current pages

- Home
- Streak
- Profile
- Settings
- About

The project/investigation experience is a protected application flow reached from the dashboard/subject area.

## 3. High-level system

```text
Browser
  |
  | HTTPS / JSON API
  v
Web Application
  |
  +--> Authentication/session service
  |
  +--> Project/content service
  |
  +--> Investigation/progress service
  |
  +--> Deterministic evaluation service
  |
  +--> Reward/badge/streak service
  |
  +--> Simulation adapter layer
  |
  +--> Feedback/FAQ service
  |
  v
PostgreSQL

Optional infrastructure:
  Redis/cache/rate limiting
  Object storage for content assets
  Observability/logging
```

Do not allow the browser to connect directly to PostgreSQL.

Do not let simulation code decide rewards.

Do not let an AI model decide authoritative correctness, XP, coins, badges, progress or leaderboard values.

## 4. Recommended technology direction

The exact framework can be chosen during implementation, but the architecture assumes:

- TypeScript for application services
- React-based frontend
- Node.js backend
- PostgreSQL as source-of-truth relational database
- Prisma or an equivalent typed migration ORM
- Docker for local/CI parity
- API contract described with OpenAPI
- automated unit, integration and end-to-end tests

For Physics simulation, use a browser-compatible simulation engine or an isolated simulation adapter. The supplied requirement mentions VPython or C++. Do not execute arbitrary C++ or Python supplied by users in the web server. If VPython is retained, isolate it from the privileged backend and define a narrow input/output contract.

## 5. Architectural boundaries

### Frontend owns

- rendering
- navigation
- input controls
- local transient UI state
- simulation visualization
- accessibility
- optimistic UI only where rollback is safe

### Backend owns

- authentication
- authorization
- project availability
- progress state
- answer submission
- evaluation
- rewards
- badges
- streak calculation
- leaderboard aggregation
- notes persistence
- feedback persistence
- server-side validation
- audit events

### Database owns

- durable state
- relational integrity
- unique constraints
- foreign keys
- transaction boundaries
- indexes
- migration history

### Content layer owns

- cases
- files
- levels
- questions
- hints
- accepted answers/rules
- explanations
- learning objectives
- simulation definitions
- consequences

Content should be versioned and validated before publication.

## 6. Request flow

Example answer submission:

```text
Browser
  -> POST /v1/investigations/{investigationId}/answers
  -> authenticate session
  -> authorize user owns investigation
  -> validate request schema
  -> load immutable content version
  -> evaluate deterministically
  -> transaction:
       record attempt
       update question state
       update progress
       append reward ledger entries
       update badges if criteria met
       update streak if applicable
  -> return authoritative result
  -> browser renders consequence/explanation
```

The browser must never calculate authoritative XP or coins.

## 7. Persistent case and file model

The case remains available through the level according to the content configuration. Files may contain text, tables, constraints and datasets.

The UI should preserve readable formatting:

- tables as actual tables
- numeric data with units
- file metadata
- clear file names
- accessible labels
- no requirement to re-open the same file repeatedly unless intended

A file can be represented as structured content rather than a single giant paragraph.

## 8. Simulation architecture

Use an adapter interface:

```text
SimulationDefinition
  -> input variables
  -> constraints
  -> derived quantities
  -> consequence rules
  -> visualization configuration
```

A simulation must produce deterministic outputs for the same input state.

Example:

```json
{
  "inputs": {
    "potentialA": 300,
    "potentialB": 100,
    "separationCm": 5,
    "chargeMicroC": 2
  },
  "derived": {
    "potentialDifference": 200,
    "electricField": 4000
  },
  "consequence": {
    "status": "STABLE",
    "messageKey": "system.stable"
  }
}
```

The simulation renderer may be visual, but its core calculations must be testable without the UI.

## 9. Physics vs Economics

The two domains must not be forced into one identical question evaluator.

### Physics

Typical progression:

- observe physical behavior
- identify physical quantity
- connect relationships
- calculate/predict
- alter variables
- test in simulation
- choose a safe/workable configuration

### Economics

Use the same investigation philosophy but domain-specific models:

- inspect reports/data
- identify the economic change/problem
- compare variables/trends
- connect indicators
- calculate or infer effects
- test a policy/business decision against constraints
- justify a decision from evidence

The shared contract is investigation-oriented reasoning, not shared formulas.

## 10. Reward architecture

The supplied product description distinguishes:

- XP: accurate performance
- Coins: correct answers
- badges: varied achievements

Implement rewards through an immutable ledger plus derived balance.

Never trust a client-provided reward value.

Example ledger:

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

A balance can be cached/denormalized, but ledger entries remain auditable.

## 11. Streak architecture

A streak should be calculated from server-side activity timestamps and a clearly defined local-date policy.

Define:

- what counts as activity
- timezone used for a user's day
- how missed days affect streak
- whether multiple activities in one day count once
- how backdated events are handled

Do not let the frontend increment streaks.

## 12. Leaderboard architecture

The leaderboard combines user data, but should expose only fields appropriate for the product.

Use a server-side ranking query/materialized projection if scale requires it.

Define tie behavior explicitly.

Do not expose sensitive account data.

## 13. Notes

Notes are user-owned data.

Requirements:

- authorization on every read/write
- length limits
- sanitization if rich text is ever introduced
- autosave with debounce if used
- conflict handling
- deletion support
- auditability for suspicious bulk operations

## 14. AI boundary

AI may assist with:

- optional explanations
- tutoring prompts
- content drafting
- feedback phrasing
- developer productivity

AI must not be the authoritative source for:

- correctness
- XP
- coins
- badge eligibility
- streak
- leaderboard score
- permissions
- database writes without deterministic validation

If AI is later added to the student experience, place it behind a dedicated service with:

- prompt/version tracking
- input/output size limits
- rate limits
- moderation/safety controls
- timeout/fallback behavior
- no direct database authority
- explicit data minimization

## 15. Security baseline

- TLS in production
- secure, HttpOnly, SameSite cookies for browser sessions where applicable
- password hashing with a modern password-hashing algorithm
- never store plaintext passwords
- CSRF protection where cookie authentication requires it
- strict server-side authorization
- schema validation on every external input
- parameterized queries/ORM
- rate limiting
- login abuse protection
- secure headers
- output encoding
- dependency scanning
- secret management
- structured security logging without passwords/tokens
- least privilege database credentials
- separate production credentials
- backups and restore testing

## 16. Data integrity

Important operations must be transactional.

Answer submission should be atomic:

`attempt + progress + rewards + badge changes + activity event`

If any part fails, the transaction must not partially award rewards.

Use idempotency keys for retried commands.

## 17. Observability

At minimum capture:

- request ID
- user ID where safe
- endpoint
- latency
- status code
- error category
- database timing
- evaluation version
- content version
- reward event ID

Do not log:

- passwords
- session tokens
- secrets
- unnecessary private notes
- raw sensitive user data

## 18. Scalability

Start as a modular monolith, not microservices.

Recommended internal modules:

```text
auth
users
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
notifications
audit
```

This gives strong boundaries without early distributed-system complexity.

Split services only when there is a demonstrated scaling, deployment or isolation reason.

## 19. Failure behavior

Every user-facing operation should have defined failure behavior.

Examples:

- answer request timeout -> user can retry with same idempotency key
- simulation error -> show last valid state and a recoverable message
- content unavailable -> do not create corrupt progress
- reward transaction failure -> do not display authoritative reward success
- leaderboard unavailable -> core investigation must remain usable
- optional AI unavailable -> fall back to deterministic explanation

## 20. Definition of done for architecture

The application is not ready for production until:

- migrations are reproducible
- API contracts are validated
- authorization tests exist
- answer evaluation is deterministic and tested
- reward calculations are transactional
- progress resume works
- content versions are immutable once used
- simulation calculations have automated tests
- database backups and restore are tested
- security checks pass
- end-to-end critical flows pass
- deployment can be reproduced from source
