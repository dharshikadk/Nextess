# Recommended Nextess Repository Skeleton

```text
nextess/
├── apps/
│   ├── web/
│   │   ├── src/
│   │   │   ├── app/
│   │   │   ├── components/
│   │   │   ├── features/
│   │   │   │   ├── dashboard/
│   │   │   │   ├── streak/
│   │   │   │   ├── profile/
│   │   │   │   ├── settings/
│   │   │   │   └── investigation/
│   │   │   └── lib/
│   │   └── tests/
│   │
│   └── api/
│       ├── src/
│       │   ├── modules/
│       │   ├── shared/
│       │   └── main.ts
│       └── tests/
│
├── packages/
│   ├── contracts/
│   ├── validation/
│   ├── evaluation/
│   ├── simulation-core/
│   └── ui/
│
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│
├── content/
│   ├── physics/
│   └── economics/
│
├── tests/
│   ├── e2e/
│   ├── security/
│   └── fixtures/
│
├── infra/
│   ├── docker/
│   └── deployment/
│
├── docs/
├── .github/
│   └── workflows/
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

## Important separation

Do not mix:

- React UI with database queries
- content authoring with application secrets
- simulation math with rendering
- reward calculation with UI
- migration files with generated output

This structure is a recommendation. Preserve the architectural boundaries even if a different framework requires different physical folders.
