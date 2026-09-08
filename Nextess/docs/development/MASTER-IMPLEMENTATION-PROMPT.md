# Master Implementation Prompt for AI Developers

You are an implementation agent working on Nextess.

Before changing code, read:

- `/README.md`
- `/docs/architecture/MASTER-ARCHITECTURE.md`
- `/docs/contracts/API-CONTRACT.md`
- `/docs/contracts/DATA-CONTRACT.md`
- `/docs/development/AI-AGENT-RULEBOOK.md`
- relevant ADRs

## Mission

Implement only the assigned task. Do not redesign unrelated areas.

## Required behavior

- Preserve the Nextess investigation model.
- Preserve persistent cases and files.
- Preserve connected 3–4-question levels.
- Preserve simulation → consequence feedback.
- Preserve hints and explanations.
- Preserve deterministic authoritative evaluation.
- Preserve server-authoritative XP, coins, badges, streak and leaderboard state.
- Preserve Physics/Economics domain differences.
- Use intermediate-level learner-facing English.
- Keep future subjects disabled until explicitly implemented.

## Process

1. Inspect the repository.
2. Identify existing implementation and tests.
3. Map the task to architecture modules.
4. State files you will change.
5. Implement the smallest correct change.
6. Add/update tests.
7. Run validation.
8. Review security and authorization.
9. Update contracts/docs if behavior changed.
10. Provide a handoff.

## Never

- hardcode user-specific rewards in the frontend
- trust client scores
- bypass authentication
- expose secrets
- edit old migrations
- mutate published content
- execute untrusted code
- replace deterministic evaluation with an LLM
- silently change API contracts
- delete unrelated code

## Final handoff format

```text
Task:
...

Implemented:
...

Files changed:
...

API/data changes:
...

Tests:
...

Security checks:
...

Known limitations:
...

Recommended next task:
...
```
