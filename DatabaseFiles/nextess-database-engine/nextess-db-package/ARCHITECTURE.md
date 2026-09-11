# Nextess Database Architecture

Persistent learning-state engine for Nextess. PostgreSQL 16 + Prisma. See `VALIDATION_REPORT.md` for how this was tested, `sql/` for the raw DDL that was actually run, `prisma/schema.prisma` for the ORM layer, and `SEED_TEMPLATE_GUIDE.md` for how to insert real mission content later.

## A. ER architecture — domains and how they connect

```
AUTHENTICATION                 CONTENT                         PHYSICS SIMULATION
────────────────               ─────────                        ──────────────────
User ──1:1── UserCredential    Subject ──1:N── Concept          Simulation ──N:1── Level
User ──1:1── UserSetting       Subject ──1:N── Mission          Simulation ──1:N── SimulationVariable
User ──1:N── UserSession       Mission ──1:1── MissionCase      Simulation ──1:N── SimulationRule
AnonymousSession ──1:1──       Mission ──1:N── Level                SimulationRule ──N:1──
  AnonymousSetting             Mission ──1:N── MissionFile           ConsequenceDefinition (lookup)
AnonymousSession ──0:1──       Level ──1:N── Question           Mission ──N:1── MissionProblemType (lookup)
  User (convertedToUser)       Level ──1:N── MissionFile
                                Question ──1:1── QuestionAnswerKey
                                Question ──1:N── QuestionOption ──1:1── QuestionOptionCorrectness
                                Question ──1:N── Hint
                                Question ──1:1── AnswerExplanation
                                Question ──N:M── Concept (via QuestionConcept)

LEARNING PROGRESS                                REWARDS                          ANALYTICS
──────────────────                               ─────────                        ──────────
User/Anon ──1:N── UserMissionProgress ──N:1──    User/Anon ──1:N──                User/Anon ──1:N── EventLog
  Mission                                          RewardTransaction              User/Anon ──1:N──
User/Anon ──1:N── UserLevelProgress ──N:1── Level Badge ──1:N── UserBadge           ConceptPerformance ──N:1── Concept
User/Anon ──1:N── UserQuestionProgress ──N:1──                                    User/Anon ──1:N──
  Question                                                                          MistakeRecord ──N:1── Question
User/Anon ──1:N── UserResponse ──N:1── Question                                   User ──1:N──
User/Anon ──1:N── HintUsage ──N:1── Hint                                            UserPerformanceSnapshot
User/Anon ──1:N── LevelCompletion ──N:1── Level
User/Anon ──1:N── UserActivity
User/Anon ──1:N── StreakDay

USER INPUT
──────────
User/Anon ──1:N── Feedback
```

"User/Anon" denotes the **actor pattern** used on every progress/history/reward table: both `user_id` and `anonymous_session_id` are nullable foreign keys, guarded by a `CHECK` constraint that exactly one is set (see section E). This is how the same tables serve both logged-in and anonymous learners without duplicate parallel schemas.

## B & C. PostgreSQL schema / Prisma schema

See `sql/001_schema.sql` (applied and validated — 40 tables, 13 enums) and `prisma/schema.prisma` (1:1 mapping, see `VALIDATION_REPORT.md` for why it wasn't run through the Prisma CLI in this sandbox).

## D. Relationship explanation

- **User → Mission Progress**: `UserMissionProgress.userId → User.id` (nullable; anonymous alternative is `anonymousSessionId`). One row per (owner, mission) — enforced by `uq_ump_user_mission` / `uq_ump_anon_mission` partial unique indexes — so re-entering a mission updates the same row rather than creating duplicates.
- **Mission → Levels**: `Level.missionId → Mission.id`, `ON DELETE CASCADE`. A mission row is a specific *version*; its levels belong to that exact version (see section I).
- **Level → Questions**: `Question.levelId → Level.id`, `ON DELETE CASCADE`, ordered by `questionNumber`/`displayOrder`.
- **Question → Concepts**: many-to-many via `QuestionConcept`, so a question like "Electric Field + Potential Difference + Geometry" links to all three `Concept` rows independently, feeding `ConceptPerformance` analytics per concept, not per question.
- **Question → Hints**: `Hint.questionId → Question.id`; usage is tracked separately in `HintUsage` so the *definition* of a hint (content, cost) never conflates with *who used it and when*.
- **Question → Responses**: `UserResponse.questionId → Question.id`, `ON DELETE RESTRICT` (you cannot delete a question that has real student history — you archive it instead by creating a new version).
- **Mission → Files**: `MissionFile.missionId → Mission.id`, optionally further scoped to one `levelId`. Every mission additionally gets a `CONCEPT_BRIEF`-type file (a plain-language overview of the concepts in play) per the frontend spec's file requirement.
- **Physics Mission → Simulation**: `Simulation.missionId`/`levelId → Mission.id`/`Level.id`. Economics missions simply never get a `Simulation` row — no shared/forced structure.
- **Simulation → Variables**: `SimulationVariable.simulationId → Simulation.id`; one row per controllable variable (name, unit, min/max/step/default) — exactly the "variable controllers" the frontend renders.
- **Simulation → Rules**: `SimulationRule.simulationId → Simulation.id`; `conditions` is a safe JSON expression (e.g. `{"op":">","left":"electricField","right":"maximumField"}`), evaluated by backend code — never executable code stored in the database (see section G of the source spec / `NEVER store arbitrary executable code`).
- **User → Rewards**: `RewardTransaction.userId → User.id`, immutable ledger; `User.xp`/`User.coins` are denormalized totals that must only ever be derived by summing this ledger (see section G below).
- **User → Badges**: `UserBadge.userId → User.id`, `badgeId → Badge.id`; `Badge.criteria` is declarative JSON evaluated by a backend badge-awarding service, not hardcoded frontend logic.

## E. Anonymous architecture

- `AnonymousSession` stores only `session_token_hash` (never the raw token — the browser holds the opaque token, the server holds a salted hash of it) plus `expires_at`.
- Every progress/history/reward table carries `anonymous_session_id` alongside `user_id`, both nullable, with a `CHECK` constraint (`ck_*_owner`) enforcing **exactly one** is populated. This was verified directly: inserting a row with both set, or with neither set, is rejected by PostgreSQL itself — not just application code (see `VALIDATION_REPORT.md`, tests 8–9).
- **Conversion**: `migrate_anonymous_session_to_user()` (in `sql/003_account_conversion.sql`) runs as a single transaction that:
  1. Locks the `AnonymousSession` row (`FOR UPDATE`) and checks `converted_to_user_id` — if already converted, it no-ops (idempotent, safe to retry).
  2. Re-parents every progress/history/reward/badge/performance row from `anonymous_session_id` to `user_id`, skipping anything the user already has natively (e.g. if they'd started the same mission anonymously *and* logged in on another device) to avoid duplicate progress rows.
  3. **Recomputes `User.xp`/`User.coins` directly from the now-merged `reward_transaction` ledger** rather than adding numbers — this is what makes double-counting structurally impossible, even on retry.
  4. Stamps `AnonymousSession.converted_to_user_id`/`converted_at` last, which is the gate the next call checks.
  - This was run against real seeded data and re-run a second time to confirm the no-op behavior (`VALIDATION_REPORT.md`, tests 11–12).

## F. Authentication architecture

- `User` holds profile + gameplay state only (name, username, email, grade, xp, coins, streak, level). No secret ever lives here.
- `UserCredential` is a separate 1:1 table holding `password_hash`/`password_algo`/lockout counters, `ON DELETE CASCADE` from `User`. A "get my profile" query never has a reason to touch this table, so it structurally cannot leak a hash.
- `UserSession` holds hashed refresh tokens with `expires_at`/`revoked_at`, letting a device's session be revoked independently of the account itself.
- `AnonymousSession` is a parallel, much lighter identity concept (see section E) — no personal information required to explore the app.

## G. Reward architecture

- `RewardTransaction` is an **immutable, append-only ledger** — `type` (`XP`/`COINS`/`BADGE`), signed `amount` (hint costs are negative XP transactions), `source` (a closed enum of the real-world reasons a transaction can exist), and `reference_id` (which question/level/mission/badge caused it).
- `User.xp`/`User.coins` are convenience running totals. **The rule enforced by this design is: never `UPDATE app_user SET xp = xp + 10` from an API handler.** Every credit/debit is inserted into `reward_transaction` first (inside the same DB transaction as the triggering `UserResponse`/`HintUsage` insert), and the running total is updated from that same transaction. This means the ledger can always be replayed to audit or repair a user's balance — which is exactly what account-conversion's balance recomputation relies on.
- **Idempotency**: every `RewardTransaction` carries a `idempotency_key` with a `UNIQUE` constraint, computed deterministically by the backend from the real-world action (e.g. `user:<id>:question:<id>:attempt:<n>:xp`). A retried "Submit Answer" click that reaches the backend twice produces the same key both times; the second `INSERT` collides on the unique index and is rejected before it can double-award anything. This was proven directly (`VALIDATION_REPORT.md`, test 7) — not just described.
- XP and coins are tracked as genuinely separate concepts per the spec (XP = accurate performance; coins = correct answers / hint currency) — they are never merged into one "points" field anywhere in the schema.
- The **leaderboard** is not a maintained table — it's `SELECT ... FROM app_user ORDER BY xp DESC` (or coins/level), backed by the partial indexes `idx_app_user_xp_desc` / `idx_app_user_coins_desc` / `idx_app_user_level_desc` (`WHERE is_active`, confirmed present in `pg_indexes`). Anonymous sessions are never included in this query because `app_user` only contains authenticated accounts — anonymous users structurally cannot appear on the persistent global leaderboard unless a future product rule explicitly changes this design.

## H. Progress architecture (resuming after leaving)

- `UserMissionProgress` tracks `status` (`NOT_STARTED`/`IN_PROGRESS`/`COMPLETED`), plus `currentLevelId`/`currentQuestionId` pointers, so re-opening a mission takes the student straight back to where they left off.
- `UserLevelProgress` and `UserQuestionProgress` track finer-grained resumption (which question index within a level, attempt/hint counts) without needing to replay the full `UserResponse` history on every page load.
- Because these are separate from the immutable `UserResponse` log, "current state" and "full history" never fight each other: progress rows can be recomputed/repaired from the response log at any time if they ever drift.

## I. Versioning architecture

Rather than a parallel `MissionVersion`/`LevelVersion`/... shadow table for every content type (which the spec explicitly warns against over-building — section 42, "do not create hundreds of unnecessary tables"), versioning is done **in the same table** via a `(slug, version)` pattern used identically on `Mission`, `Level`, `Question`, `MissionFile`, and `Simulation`:

- Editing content never runs an `UPDATE` on a published row. It **inserts a new row** with the same `slug`, `version + 1`, `is_current = true`, and flips the old row's `is_current` to `false` (a partial unique index — `uq_mission_one_current_per_slug` etc. — guarantees only one row per slug is ever marked current).
- Every child row (`Level.missionId`, `Question.levelId`, ...) and every student history row (`UserResponse.questionId`, `UserMissionProgress.missionId`, ...) points at the **exact row id** of the version that was live at the time — not at the logical slug. So changing a question later can never retroactively change what a historical attempt is understood to have been answering, because the old row (and its id) still exists, unchanged, forever (or until an explicit archival/retention policy says otherwise).
- `previous_version_id` self-references let you walk a content item's edit history if needed.

## J. Index strategy

| Need | Index |
|---|---|
| User lookup by login | `uq_app_user_username`, `uq_app_user_email` (unique) |
| Mission lookup for the home page | `idx_mission_subject_current` (partial: `is_current AND status='PUBLISHED'`) |
| Active progress (resume) | `idx_ump_user_active` (partial: `status='IN_PROGRESS'`) |
| Question responses by question (analytics) | `idx_ur_question` |
| Leaderboard (xp/coins/level) | `idx_app_user_xp_desc`, `idx_app_user_coins_desc`, `idx_app_user_level_desc` (all partial: `WHERE is_active`) |
| Activity / streak calendar | `idx_ua_user_date`, `idx_ua_anon_date`; `uq_sd_user_date`/`uq_sd_anon_date` for O(1) day lookups |
| Anonymous sessions | `uq_anon_session_token` (unique, looked up on every anonymous request) |
| Event stream by actor/time, by type/time | `idx_event_log_user_time`, `idx_event_log_anon_time`, `idx_event_log_type_time` |

All of the above exist in the applied database and were confirmed via `pg_indexes` (see `VALIDATION_REPORT.md`, test 13).

## K. Data integrity

- **Foreign keys**: every child→parent relationship is a real FK. Deletion behavior is deliberate per relationship: `CASCADE` for pure ownership (delete a `Mission`, its `Level`/`MissionFile`/`Simulation` rows go with it), `RESTRICT` wherever a row has real student history pointing at it (`Question`, `Level`, `Mission` from progress/response tables — you archive content, you don't delete it out from under history), `SET NULL` where losing the link is acceptable (`EventLog.userId`, `Feedback.userId` if an account is later deleted).
- **Unique constraints**: content slugs are unique per (parent, slug, version); "current" version is unique per slug via partial unique indexes; reward idempotency keys are globally unique; one progress row per (owner, mission/level/question).
- **CHECK constraints**: the actor-pattern `ck_*_owner` constraints (verified directly against real inserts, see tests 8–9) plus non-negative guards on `xp`/`coins`/`streak`/reward amounts and sane `min <= max` on simulation variable ranges.
- **Cascading behavior**: summarized above; the general rule is *cascade ownership, restrict history*.
- **Nullable relationships**: `userId`/`anonymousSessionId` (actor pattern), `Level.currentQuestionId` before a student starts answering, `MistakeRecord.conceptId` if a question isn't tagged with one.
- **Transaction boundaries**: every multi-row write that must be atomic (answer submission → response + progress update + reward transaction + balance update; account conversion) is documented as "runs in one DB transaction" and, for account conversion, is implemented as an actual stored procedure rather than left as a hopeful convention in application code.

## L. Seed architecture

See `sql/002_seed_template.sql` (already run) and `SEED_TEMPLATE_GUIDE.md` for the full walkthrough of adding real content later. Summary of what's seeded:
- Lookup data: 6 `ConsequenceDefinition` codes, 8 `MissionProblemType` codes.
- 6 `Subject` rows (Physics/Economics `AVAILABLE`, the other four `COMING_SOON`), matching the home page spec exactly.
- 6 `Concept` rows (3 physics, 3 economics) as examples of the concept-tagging pattern.
- **One placeholder Physics mission** (`template-physics-mission`, status `DRAFT`) with a full 3-level structure, a concept-brief file, a level-scoped engineering-report file, a working `Simulation` with one variable and one deterministic rule referencing a real `ConsequenceDefinition`, and one fully-wired question (option, correctness, answer key, hint, explanation, concept tag).
- **One placeholder Economics mission** (`template-economics-mission`, status `DRAFT`) with the same 3-level shape, a concept-brief file, a level-scoped economic-report file, and one numeric-answer question — deliberately with **no** `Simulation` row, proving the two subjects are not forced into the same content shape.
- 3 example `Badge` rows.

Every placeholder value is literally prefixed `[TEMPLATE]` so nothing here can be mistaken for real educational content when you come back to replace it.
