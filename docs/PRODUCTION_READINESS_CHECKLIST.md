# Nextess Production Readiness Checklist

This checklist converts the production requirements into executable release gates without adding provider-specific infrastructure.

## Release gates

### Security
- [ ] \`NODE_ENV=production\` and \`FRONTEND_ORIGIN\` points only to the deployed frontend.
- [ ] HTTPS terminates in front of both application surfaces.
- [ ] Session cookies remain HttpOnly, SameSite=Lax and Secure in production.
- [ ] \`TRUST_PROXY=true\` is set only when the deployment actually sits behind a trusted proxy.
- [ ] Database credentials and application secrets exist only in the deployment secret store.
- [ ] CI passes backend tests, Prisma validation/migrations, mission validation and browser tests.
- [ ] Cross-user investigation access tests pass.
- [ ] Tampered IDs, out-of-order submissions, duplicate submissions and replayed idempotency keys are tested.
- [ ] Rate limiting is sized for the deployment topology. The current limiter is process-local; multi-instance deployment requires a shared limiter.

### Database
- [ ] Automated PostgreSQL backups are enabled by the hosting provider.
- [ ] Retention policy is documented.
- [ ] A restore has succeeded in an isolated database using a recent backup.
- [ ] Production migrations are reviewed before deployment.
- [ ] Migration rollback uses a compatible forward-fix strategy; destructive schema rollback is never assumed.
- [ ] Published mission versions remain immutable.

### Deployment
1. Merge only after CI is green.
2. Build frontend and backend artifacts from the exact release commit.
3. Apply reviewed migrations in staging.
4. Start the API and verify \`/health\` and \`/ready\`.
5. Run browser smoke tests against staging.
6. Apply production migrations.
7. Deploy backend and frontend.
8. Verify \`/ready\`, \`/v1/subjects\`, and one published mission.
9. Monitor structured request logs and error rates.

### Rollback
- Application rollback may use an earlier build only when it is schema-compatible.
- If a migration is already applied, prefer a forward fix.
- Never delete a published mission version to recover from a content defect.
- To deactivate faulty mission content, publish/activate the previously validated version according to the existing versioning contract.

### Observability
The API emits structured request records containing only:
- request ID
- HTTP method
- path
- response status
- request duration

Monitor:
- API latency
- 4xx/5xx rate
- authentication failures
- mission answer failures
- simulation-state failures
- database readiness failures

Do not log passwords, session tokens, answer keys, raw request bodies or database credentials.

### Accessibility and responsive verification
Before a production release, verify the Mission Chamber with:
- keyboard-only navigation;
- visible focus;
- screen-reader labels for task controls;
- error/status announcements;
- non-color-only state indicators;
- reduced-motion preference;
- 44px-equivalent touch targets where practical;
- narrow mobile, mobile, tablet and desktop widths;
- simulation interaction on touch and keyboard-capable devices.

### Performance baseline
Record real measurements for:
- initial frontend load;
- mission catalogue;
- mission detail;
- mission start;
- investigation retrieval;
- answer submission;
- simulation load.

Investigate regressions with browser traces and database query plans before adding caching or infrastructure.

## Recovery drill

A production launch is not complete until the following drill succeeds:

1. create/identify a recent backup;
2. restore it into an isolated PostgreSQL instance;
3. apply the same Prisma migration state expected by the release;
4. start a staging API against the restored database;
5. verify readiness, catalogue, mission detail and learner progress;
6. record the restore duration and any manual steps.

The application repository intentionally does not contain destructive provider-specific backup or restore commands.
