# Nextess Frontend (prototype)

A React + Vite implementation of the **Command Center Dashboard** and the
**Missions Zig-Zag Path** ("mission tab") from the Nextess Figma file, wired
to real mission content from the `dharshikadk/Nextess` repo
(`database/content/nextess_10_missions.json`), plus dark/light mode and the
enroll-before-solving flow requested afterwards.

## Run it

```bash
npm install
npm run dev
```

Then open the printed local URL. `npm run build` produces a static
production build (already verified to build cleanly).

## What's built

- **Sidebar + Header shell** (`components/shell`) — used on every page, with
  icons for every nav item, KP/coins/streak pills, and the guest sign-in
  card, matching the Figma layout and spacing.
- **Dashboard** (`components/dashboard/DashboardPage.jsx`) — quote ticker,
  hero greeting with animated streak/velocity stats, active-mission resume
  card (progress bar + HUD), daily directives list, 3-day league banner,
  "coming soon subjects" grid, and the guest local-cache reminder banner.
  KP/coin numbers animate up from 0 on load (`components/common/CountUp`).
- **Missions Zig-Zag Path** (`components/missions/MissionsZigZagPage.jsx`) —
  subject switcher (Physics/Economics, generic — adding a subject to the
  data needs no new code), a zig-zag mission path built from the first two
  real missions per subject (`PHY-001`, `PHY-002`, `ECO-001`, `ECO-002`),
  and a simulation-brief side panel with the mission's real objective,
  resources, KP/coin prizes and a ladder-progression widget.
- **Dark / light theme** (`theme/ThemeContext.jsx`) — toggle in the header.
  Dark mode is the Obsidian palette from Figma, unchanged. Light mode reuses
  the exact same components/layout and only swaps CSS variables to a soft
  pastel palette (`styles/tokens.css`), plus a couple of very small ambient
  gradient touches — no layout differences between themes.
- **Enroll-before-solving gate** (`data/enrollment.js`) — new requirement,
  not yet in the backend/repo. It's local-only (localStorage), generic per
  subject name, and clearly commented as a placeholder for a real
  `/api/enrollments` endpoint. Switch to an unenrolled subject in the
  switcher to see the gate.
- **Simulation placeholder** — the repo has no simulation asset files yet,
  so the brief panel shows a clearly-labelled "Simulation preview not
  available yet" box instead of fabricating one.
- **Data-driven, not hard-coded**: `data/missions.js` transforms the raw
  backend JSON into what the UI needs; no mission title/reward/copy is
  written into a component. Adding mission `PHY-003` to the JSON and it
  will render with no code changes.

## Architecture notes (see file comments for more detail)

- `services/api.js` is the only place that "talks to the backend" (currently
  resolving local demo data after a simulated delay). Swap the function
  bodies for real `fetch` calls when the backend contract is ready —
  component code doesn't change.
- `data/session.js` mocks what `/api/session/me` should return.
- `data/missions.js` mocks what `/api/missions?subject=...` combined with
  live progress should return; `DEMO_PROGRESS_BY_ID` inside it is the one
  place that's faking per-user progress since there's no live backend yet.

## Not built yet (left off here — pick up from this point)

- Mission Brief / Learning Capsule pages (letter-by-letter + para-by-para
  text reveal was requested for the capsule specifically — not started).
- Mission Ladder & Levels / Level Investigation & Simulation Lab pages.
- Leaderboard, Profile, Settings, About pages (nav links currently render a
  "not built yet" placeholder instead of dead-ending).
- Sound effects for reward animations (KP count-up animation is done;
  audio hooks are not wired up).
- Real backend integration (everything currently reads local mock data via
  `services/api.js`).

## Update: light/dark mode, enroll gate, subject renames, simulations (this round)

- Sidebar: removed "Command Center" sublabel under Dashboard.
- Dashboard: removed "Inspect Schema" button and the hero's long paragraph;
  league banner now reads "3 Day Master League is Live Now" / "Solve
  missions to top this league's leaderboard" (Division tag removed);
  subjects section renamed to "Upcoming Research Disciplines" with the
  "Prerequisite" line removed from each card; the page-level guest banner
  was removed in favor of a floating one shown on every tab.
- New floating "Unsaved Laboratory Session" banner (`FloatingSessionBanner.jsx`),
  guest-only, dismissible with ✕, visible across tabs until signed in.
- Header: removed "Preferences"; "Sign In" navigates to a sign-in stub and
  disappears once signed in; theme toggle is now a sun/moon icon button.
- Added a **Back** button in `AppShell` whenever there's history to go back
  to (`App.jsx` keeps a simple navigation stack).
- Real dark/light theme toggle: dark = untouched Obsidian Figma palette;
  light = distinct pastel hue per surface (not just lighter/darker), and
  the sidebar/header now actually re-theme (previously hard-coded to a dark
  rgba regardless of theme — fixed via `--surface-glass`/`--surface-header`).
- Loaded distinct Google Fonts: Space Grotesk (headings), Inter (body),
  JetBrains Mono (numbers/stats) — previously all fell back to one system font.
- Subject display names ("Classical & Modern Physics" / "Quantitative
  Economics") added in `data/subjects.js`; the underlying data key stays
  `Physics`/`Economics` to match the backend JSON, so a new subject needs
  no code change beyond one optional map entry.
- Enroll-before-solving gate (`data/enrollment.js`) wired into the mission
  tab's subject switcher — new, local-only, generic per subject name.
- Mission tab: "Simulation Brief" renamed to "Mission Brief"; added a
  "Continue from where you left" bar above the path when a mission is
  in-progress; added short helper captions under the simulation, files
  list and ladder progression.
- **Real repo simulations embedded** via `<iframe>` from `public/simulations/*.html`
  — unmodified markup/CSS/canvas logic/data, only resized to fit the panel.
  Mapping lives in `data/missions.js` (`SIMULATION_FILE_BY_ID`):
  - `ECO-001` → `mission-01-canteen-revenue.html` — verified content match
    (price/demand/revenue).
  - `ECO-002`, `PHY-001`, `PHY-002` → the closest same-subject file
    (`mission-02-bus-fare-demand`, `mission-03-bicycle-braking`,
    `mission-04-solar-panel-angle` respectively) — **not** a verified
    content match to those missions' own JSON (e.g. PHY-001 is a circuit
    mission, not a braking one). The panel shows a small "(Placeholder
    asset…)" note whenever the pairing isn't verified — swap the mapping
    once mission-specific simulation files exist.

### Still not built (unchanged from before)

- Missions "home" landing page matching the Figma "Html → Body" frame
  (discipline-picker before the zig-zag path) — Missions tab currently
  opens straight into the subject switcher + path instead.
- About page matching the Figma "About Nextess" frame.
- Sign-in is a placeholder screen (one "Continue as Signed In (demo)"
  button flips guest state) — no real auth form.
- Learning Capsule / Mission Ladder & Levels / Level Investigation pages.
- Leaderboard, Profile, Settings pages.
- Sound effects; real backend integration.
