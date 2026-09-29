# Nextess Production Operations

## Runtime topology

```
GitHub
  ↓
CI validation
  ↓
Build artifacts
  ↓
Staging
  ↓
Health/readiness verification
  ↓
Production
```

Nextess remains a modular frontend + backend + PostgreSQL application. Do not introduce microservices, queues, Kubernetes, or subject-specific databases without demonstrated operational need.

## Health

- `GET /health` confirms the API process is running.
- `GET /ready` checks PostgreSQL reachability and returns HTTP 503 when the service is not ready.

Production deployment should not receive traffic until readiness succeeds.

## Security baseline

The backend currently applies:
- request correlation IDs;
- JSON request-size limits;
- CORS with an explicit frontend origin;
- SameSite/HttpOnly session cookies;
- security headers;
- state-changing Origin validation;
- request rate limits;
- sanitized client-facing internal errors.

Rate limiting is intentionally in-process for the current single-service deployment. If Nextess becomes multi-instance, replace it with shared infrastructure rather than pretending the local bucket is globally authoritative.

## Database backup/recovery

Production PostgreSQL must have:
1. automated backups;
2. documented retention;
3. a tested restore procedure;
4. a restore drill before production launch;
5. a migration rollback/forward-fix procedure.

A backup is not considered verified until a restore has succeeded in an isolated environment.

The application repository does not contain provider-specific backup credentials or destructive restore commands. Those remain deployment-operator responsibilities.

## Deployment procedure

1. Open a PR and wait for CI.
2. Validate frontend TypeScript/build.
3. Validate Prisma schema and migrations.
4. Run backend tests.
5. Run mission content validation.
6. Deploy to staging.
7. Run health/readiness and browser smoke tests.
8. Apply reviewed production migrations.
9. Deploy backend/frontend.
10. Verify readiness and the mission catalogue.
11. Monitor error rate, latency, authentication failures, answer submissions and simulation failures.

## Rollback

Prefer a forward fix for database changes. Application deployment rollback must only use a previous build that is compatible with the current schema. Never roll back a schema blindly when a migration has removed or changed required data.
