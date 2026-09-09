# Nextess Security Architecture

## Threat model

Protect against:

- account takeover
- credential stuffing
- broken object authorization
- reward manipulation
- answer manipulation
- SQL injection
- XSS
- CSRF where applicable
- session theft
- abuse of anonymous access
- malicious simulation input
- denial of service
- prompt injection if AI is added

## Anonymous security

Anonymous access does not mean unrestricted access.

Every request still requires:

- input validation
- authorization
- rate limiting
- abuse protection
- session expiry
- bounded resource use

## Authentication

Use secure sessions and modern password hashing.

Use appropriate:

- HttpOnly
- Secure in production
- SameSite
- session rotation/revocation

## Authorization

For every protected object:

```text
requestedObject.ownerId == authenticatedUser.id
```

or an explicit role/policy allows access.

## Rewards

Never accept:

```json
{"xp": 1000, "coins": 5000}
```

as an authoritative reward command.

## Simulation

Never execute arbitrary Python/C++/JavaScript submitted by users on the application server.

## Secrets

`.env` is never committed.

`.env.example` contains placeholders only.

## Logging

Never log:

- passwords
- session tokens
- API secrets
- unnecessary private notes
