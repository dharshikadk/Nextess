# Test Architecture

## Required layers

- unit tests
- integration tests
- security tests
- E2E tests
- content validation
- deterministic evaluator/simulation tests

## Critical E2E

`open Nextess → explore → try eligible project → use simulation → answer → consequence → progress → optional signup/login`

Also test the authenticated path and Economics separately.

## Security tests

Cover IDOR, reward manipulation, malformed answers, anonymous session isolation, session expiry, rate limits, XSS in notes/feedback and invalid simulation ranges.
