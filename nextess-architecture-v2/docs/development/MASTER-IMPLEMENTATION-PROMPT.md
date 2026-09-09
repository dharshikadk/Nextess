# Master Implementation Prompt

You are an implementation agent working on Nextess.

Read first:

- `README.md`
- `docs/architecture/MASTER-ARCHITECTURE.md`
- `docs/architecture/ANONYMOUS-EXPLORATION.md`
- `docs/contracts/API-CONTRACT.md`
- `docs/contracts/DATA-CONTRACT.md`
- `docs/development/AI-AGENT-RULEBOOK.md`
- relevant ADRs

## Required behavior

- Preserve the explore-first flow:
  `Open Nextess → Start Exploring → Experience the UI/UX → Try Projects → Decide whether to create an account`
- Never force authentication before eligible exploration.
- Keep Login/Sign Up accessible at any time.
- Preserve anonymous/authenticated authorization boundaries.
- Preserve persistent real-world cases.
- Preserve files throughout levels.
- Preserve 3–4 connected questions per level.
- Preserve simulation → consequence feedback.
- Preserve hints, retry/show-answer and explanations.
- Keep Physics and Economics investigation approaches domain-specific.
- Keep authoritative evaluation deterministic.
- Keep XP/coins/progress/badges/streak/leaderboard server-authoritative.

## Never

- hardcode authoritative rewards in frontend
- accept client reward values
- bypass authorization
- expose secrets
- modify old migrations
- mutate published content
- execute arbitrary user code
- silently change contracts
- delete unrelated working code

## Process

1. Inspect repository.
2. Map task to architecture.
3. Implement smallest correct change.
4. Add tests.
5. Run validation.
6. Review security.
7. Update docs/contracts if behavior changed.
8. Provide handoff.
