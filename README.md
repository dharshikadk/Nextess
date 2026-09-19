# Nextess

## Architecture Source of Truth

All AI agents and contributors working on Nextess must read the canonical product and architecture rules before making changes.

### Canonical documents

- [NEXTESS_SOURCE_OF_TRUTH.md](docs/NEXTESS_SOURCE_OF_TRUTH.md) — product behavior, shared architecture, gamification, engagement, account flow, mission model, simulations, AI boundaries, and non-negotiable rules.
- [NEXTESS_SUBJECT_QUESTION_ARCHITECTURE.md](docs/NEXTESS_SUBJECT_QUESTION_ARCHITECTURE.md) — subject-specific question/task systems and renderer/evaluator extension model.
- [NEXTESS_AI_CHANGE_CONTROL.md](docs/NEXTESS_AI_CHANGE_CONTROL.md) — AI ownership, cross-layer contracts, stop conditions, and change-control rules.

### Important

Nextess uses a **shared mission architecture with subject-specific question/task systems**. Physics, Economics, Chemistry, Biology, Geography, and History are not required to use identical question types.

The existing database architecture remains owned by the Database AI. The source-of-truth documents above describe product and cross-layer rules; they do not authorize non-database agents to modify the database schema.

Before implementing a change, preserve existing working behavior and modify only the layer required by the stated requirement.
