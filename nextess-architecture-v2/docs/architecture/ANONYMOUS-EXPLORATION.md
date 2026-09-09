# Anonymous Exploration Architecture

## Product decision

A visitor should experience the product before deciding whether to create an account.

Primary journey:

```text
Open Nextess
→ Start Exploring
→ Experience the UI/UX
→ Try Projects
→ Decide whether to create an account
```

Signup/login remains available at any time.

## Anonymous access

Use an explicit content/authorization property such as:

```text
anonymousAccess: true | false
```

The backend enforces this rule.

Anonymous users can be allowed to:

- browse subjects
- view project information
- open eligible case files
- use eligible simulations
- answer eligible questions
- see consequences
- see explanations

## Account-only capabilities

Possible authenticated-only features:

- persistent cross-device progress
- profile
- permanent XP/coins
- streak
- badges
- leaderboard
- saved notes
- completed-project history

## Anonymous session

If continuity is required, issue a secure, expiring server-side visitor/session identifier.

Do not use an arbitrary client-provided user ID.

Do not treat local storage as the authoritative source of progress or rewards.

## Login/signup entry points

Login/signup should be reachable from:

- landing page
- exploration page
- subject page
- project page
- investigation page
- appropriate completion screens

It should not unexpectedly interrupt exploration.

## Claiming anonymous progress

If supported:

```text
anonymous session
→ authenticate
→ verify ownership
→ claim/merge
→ transaction
→ authenticated investigation
```

The server decides what transfers and how conflicts are resolved.

## Security

Anonymous users still require:

- validation
- rate limits
- bounded simulation variables
- expiration
- authorization
- abuse controls

## Tests

1. Visitor opens Nextess without login.
2. Visitor starts exploring.
3. Eligible project works anonymously.
4. Ineligible project is rejected server-side.
5. Login works from exploration.
6. Signup works from exploration.
7. Anonymous state cannot be accessed by another visitor.
8. Expired sessions are handled safely.
9. Anonymous users cannot manipulate rewards.
10. Authenticated-only data remains protected.
11. Claim/merge is idempotent and transactional if implemented.
