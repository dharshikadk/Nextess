# Nextess Database Engine

The complete database layer for Nextess, built from `the_frontend.txt` and `THE_DATABASE_RULES_AND_FOLLOW_UPS.txt`, then extended for subject-agnostic mission/simulation extensibility (Chemistry/Biology/Geography/History readiness). No mission content is invented — Physics and Economics each have one clearly-marked `[TEMPLATE]` mission showing exactly how real content plugs in later (see `SEED_TEMPLATE_GUIDE.md` and, for the full authoring contract, `MISSION_CONTENT_SPEC.md`).

**Read `VALIDATION_REPORT.md` first** for the original build's GitHub-access note and initial validation. **Read `CHANGE_SUMMARY.md`** for exactly what changed in the extensibility pass and why.

## Contents

```
sql/
  001_schema.sql                              -- full DDL: enums, tables, constraints, indexes, triggers (APPLIED & VALIDATED)
  002_seed_template.sql                       -- lookup data, subjects, concepts, badges, one placeholder mission per subject (APPLIED & VALIDATED)
  003_account_conversion.sql                  -- migrate_anonymous_session_to_user() stored procedure (APPLIED & VALIDATED)
  004_generic_simulation_type_and_state.sql   -- simulation_type lookup + user_simulation_state (APPLIED & VALIDATED)
prisma/
  schema.prisma                               -- Prisma ORM schema, 1:1 mapping of the applied SQL
  migrations/
    migration_lock.toml
    20260101000000_init/migration.sql                              -- baseline (= sql/001_schema.sql)
    20260115000000_generic_simulation_type_and_state/migration.sql -- = sql/004_...
ARCHITECTURE.md                -- ER architecture, relationship/anonymous/auth/reward/progress/versioning
                                   architecture, index strategy, data integrity (deliverable sections A, D-L)
MISSION_CONTENT_SPEC.md        -- the mission content contract a Content/Mission AI must follow (any subject)
SEED_TEMPLATE_GUIDE.md         -- step-by-step checklist for inserting a real mission later (superseded in
                                   detail by MISSION_CONTENT_SPEC.md, kept as a shorter quick-reference)
CHANGE_SUMMARY.md              -- what changed in the extensibility pass, why, and what's next
VALIDATION_REPORT.md           -- repo-access issue + everything actually executed and proven (original build)
```

## Quick start (in your real repo, with real internet access)

```bash
# 1. Point DATABASE_URL at your Postgres instance
export DATABASE_URL="postgresql://user:pass@host:5432/nextess"

# 2. Either let Prisma manage migrations from the schema:
npx prisma migrate dev --name init

# 3. ...or apply the hand-validated SQL directly (equivalent, already tested):
psql "$DATABASE_URL" -f sql/001_schema.sql
psql "$DATABASE_URL" -f sql/002_seed_template.sql
psql "$DATABASE_URL" -f sql/003_account_conversion.sql

# 4. Generate the Prisma client for your backend to import
npx prisma generate
```

## Design highlights

- **Anonymous-first**: visitors explore, try missions, and earn XP/coins with zero signup, via `AnonymousSession`. Converting to a real account is one transactional stored procedure that re-parents everything and recomputes balances from the immutable reward ledger — proven idempotent on retry.
- **Physics ≠ Economics, same backbone**: both ride `Subject → Mission → Level → Question`, but only Physics missions get `Simulation`/`SimulationVariable`/`SimulationRule` rows. Simulation "rules" are safe JSON conditions evaluated by backend code — never executable code stored in the database.
- **Nothing the frontend sends is trusted**: correctness, XP, coins, streaks, and completion are all backend-computed from an immutable `UserResponse` log and `RewardTransaction` ledger. Every reward transaction carries a unique idempotency key, so a duplicated "Submit" click cannot double-award anything — this was verified by actually triggering the duplicate and watching PostgreSQL reject it.
- **Content is versioned by row, not by UPDATE**: editing a published mission/level/question/file/simulation creates a new row; historical student attempts keep pointing at the exact version they experienced, forever.
