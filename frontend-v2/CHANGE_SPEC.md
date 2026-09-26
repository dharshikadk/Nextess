# Frontend V2 implementation scope

- Keep existing frontend/ untouched.
- Preserve the approved Nextess UI design and component orientation.
- Login/Sign Up only; username + password; no email.
- Profile onboarding: Working Professional -> manually entered profession; Student -> School/College/Drop; School -> class; College/University -> broad field; do not collect institution names.
- Guests may view leaderboard but cannot participate until logged in.
- New account starts with 100 KP and 100 Coins, granted once server-side.
- Daily quote changes by day; sources may be scientist, artist, economist, financial thinker, etc.
- Greeting uses India time and updates dynamically.
- 3-Day League cycle: shared leaderboard across subjects; opening/closing/final topper persisted.
- Badges persistent; daily directives persistent with KP/coin rewards and idempotent claims.
- Every meaningful progress event persisted; login does not increase streak; repeated claims cannot duplicate rewards; hints/review may deduct coins; mission completion rewards depend on actual result.
- Do not modify mission content or mission API implementation in this pass.
