# Nextess Database

This directory is the database implementation for Nextess.

## Source of truth

The schema follows the repository's current Nextess data contract:

- PostgreSQL
- Prisma
- versioned project content
- Physics and Economics as active subjects
- Chemistry, Biology, Geography and History as future subject placeholders
- anonymous exploration sessions
- authenticated users and persistent progress
- deterministic/versioned evaluation data
- case files/resources
- simulation definitions, variables, consequences and **file placeholders**
- XP/KP, coins, streaks and badges
- idempotent reward ledger
- notes, feedback and audit events
- completion reports

The product contract explicitly says that the browser never connects directly to PostgreSQL and that authoritative rewards/evaluation remain server-side.

## Imported mission content

`content/nextess_10_missions.json` is the supplied 10-mission JSON package.

The seed importer maps each supplied mission into:

```text
Subject
  └── Project
       └── ProjectVersion
            ├── Level
            │    ├── Questions
            │    │    ├── Options
            │    │    ├── Hints
            │    │    └── EvaluationRule
            │    └── SimulationDefinition
            │         ├── SimulationVariable
            │         ├── SimulationConsequence
            │         └── SimulationAsset (PLACEHOLDER)
            └── CaseFiles
```

The supplied JSON package contains a mission-level challenge collection rather than a separate multi-level array. Therefore the importer preserves the supplied content as **one level containing the supplied challenges** instead of inventing additional levels.

## Simulation file placeholders

No executable simulation code is stored in PostgreSQL.

Each imported simulation receives a placeholder such as:

`simulations/<MISSION_ID>/v1/index.html`

with status `PLACEHOLDER`.

The future Simulation AI can replace that asset through the repository/object-storage workflow without changing the mission schema.

The database stores declarative configuration only:

- renderer key
- controls
- ranges
- units
- default values
- outputs
- states
- deterministic rule metadata

Do not put arbitrary Python/C++/JavaScript source into the database and execute it on the backend.

## Setup

1. Create PostgreSQL.
2. Copy `.env.example` to `.env`.
3. Install dependencies from this directory.
4. Run:

```bash
npm install
npm run generate
npm run migrate:deploy
npm run seed
```

For local development where creating a migration interactively is acceptable:

```bash
npm run migrate:dev
```

## Migration safety

- Never edit an already-applied migration.
- Add a new migration for every schema change.
- Published `ProjectVersion` rows are immutable by application policy.
- Content imports must preserve `contentChecksum`.
- Do not delete published content merely to replace it; create a new content version.
- Reward writes must use unique idempotency keys.
- User-owned data must always be queried through authenticated ownership checks.
- Anonymous sessions must be bounded, expiring and server-owned.
- Do not store secrets in `AuditEvent.metadata`.

## Database ownership

The Database AI owns:

- Prisma schema
- migrations
- indexes
- foreign keys
- constraints
- persistence structures
- content storage structures

Frontend, Backend, Content and Simulation AIs must treat this directory as a contract and report genuine capability gaps instead of silently changing it.
