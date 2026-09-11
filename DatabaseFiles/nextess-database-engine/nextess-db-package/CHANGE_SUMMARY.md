# Change Summary — Subject-Agnostic Mission Extensibility Pass

This document covers **only** the changes made in this pass, on top of the already-existing, already-validated Nextess database engine. It does not repeat the original build — see `README.md`/`ARCHITECTURE.md`/`VALIDATION_REPORT.md` for that.

## 1. What was inspected first

Before changing anything, the live database from the previous build was re-connected to and inspected directly (not assumed from memory):

- Confirmed all 40 tables and the `nextess` database were intact after the sandbox restarted.
- Confirmed the 6 `subject` rows already exist exactly as required: `PHYSICS`/`ECONOMICS` = `AVAILABLE`, `CHEMISTRY`/`BIOLOGY`/`HISTORY`/`GEOGRAPHY` = `COMING_SOON`.
- Grepped every table named `%mission%` and confirmed **none** of them are subject-specific (`mission`, `mission_case`, `mission_file`, `mission_problem_type`, `user_mission_progress` — all generic, all keyed by `subject_id`/`mission_id`, never `physics_mission` or similar).
- Confirmed `simulation` was already generic (`engine` varchar + `configuration` jsonb, no per-subject simulation table).
- Captured exact row counts for every content/user/reward table as a before-snapshot, specifically so the after-migration counts could be diffed to prove zero data loss.

**Conclusion of inspection: the core requirement — one reusable Mission structure across all subjects, no per-subject tables — was already satisfied by the existing design.** This pass therefore made the smallest possible additive change to fully satisfy the newer, more specific requirements around simulation typing and generic simulation state, rather than re-architecting anything.

## 2. What was changed, and why

### 2.1 New migration: `20260115000000_generic_simulation_type_and_state`

Applied on top of the existing baseline (retroactively formalized as `prisma/migrations/20260101000000_init`, matching what was already live). Two additive pieces:

**a) `simulation_type` lookup table + `simulation.type_code` column**

*Why:* `simulation.engine` is a frontend-renderer key (e.g. `'electrostatics-2d'`) — necessary, but it conflates "which UI component renders this" with "what logical category of simulation this is." The requirement explicitly asks for "simulation type" as a first-class, subject-agnostic concept. Rather than an enum (which would need a migration every time a new category is needed) or a new table per subject (explicitly disallowed), this follows the **exact pattern already established** by `consequence_definition` and `mission_problem_type`: a small lookup table, extended by inserting rows.

*What was added:* 7 seed rows — one per subject's simulation style (`PHYSICS_INTERACTIVE_MODEL`, `ECONOMIC_GRAPH_MODEL`, `CHEMISTRY_REACTION_LAB`, `BIOLOGY_ECOSYSTEM_MODEL`, `GEOGRAPHY_MAP_INTERACTION`, `HISTORY_TIMELINE_INVESTIGATION`) plus one fallback (`GENERIC_INTERACTIVE`). Adding a 7th subject's simulation style later is one `INSERT`, not a migration.

*Backward compatibility:* `type_code` is a **nullable** FK column added via `ALTER TABLE`. The one pre-existing `simulation` row (`sim-level-1`, from the earlier seed) was backfilled to `PHYSICS_INTERACTIVE_MODEL` in the same migration so no row is left ambiguous. No existing column was altered or dropped.

**b) `user_simulation_state` table**

*Why:* the requirements explicitly list "simulation data/state" as a concept the design should support, generically, across all subjects (a Chemistry student's in-progress reagent settings should be resumable exactly like a Physics student's in-progress voltage settings). This did not previously exist as a distinct concept — student "state" only existed as either the static authored `simulation.configuration` or the final submitted `user_response.answer`, neither of which is the right place for *transient, mid-interaction* controller state.

*What was added:* one new, fully generic table, following the same actor-pattern (`user_id`/`anonymous_session_id`, `CHECK` constraint, partial unique indexes) used by every other progress table in the schema — no new pattern was invented. One row per `(actor, simulation)`, storing a `state` JSONB blob and the `last_consequence_code` reached.

*Backward compatibility:* brand new table; touches nothing existing.

### 2.2 `prisma/schema.prisma`

- Added `SimulationType` model, mapped to `simulation_type`.
- Added `typeCode`/`type` relation to the existing `Simulation` model (additive fields only — no existing field on `Simulation` was removed or renamed).
- Added `UserSimulationState` model, mapped to `user_simulation_state`, with relations wired into `User`, `AnonymousSession`, and `ConsequenceDefinition`.
- **Nothing else in the schema was touched.** `User`, `UserCredential`, `UserSession`, `AnonymousSession`, `Mission`, `Level`, `Question`, all progress/reward/analytics models are byte-for-byte the same as before this pass.

### 2.3 Migrations folder formalized

Previously, schema changes in this environment were applied as raw SQL directly against Postgres (documented in `VALIDATION_REPORT.md`, because this sandbox's network cannot reach Prisma's engine-binary host). This pass introduces the standard Prisma migrations folder layout so the project has a proper migration history going forward:

```
prisma/migrations/
  migration_lock.toml
  20260101000000_init/migration.sql                              -- the already-applied baseline (= sql/001_schema.sql)
  20260115000000_generic_simulation_type_and_state/migration.sql -- this pass's change
```

`sql/004_generic_simulation_type_and_state.sql` mirrors the same migration for anyone applying it by hand instead of via `prisma migrate deploy`.

### 2.4 `MISSION_CONTENT_SPEC.md` — created

New file (this was previously referenced by name in memory as a planned deliverable but had not yet been written in this rebuilt sandbox session). Full content contract: subject, mission metadata, difficulty, mission/problem type, scenario, stages/levels, questions, question types, evaluation/answers, hints, resources/files, rewards, simulations (type/configuration/variables/rules), simulation state, ordering, ID/relationship rules, required-vs-optional field tables, and an explicit validation checklist. Also includes a naming-mapping table (§0) reconciling the generic terms used in requirements ("MissionStage", "Resource/DataFile", "Evaluation/Answer") with this schema's actual table names (`level`, `mission_file`, `question_answer_key`/`question_option`/`answer_explanation`) — **so no renaming of working, already-validated tables was needed to satisfy the documentation requirement.**

## 3. What was deliberately NOT changed

Per the explicit "preserve existing architecture" instruction, none of the following were touched in this pass:

- `app_user`, `user_credential`, `user_session`, `user_setting`, `anonymous_session`, `anonymous_setting` (auth/identity)
- `user_mission_progress`, `user_level_progress`, `user_question_progress`, `user_response`, `hint_usage`, `level_completion`, `user_activity`, `streak_day` (progress)
- `reward_transaction`, `badge`, `user_badge` (rewards)
- `event_log`, `concept_performance`, `mistake_record`, `user_performance_snapshot` (analytics)
- `subject`, `mission`, `mission_case`, `level`, `question`, `question_answer_key`, `question_option`, `question_option_correctness`, `hint`, `answer_explanation`, `question_concept`, `mission_file`, `concept` (existing content tables — extended with new *related* tables, never altered themselves)
- `mission_problem_type`, `consequence_definition` (existing lookup tables — reused as-is, referenced by the new `user_simulation_state.last_consequence_code`)
- The `migrate_anonymous_session_to_user()` stored procedure
- All previously-existing rows of data (verified via before/after row-count diff — see §4)

No table was renamed, no column was dropped, no enum value was removed, no existing constraint was loosened or tightened.

## 4. Verification performed this pass

All run against the live PostgreSQL 16 instance, not asserted from memory:

| Check | Result |
|---|---|
| Baseline row counts captured for 11 key tables before the migration | subject=6, mission=2, level=6, question=2, simulation=1, simulation_variable=1, simulation_rule=1, mission_file=4, app_user=1, anonymous_session=1, reward_transaction=2 |
| New migration applied with `ON_ERROR_STOP=1` | 0 errors — `CREATE TABLE` ×2, `ALTER TABLE` ×1, `CREATE INDEX` ×3, `CREATE TRIGGER` ×1, `INSERT 0 7`, `UPDATE 1` |
| Same row counts re-queried after the migration | **identical to baseline, exactly** — zero data loss/mutation on any pre-existing table |
| Backfilled `simulation` row now resolves `type_code → simulation_type.label` | `sim-level-1` → `Physics Interactive Model` |
| All 7 `simulation_type` rows present, one per subject + fallback | confirmed via direct query |
| `user_simulation_state` actor-pattern CHECK constraint | tried inserting a row with **both** `user_id` and `anonymous_session_id` set → rejected with `violates check constraint "ck_uss_owner"`, same convention as every other progress table |

## 5. What the Mission AI should do next

1. **Read `MISSION_CONTENT_SPEC.md` in full before writing any INSERTs.** It is the authoritative contract; this change-summary document is background, not the spec itself.
2. For a first Chemistry/Biology/Geography/History mission: follow §2–§9 of the spec exactly as if it were Physics or Economics — pick (or add, if genuinely missing) a `mission_problem_type` row, write the mission/case/levels/files/questions/hints/explanations in one transaction, `status = 'DRAFT'`.
3. Only add a `simulation` row if that mission's stage genuinely needs an interactive component; pick the matching `simulation_type` code from §7's table, or add a new lookup row if none fits — never leave `type_code` null out of laziness, and never invent a new simulation table.
4. Do not flip any `subject.status` from `COMING_SOON` to `AVAILABLE` — leave that for a human/product decision once there's enough reviewed `DRAFT`/`PUBLISHED` content.
5. Do not touch `user_simulation_state`, `user_response`, `reward_transaction`, or any other runtime table — those are populated by the backend at play-time, never by content authoring.
6. If, while authoring, the Mission AI finds a genuine gap this contract doesn't cover (a field, question type, file type, or simulation concept that truly cannot be expressed with what exists), **it should stop and flag the specific gap** rather than force-fitting it into an unrelated field — that is the "capability change" case called out in the contract's opening rule, and it needs a deliberate schema decision, not a workaround baked into content data.
