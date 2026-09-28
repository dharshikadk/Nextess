# Data-driven UI

Runtime curriculum, subjects, mission versions, progress, badges, directives, leaderboard rows, profile fields and dashboard values come from the backend API/database.

There is intentionally no frontend mission catalogue JSON. Mission authoring packages live under `database/content/` and are imported by the database seed; published database mission versions are the runtime source of truth.

Static simulation HTML files under `frontend-v2/public/` are executable presentation assets referenced by published simulation metadata. They are not a second mission-content source.

Empty states are intentional and must never be replaced with fake users, fake missions, or hardcoded progress.
