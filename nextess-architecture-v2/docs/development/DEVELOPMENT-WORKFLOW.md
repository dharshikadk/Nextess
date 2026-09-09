# Development Workflow

## Branches

```text
main
feature/*
fix/*
architecture/*
```

## Pull request checklist

- architecture checked
- contracts checked
- tests added
- security checked
- migrations reviewed
- no secrets
- no debug bypass
- docs updated

## Database

Never edit an applied migration. Create a new migration.

## CI

Run:

1. lint
2. typecheck
3. unit tests
4. integration tests
5. migration validation
6. build
7. security/dependency checks
