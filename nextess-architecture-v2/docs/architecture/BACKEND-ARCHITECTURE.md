# Nextess Backend Architecture

## Style

Use a modular monolith.

```text
src/modules/
├── auth
├── anonymous-sessions
├── users
├── subjects
├── projects
├── investigations
├── evaluation
├── rewards
├── badges
├── streaks
├── leaderboard
├── notes
├── feedback
├── simulations
└── audit
```

Each module should separate:

`route/controller → validation → service/use-case → domain rules → repository → tests`

## Anonymous access

Public/anonymous commands must still pass through authorization policy.

A project may be anonymous-accessible while a specific feature inside it is authenticated-only.

## Authentication

Authentication is an optional transition, not the first requirement.

```text
anonymous → login/signup → authenticated
```

## Answer evaluation

Evaluator input:

- question definition
- answer
- simulation state if relevant
- content version
- evaluator version

Evaluator output:

- result
- normalized answer/result
- consequence
- explanation
- reward decision

## Transactions

Answer submission must be transactional for all authoritative state.

## External side effects

If future integrations require reliable events, use an outbox pattern:

`database transaction → outbox event → worker → external side effect`
