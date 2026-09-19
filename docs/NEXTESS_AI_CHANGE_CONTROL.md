# Nextess — AI Collaboration & Change-Control Rules

## Purpose

This file prevents multiple AIs from changing the same product inconsistently.

## 1. Read order

Before working, an AI should read:
1. docs/NEXTESS_SOURCE_OF_TRUTH.md
2. docs/NEXTESS_SUBJECT_QUESTION_ARCHITECTURE.md
3. the architecture/spec file owned by its layer
4. relevant API/data contracts
5. existing implementation

## 2. Ownership

### Architecture AI
Owns cross-system architecture and contracts.

### Database AI
Owns:
- Prisma schema
- migrations
- SQL
- database constraints/indexes
- persistence design

### Frontend AI
Owns:
- UI
- UX
- components
- task renderers
- simulation rendering integration
- responsive/accessibility implementation

### Backend AI
Owns:
- API
- business logic
- authorization
- evaluation
- reward allocation
- progress
- streaks
- leaderboard logic

### Content/Mission AI
Owns:
- missions
- scenarios
- learning capsules
- subject-specific task content
- hints
- explanations
- evidence/resources

### Simulation AI
Owns:
- simulation implementation
- simulation renderer contract
- variables
- simulation behavior
- integration documentation

### Testing AI
Owns:
- unit/integration/E2E/regression validation

## 3. Database boundary

If a task explicitly says "do not touch the database", the AI must not modify:
- Prisma schema
- SQL schema
- migrations
- database seed files
- database constraints
- database indexes

It may document a database capability gap for the Database AI.

## 4. Contract change rule

If an AI changes something consumed by another layer, it must document:
- old contract
- new contract
- reason
- affected consumers
- compatibility impact
- migration requirement, if any

## 5. Subject extensibility rule

Never solve a subject-specific problem by duplicating the entire mission architecture.

Use:

**shared shell + subject-specific task registry/renderer/evaluator**

## 6. No silent behavior changes

Do not change:
- account flow
- anonymous exploration
- reward meaning
- mission progression
- simulation behavior
- existing working subject behavior
- API semantics

unless the task explicitly requires it.

## 7. Stop conditions

An AI must stop and report when:
- required repository files are missing
- a requested capability cannot be represented safely
- a database migration is required but the task forbids database changes
- an API contract is incompatible with an existing consumer
- an existing working feature would have to be broken
- requirements conflict and no higher-priority rule resolves the conflict

## 8. Definition of done

Every change must leave the repository in a state another AI can understand without relying on private conversation history.
