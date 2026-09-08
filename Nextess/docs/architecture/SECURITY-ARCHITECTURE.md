# Nextess Security Architecture

## Threat model

Protect against:

- account takeover
- credential stuffing
- broken object-level authorization
- reward manipulation
- answer/result manipulation
- SQL injection
- XSS
- CSRF
- session theft
- insecure file/content upload
- abuse of notes/feedback
- denial of service
- malicious simulation input
- prompt injection if AI is added

## Authentication

Use a proven password hashing algorithm and secure session strategy.

Recommended browser properties:

- HttpOnly
- Secure in production
- SameSite appropriate to deployment
- short-lived access/session credentials where appropriate
- rotation/revocation strategy

## Authorization

Every object access must check ownership or role.

Example:

```text
GET /v1/investigations/{id}
```

must verify:

```text
investigation.userId == authenticatedUser.id
```

Do not rely on hiding IDs in the UI.

## Input validation

Validate:

- type
- length
- range
- enum
- nested object shape
- content size

Reject unknown fields where practical.

## Rewards

Never accept:

```json
{"xp": 1000, "coins": 5000}
```

as an authoritative command.

The server derives rewards from evaluation rules.

## Simulation safety

The browser may control simulation values only within declared limits.

Backend validation must repeat critical limits before accepting simulation-derived decisions.

Never compile/execute arbitrary submitted C++, Python or JavaScript on the application server.

## Content security

If files can be uploaded by administrators:

- allow-list MIME types
- scan files
- size limits
- store outside executable paths
- generate safe names
- serve with safe content-disposition/content-type
- do not execute uploaded content

## Logging

Security events:

- failed login
- suspicious repeated attempts
- authorization failures
- reward anomalies
- unusual request rates
- administrative changes

Do not log credentials or tokens.

## Secrets

Use environment variables locally and a secret manager in production.

`.env` must be ignored by Git.

Provide `.env.example` with placeholders only.

## Database

Application database role should have only required permissions.

Production migrations should be run by a controlled deployment identity, not by arbitrary runtime code.
