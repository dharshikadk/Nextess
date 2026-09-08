# Nextess Test Architecture

## Testing pyramid

```text
                 E2E
              /       \
        Integration   Security
          /               \
       Domain/Service/Repository
             /       \
       Unit + Content Validation
```

## Unit tests

Required for:

- evaluation rules
- simulation calculations
- reward calculation
- streak calculation
- badge criteria
- answer normalization
- permission policies

## Integration tests

Cover:

- auth + database
- project loading
- investigation creation/resume
- answer submission transaction
- reward ledger
- notes authorization
- leaderboard queries

## E2E critical path

At minimum:

```text
register
 -> login
 -> dashboard
 -> open Physics project
 -> start investigation
 -> read case file
 -> interact with simulation
 -> answer question
 -> receive consequence
 -> receive XP/coins
 -> move next
 -> complete level
 -> view summary
 -> profile reflects state
```

Also test Economics separately because its investigation/evaluation approach differs.

## Security tests

- unauthorized investigation access
- IDOR attempts
- invalid reward payload
- malformed answer payload
- rate limiting
- session invalidation
- CSRF where applicable
- XSS payloads in notes/feedback
- oversized request
- invalid simulation range

## Regression rule

Every production bug should produce a regression test unless technically impossible.

## Determinism tests

For evaluators/simulations:

same version + same input -> same result.

This must be explicitly tested.
