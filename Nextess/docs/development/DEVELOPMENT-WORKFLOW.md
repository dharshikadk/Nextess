# Nextess Development Workflow

## Branches

Recommended:

```text
main
  ├── feature/*
  ├── fix/*
  ├── chore/*
  └── architecture/*
```

## Pull request checklist

- [ ] Requirement linked
- [ ] Architecture impact checked
- [ ] API contract updated if needed
- [ ] Data contract/migration updated if needed
- [ ] Tests added
- [ ] Security implications checked
- [ ] No secrets
- [ ] No debug bypass
- [ ] Error handling complete
- [ ] Docs updated
- [ ] Backward compatibility considered

## Commit guidance

Prefer focused commits:

```text
feat(api): add investigation answer command
test(evaluation): cover electric-field limit rule
docs(architecture): define reward ledger
fix(auth): reject invalid session
```

## Local environment

Recommended services:

```text
web
api
postgres
optional redis
```

Docker Compose can provide local parity.

## Environment variables

Maintain `.env.example` containing names but no secrets:

```text
DATABASE_URL=
SESSION_SECRET=
APP_BASE_URL=
```

Add provider-specific variables only when actually used.

## Database workflow

```text
edit schema
 -> create migration
 -> run migration locally
 -> generate client/types
 -> run tests
```

Never manually patch a generated client to fix schema errors.

## CI

CI should run:

1. install
2. lint
3. typecheck
4. unit tests
5. integration tests
6. migration validation
7. build
8. dependency/security checks
