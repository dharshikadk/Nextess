# Nextess Architecture Repository

This repository is the architecture and engineering rule book for Nextess.

## Current product direction

Nextess uses an **explore-first, account-optional onboarding model**:

`Open Nextess → Start Exploring → Experience the UI/UX → Try Projects → Decide whether to create an account`

A visitor is **not forced to log in or sign up before experiencing eligible parts of Nextess**. Login and signup remain available at any time.

## Purpose

These documents are the source of truth for human developers and AI coding agents. They define system boundaries, security, data integrity, API contracts, content structure, simulation rules, testing and collaboration rules.

## Rule priority

1. `docs/architecture/MASTER-ARCHITECTURE.md`
2. `docs/contracts/API-CONTRACT.md`
3. `docs/contracts/DATA-CONTRACT.md`
4. `docs/development/AI-AGENT-RULEBOOK.md`
5. ADRs
6. Content specifications
7. Existing implementation

If implementation conflicts with these documents, stop and resolve the conflict instead of silently changing behavior.

## Suggested repository

```text
nextess/
├── apps/
├── packages/
├── prisma/
├── content/
├── tests/
├── infra/
└── docs/
```

## First implementation order

1. Lock architecture and contracts, including anonymous exploration.
2. Create the application skeleton.
3. Set up PostgreSQL and migrations.
4. Implement anonymous sessions plus secure authentication.
5. Implement project/content APIs.
6. Implement investigation/progress APIs.
7. Implement deterministic evaluation.
8. Implement rewards, badges, streak and leaderboard.
9. Implement dashboard/profile/settings.
10. Implement investigation UI.
11. Implement Physics simulations.
12. Implement Economics investigation behavior.
13. Add observability, rate limits and end-to-end/security testing.
