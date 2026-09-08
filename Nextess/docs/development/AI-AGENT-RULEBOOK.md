# Nextess AI Agent Rulebook

## Mission

You are one specialized engineer working inside a shared production codebase. You are not the sole owner of architecture.

## Non-negotiable rules

1. Read `README.md`, `MASTER-ARCHITECTURE.md`, `API-CONTRACT.md`, `DATA-CONTRACT.md` before changing architecture-sensitive code.
2. Inspect existing code before creating new files.
3. Do not rewrite working modules just because another structure looks cleaner.
4. Do not change API/database contracts silently.
5. Do not invent product requirements.
6. Do not put secrets in source control.
7. Do not trust client-side rewards, scores or permissions.
8. Do not allow AI output to become authoritative evaluation without deterministic validation.
9. Add tests with every meaningful feature.
10. Preserve backward compatibility unless a migration plan exists.
11. Keep commits focused.
12. Document non-obvious decisions.
13. Never modify published learning content in place.
14. Never execute untrusted user-provided code on the backend.
15. Do not bypass authentication/authorization for convenience.

## Before coding

Report:

- files inspected
- relevant architecture rules
- intended change
- contracts touched
- migration required? yes/no
- tests to add/update
- risks

## During coding

Prefer:

```text
small module
  -> typed input
  -> validation
  -> domain operation
  -> transaction
  -> typed output
  -> test
```

Avoid:

- giant controllers
- business logic in React components
- direct SQL scattered through routes
- database calls from UI components
- duplicated reward logic
- duplicated authorization logic
- magic strings for domain states

## Agent ownership boundaries

### Frontend agent

May modify:

- UI
- routing
- components
- frontend state
- API client

Must not decide:

- reward amount
- correctness
- permission
- streak
- authoritative progress

### Backend agent

May modify:

- routes/controllers
- services
- validation
- authorization
- domain logic

Must not redesign UI without an approved requirement.

### Database agent

Owns:

- schema
- indexes
- migrations
- integrity constraints

Must provide migration and rollback/forward-recovery notes.

### Content agent

Owns:

- cases
- files
- questions
- hints
- explanations
- simulation definitions

Must validate content against the content schema.

### Simulation agent

Owns:

- simulation math
- visualization adapter
- variable controls
- consequence calculation

Must expose deterministic, testable calculations.

### QA agent

Owns:

- test strategy
- regression suites
- integration/E2E coverage
- security test cases

## API change protocol

If an agent needs to change an API:

1. update API contract
2. update schema/types
3. update implementation
4. update tests
5. document migration/compatibility impact

## Database change protocol

Never edit a production migration that has already been applied.

Create a new migration.

For destructive changes:

- identify affected rows
- provide backup/restore strategy
- migrate in safe stages
- update application compatibility

## AI collaboration protocol

Every agent should leave a concise handoff:

```text
Completed:
- ...

Changed:
- ...

Contracts:
- ...

Tests:
- ...

Known limitations:
- ...

Next recommended task:
- ...
```

## Definition of done

A task is done only when:

- code is formatted/linted
- type checks pass
- tests pass
- authorization is tested where relevant
- error paths are handled
- migration exists if needed
- docs/contracts are updated if behavior changed
- no secrets or debug bypasses remain
