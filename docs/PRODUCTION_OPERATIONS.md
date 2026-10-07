# Nextess Production Operations

## Release flow

1. Build immutable backend/frontend images.
2. Validate the candidate with CI.
3. Run the database migration job exactly once with `prisma migrate deploy`.
4. Run controlled mission/content deployment separately when required.
5. Verify `/health` and `/ready`.
6. Start application containers and route traffic only after readiness succeeds.
7. Never run seed or migrations from application startup.

## Secrets

Production database credentials, session configuration, API origins and other secrets must come from the deployment secret manager/environment. Do not commit `.env` files or real credentials.

## Database network

PostgreSQL is on the private application network and has no public port mapping in the production compose configuration. Only the frontend public port is exposed; the backend is reachable through the internal network/reverse proxy topology.

## Backups

Recommended minimum operational policy:

- Daily encrypted PostgreSQL custom-format backup.
- Retain at least 7 daily and 4 weekly backups.
- Store backups outside the primary database host/account.
- Monitor backup job success and storage capacity.
- Perform a restore drill at least monthly and after major migration changes.

Example:
`pg_dump -Fc "$DATABASE_URL" > nextess-YYYY-MM-DD.dump`

Restore verification should use an isolated database and `pg_restore --exit-on-error`; validate row counts, foreign keys, ownership constraints and representative mission/runtime flows before treating the backup as valid.

## Migration safety

- Every schema change gets a timestamped Prisma migration.
- Migration preflight checks must fail before destructive changes when legacy data violates the new invariant.
- Deploy migrations separately from application startup.
- Prefer expand/validate/contract for high-risk production changes.
- Do not edit an already-applied production migration.

## Observability

Application logs are JSON for HTTP requests and include request IDs. Monitor:

- request latency
- 5xx rate
- authentication failures
- rate-limit events
- readiness/health failures
- PostgreSQL connectivity
- connection exhaustion
- disk/storage usage

Keep request IDs in incident tickets so application logs can be correlated with client/API failures.

## Recovery

A release is not complete until:

- the migration job succeeds,
- readiness is healthy,
- backup freshness is within policy,
- the latest restore drill succeeds,
- rollback/recovery steps are documented and tested in staging.

## Security checklist

- HTTPS at the public edge.
- Secure, HTTP-only session cookies in production.
- Explicit CORS allowlist.
- HSTS enabled by the application.
- CSP/frame/content-sniffing protections at the edge.
- Request body limits and authentication rate limits enabled.
- No production secrets in Git.
