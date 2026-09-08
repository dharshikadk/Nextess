# Nextess Architecture Repository

This repository is the **architecture and engineering rule book** for Nextess.

Nextess is a real-world problem-solving learning platform for high-school Physics and Economics. Students investigate persistent cases, inspect information files, interact with simulations where appropriate, answer connected questions, test predictions, receive consequences and explanations, and finish each level with a learning summary.

## Purpose

These documents are the source of truth for human developers and AI coding agents. They define:

- system boundaries and responsibilities
- frontend/backend/database contracts
- security rules
- API rules
- data and content models
- simulation boundaries
- deterministic evaluation
- rewards and progression
- testing and deployment standards
- AI-agent collaboration rules

## Current evidence base

The architecture was derived from the two supplied project assets:

1. `PROBLEM TYPE DESCRIBTION-NEXTESS(1).txt`
2. `the frontend(1).txt`

The supplied assets describe the product behavior and UI direction, but **do not constitute an existing production repository**. No backend source, package manifest, database schema, deployment configuration, or complete repository was supplied for inspection. Therefore this blueprint explicitly marks implementation choices as architecture decisions rather than pretending they already exist.

## Rule priority

When implementing:

1. `docs/architecture/MASTER-ARCHITECTURE.md`
2. `docs/contracts/API-CONTRACT.md`
3. `docs/contracts/DATA-CONTRACT.md`
4. `docs/development/AI-AGENT-RULEBOOK.md`
5. ADRs
6. Content specifications
7. Existing implementation

If implementation conflicts with these documents, stop and resolve the conflict rather than silently changing behavior.

## Suggested GitHub workflow

Keep this architecture in the same Git repository as the application:

```text
nextess/
├── apps/
├── packages/
├── prisma/
├── content/
├── docs/
├── tests/
├── infra/
└── README.md
```

Commit architecture changes separately from feature changes where practical. Every major architecture change should have an ADR.

## First implementation order

1. Lock architecture and contracts.
2. Create monorepo/application skeleton.
3. Set up PostgreSQL, migrations and environment validation.
4. Implement authentication/session security.
5. Implement content/project read APIs.
6. Implement progress and answer submission APIs.
7. Implement deterministic evaluation and reward ledger.
8. Implement dashboard/profile/streak UI.
9. Implement project investigation UI.
10. Implement Physics simulation adapters.
11. Add Economics investigation behavior.
12. Add observability, rate limits, security tests and end-to-end tests.
