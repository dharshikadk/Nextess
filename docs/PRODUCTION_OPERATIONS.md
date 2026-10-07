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
## Vercel Services deployment

Nextess can be deployed as one Vercel project with two framework services:

- 'frontend-v2': Vite frontend, public at '/'.
- 'backend': Express API, public only through '/health', '/ready', and '/v1/*' rewrites.
- PostgreSQL: external managed PostgreSQL (for example a Vercel Marketplace PostgreSQL integration), not a Vercel compute service.

The Vite frontend runs in the browser, so production API requests use same-origin '/v1/*' paths. A private service binding is intentionally not used for this browser-to-API call because binding environment variables are runtime variables for service-side code, not values to expose in a static Vite browser bundle.

### Vercel environment variables

Configure these on the backend service/project for Production and Preview as appropriate:

- 'DATABASE_URL' — managed PostgreSQL connection string; use the provider's TLS-enabled URL.
- 'FRONTEND_ORIGIN' — production/custom Nextess URL. Vercel deployment/branch URLs are accepted automatically by the backend.
- 'SESSION_DAYS=30'
- 'TRUST_PROXY=true'

Do not configure 'VITE_API_BASE_URL' for the Vercel frontend. The frontend deliberately uses relative '/v1/*' API paths in production.

### PostgreSQL and migration release order

1. Provision managed PostgreSQL and connect it to the Vercel project.
2. Set 'DATABASE_URL' in the GitHub production environment used by '.github/workflows/production-migration.yml'.
3. Deploy the Vercel project from the deployment branch/PR as a preview first.
4. Verify '/health' and '/ready' on the preview deployment.
5. Run the production migration workflow exactly once against the production database before routing production traffic to the new application schema.
6. Deploy/route the approved 'main' commit.
7. Verify '/health', '/ready', authentication, guest sessions, mission start/resume, answer submission, rewards, and simulation persistence.

The migration workflow is deliberately separate from application startup. Do not add 'prisma migrate deploy' or seeding to the Vercel service start command.

### Local Vercel Services verification

Use the current Vercel CLI from the repository root and run 'vercel dev' to exercise the same service routing locally. Local Docker Compose remains supported separately for container-based development/production parity; Vercel does not deploy 'docker-compose.yml' directly.
