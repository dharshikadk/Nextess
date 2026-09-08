# Nextess Backend Architecture

## Style

Use a modular monolith.

Suggested structure:

```text
src/
├── app/
├── config/
├── modules/
│   ├── auth/
│   ├── users/
│   ├── subjects/
│   ├── projects/
│   ├── investigations/
│   ├── evaluation/
│   ├── rewards/
│   ├── badges/
│   ├── streaks/
│   ├── leaderboard/
│   ├── notes/
│   ├── feedback/
│   ├── simulations/
│   └── audit/
├── shared/
│   ├── errors/
│   ├── validation/
│   ├── auth/
│   └── observability/
└── main.ts
```

Each module should separate:

```text
route/controller
service/use-case
domain rules
repository
schema/types
tests
```

Do not make repositories the place for business decisions.

## Command/query separation

Reads:

- get dashboard
- get project
- get investigation
- get leaderboard

Commands:

- register
- login
- start investigation
- submit answer
- request hint
- reveal answer
- complete level
- update profile
- save note

Commands must validate current state.

## Answer evaluation

Evaluator input:

```text
question definition
student answer
simulation state if applicable
content version
attempt metadata
```

Evaluator output:

```text
correct/incorrect/partial if supported
normalized result
consequence
explanation reference
reward decision
```

Evaluation must be deterministic for the same versioned input.

## Transactions

At minimum, answer submission should use one transaction for all authoritative changes.

## Background jobs

Avoid jobs until needed. Suitable future jobs:

- badge recalculation
- leaderboard materialization
- analytics aggregation
- email/notification delivery

Never move a correctness-critical write into an unreliable background job without a durable command/outbox design.

## Outbox pattern

If external side effects are added, use:

```text
database transaction
  -> domain change
  -> outbox event
worker
  -> external side effect
```

This prevents lost events.
