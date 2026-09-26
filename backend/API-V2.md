# Nextess V2 API surface

Authentication:
- POST /v1/auth/register
- POST /v1/auth/login
- POST /v1/auth/logout
- GET /v1/auth/me

Profile/settings:
- GET/PATCH /v1/profile
- GET/PATCH /v1/settings

User state:
- GET /v1/dashboard
- GET /v1/streak
- GET /v1/badges

Daily systems:
- GET /v1/quotes/daily
- GET /v1/directives
- POST /v1/directives/:id/claim

League:
- GET /v1/leaderboard
- POST /v1/league/join

Catalogue:
- GET /v1/subjects
- GET /v1/subjects/:subjectId/projects
- GET /v1/projects/:projectId

Feedback:
- POST /v1/feedback

Rewards are server-authoritative. The frontend never submits XP or coins as authoritative values.