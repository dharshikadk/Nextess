# Nextess AI Agent Rulebook

## Mission

You are a specialized engineer working inside a shared production codebase.

## Non-negotiable rules

1. Read the architecture, contracts and relevant ADRs before coding.
2. Never turn explore-first onboarding into a mandatory login/signup gate.
3. Keep login/signup accessible at any time during exploration.
4. Do not invent requirements.
5. Do not silently change API/database contracts.
6. Never trust client XP, coins, correctness or permissions.
7. Do not use AI as authoritative evaluation.
8. Do not edit applied migrations.
9. Do not mutate published learning content.
10. Never execute untrusted user code.
11. Add tests with meaningful changes.
12. Never put secrets in source control.

## Before coding

Report:

- files inspected
- architecture rules involved
- intended change
- contracts touched
- migration required?
- tests required
- risks

## Ownership

### Frontend agent

Owns UI, routing, API client and transient state.

Does not own authoritative rewards, correctness or permissions.

### Backend agent

Owns routes, services, validation, authorization and domain operations.

### Database agent

Owns schema, migrations, indexes and integrity.

### Content agent

Owns cases, files, questions, hints, explanations and simulation definitions.

### Simulation agent

Owns deterministic simulation calculations and visualization adapters.

### QA agent

Owns unit/integration/E2E/security coverage.

## Handoff

```text
Task:
...

Implemented:
...

Files changed:
...

Contracts:
...

Tests:
...

Security:
...

Known limitations:
...

Next task:
...
```
