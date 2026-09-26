# Nextess V2 — Implementation & Mission Handoff Report

Date: 2026-09-26

## 1. Purpose

This document is the handoff specification for the next AI/developer continuing Nextess V2.

The approved V2 UI is stored separately under `frontend-v2/`.

**Do not modify or delete the existing `frontend/` directory.**

The V2 objective is:

- preserve the approved UI exactly;
- replace fake/demo state with persistent server data;
- make missions data-driven;
- connect missions to the existing simulations;
- persist investigation progress, answers, completion, XP, coins, streaks and badges;
- keep answer keys and reward authority on the server.

---

# 2. What Is COMPLETED

## 2.1 V2 frontend structure

Created:

`frontend-v2/`

The folder contains the approved UI implementation and supporting files.

Important existing UI components copied into V2 include:

- `App.tsx`
- `DashboardView.tsx`
- `DisciplinesView.tsx`
- `MissionsMapView.tsx`
- `MissionDetailView.tsx`
- `MissionChamberView.tsx`
- `SettingsView.tsx`
- `ProfileView.tsx`
- `LeaderboardView.tsx`
- `CadetAuthModal.tsx`
- `EditProfileModal.tsx`
- `Sidebar.tsx`
- `TopBar.tsx`
- `Toast.tsx`

The legacy `frontend/` directory was intentionally left untouched.

## 2.2 Real-data API client

Created:

`frontend-v2/src/api.ts`

It provides frontend access to:

- authentication
- dashboard
- profile
- settings
- streak
- leaderboard
- league participation
- badges
- daily directives
- directive claims
- daily quotes
- feedback
- subjects
- projects
- project details

The frontend sends credentials using HTTP credentials/cookies.

## 2.3 Authentication

V2 authentication UI now calls the backend instead of pretending to authenticate.

Implemented:

- registration
- login
- logout
- current-user session
- guest state
- username/password authentication
- new-user welcome reward

New users receive:

- 100 KP
- 100 Coins

These must be granted by the backend, not trusted from the browser.

## 2.4 Profile

Profile editing is connected to the API.

Supported profile information includes:

- name
- student/working-professional type
- school/college stage
- class
- field of study
- profession

## 2.5 Dashboard

Dashboard now has a path toward server-backed values rather than permanent demo values.

Connected data includes:

- KP
- coins
- streak
- level
- name
- username
- class/field/profession
- badge count
- daily quote
- daily directives

The greeting is generated from the current India time rather than a permanently hard-coded greeting.

## 2.6 Badges

Profile now supports the correct empty state:

> No badges earned yet.

When badges exist, the same approved badge UI structure is used to render them.

The browser does not invent earned badges.

## 2.7 Leaderboard

Leaderboard is connected to the backend.

If the league is closed or there are no participants, the V2 UI displays:

> Leaderboard is not opened

rather than fake rankings.

## 2.8 Database

The V2 database work has been added to the repository.

The schema/migration supports:

- user profile fields
- authentication sessions
- league cycles
- league participants
- daily quotes
- daily directives
- directive claims

Existing investigation/progress tables are also available for mission persistence.

Migration:

`database/prisma/migrations/20260926120000_v2_product/migration.sql`

## 2.9 Backend API

Backend V2 endpoints have been added/documented.

Documentation:

`backend/API-V2.md`

The API covers:

### Authentication

- POST `/v1/auth/register`
- POST `/v1/auth/login`
- POST `/v1/auth/logout`
- GET `/v1/auth/me`

### User state

- GET `/v1/dashboard`
- GET `/v1/streak`
- GET/PATCH `/v1/profile`
- GET/PATCH `/v1/settings`
- GET `/v1/badges`

### Daily systems

- GET `/v1/quotes/daily`
- GET `/v1/directives`
- POST `/v1/directives/:id/claim`

### League

- GET `/v1/leaderboard`
- POST `/v1/league/join`

### Catalogue

- GET `/v1/subjects`
- GET `/v1/subjects/:subjectId/projects`
- GET `/v1/projects/:projectId`

### Mission investigation

- POST `/v1/projects/:projectId/start`
- GET `/v1/investigations/:id`
- POST `/v1/investigations/:id/answers`
- POST `/v1/investigations/:id/complete`

## 2.10 Mission data

The supplied mission catalogue was added to:

`frontend-v2/src/data/missions.json`

The mission data was sanitized so answer keys/explanations are not shipped to the browser.

The frontend should only receive information needed to conduct the investigation.

## 2.11 Existing simulations

The available simulations were copied into:

`frontend-v2/public/`

Current registered simulation assets:

- bicycle braking
- solar panel angle
- canteen revenue
- bus fare demand

Registry:

`frontend-v2/src/data/simulationRegistry.ts`

---

# 3. What Is PARTIALLY COMPLETED

## 3.1 Mission API persistence

The backend now has the fundamental investigation flow:

1. start investigation;
2. retrieve investigation;
3. submit an answer;
4. evaluate answer server-side;
5. store the answer;
6. complete investigation;
7. update project progress;
8. create completion report.

However, the existing Mission UI has **not yet been fully wired to this flow**.

This is the main remaining frontend task.

## 3.2 Mission map

Current `MissionsMapView.tsx` still contains hard-coded mission path objects such as:

- Bridge Stability & Resonance
- Gravitational Slingshot & Orbital Dynamics
- Aerodynamic Airfoil Lift & Boundary Layer
- Quantum Potential Well & Barrier Tunneling
- Relativistic Mechanics & Spacetime Curvature

These are currently presentation/demo data.

They must eventually be replaced with server/catalogue data while preserving the exact visual structure.

## 3.3 Mission detail

Current `MissionDetailView.tsx` still contains hard-coded stage information.

Examples include:

- Stage 01 briefing
- Learning Capsule
- Level 1
- Level 2
- Level 3
- Level 4
- Level 5

The component needs to become data-driven.

The UI itself must not be redesigned.

## 3.4 Mission chamber

The existing Mission Chamber UI has not yet been completely connected to:

- investigation creation;
- question retrieval;
- answer submission;
- server evaluation;
- simulation state;
- hints;
- consequences;
- completion;
- reward persistence;
- final report.

This is the primary work remaining.

## 3.5 Full build/runtime verification

The source structure and modified code were audited, but a complete production build plus real PostgreSQL migration/runtime test was not completed in this environment because dependency installation timed out.

Therefore:

**Do not claim that V2 is production-ready until the next AI runs the complete frontend and backend build/test process.**

---

# 4. MAIN REMAINING TASK — MISSION TAB

The next AI must focus primarily on the Mission system.

Do not start by redesigning anything.

The Mission UI is considered locked.

The implementation should convert the current Mission UI from:

`hard-coded UI + fake mission state`

to:

`same UI + real mission data + persistent investigation state`

---

# 5. REQUIRED MISSION ARCHITECTURE

The Mission system should have these layers.

## Layer 1 — Subject

Example:

`Physics`

or:

`Economics`

## Layer 2 — Mission Path

A subject can contain many missions.

Example:

```
Physics
 ├── Mission 01
 ├── Mission 02
 ├── Mission 03
 └── Mission 04
```

The exact same Mission Map UI must be reusable for every subject.

Do not create separate Mission Map components for Physics, Economics, Chemistry, etc.

Use data/configuration.

## Layer 3 — Mission

Each mission should contain:

- ID
- subject
- title
- description
- difficulty
- reward
- levels
- status
- progress
- simulation reference
- prerequisite information

## Layer 4 — Levels

Each mission can contain multiple levels.

Example:

```
Mission
 ├── Level 1
 ├── Level 2
 ├── Level 3
 ├── Level 4
 └── Level 5
```

The number of levels must NOT be hard-coded to five.

## Layer 5 — Questions

Questions should come from the backend/project version.

The frontend must not contain authoritative answers.

Each question may contain:

- question type
- prompt
- options
- hints
- simulation reference
- investigation context
- ordering

## Layer 6 — Investigation

When the user starts a mission:

```
POST /v1/projects/:projectId/start
```

The backend creates the investigation.

The returned investigation ID becomes the persistent session identifier.

The frontend then loads:

```
GET /v1/investigations/:id
```

---

# 6. ANSWER FLOW

When the user submits an answer:

```
POST /v1/investigations/:id/answers
```

The browser sends the user's answer.

The backend determines whether it is correct.

The browser must NOT calculate authoritative correctness.

The response should control:

- correct/incorrect state
- feedback
- consequences
- progression

Do not add client-side answer keys.

---

# 7. COMPLETION FLOW

When all required questions are completed:

```
POST /v1/investigations/:id/complete
```

The backend should:

1. verify completion;
2. verify answer results;
3. mark investigation completed;
4. update project progress;
5. calculate authoritative rewards;
6. update user XP/KP;
7. update coins;
8. update streak if applicable;
9. evaluate badge conditions;
10. create completion report.

The frontend should simply render the returned result.

---

# 8. SIMULATION INTEGRATION

Use:

`frontend-v2/src/data/simulationRegistry.ts`

Do not assume all simulations have the same controls.

Each simulation may expose different variables.

Therefore the Mission Chamber should support a simulation adapter/configuration approach.

Conceptually:

```text
Mission
  ↓
Simulation reference
  ↓
Simulation configuration
  ↓
Mission Chamber
  ↓
simulation-specific controls
```

Do not rewrite existing simulation logic unless necessary.

If a required simulation is unavailable:

**use a clearly marked placeholder instead of inventing simulation behaviour.**

---

# 9. HINTS

Hints must remain part of the Mission UI.

The next AI must preserve:

- hint button
- hint presentation
- hint progression
- consequence behaviour

Do not replace hints with generic chatbot text.

If hint costs/rewards exist, they must eventually be server-authoritative.

---

# 10. CONSEQUENCE PANEL

The Mission design contains consequence/investigation feedback.

Preserve this structure.

The panel should react to actual mission events:

- answer submitted;
- answer incorrect;
- answer corrected;
- simulation variable changed;
- mission stage completed;
- investigation completed.

Do not create arbitrary fake consequences.

---

# 11. PROGRESS STATES

The Mission UI must support at minimum:

### Locked

Mission/level prerequisite not satisfied.

### Ready

Available but not started.

### In Progress

The user has an active persisted investigation/progress record.

### Completed

The backend confirms completion.

### Reviewable

Previously completed content can be opened for review without creating fake progress.

The existing visual representation of these states should remain unchanged.

---

# 12. GUEST USERS

Guest users must not receive fake persisted progress.

For a guest:

- KP can display 100 as the initial free value if this is the intended fresh-user presentation;
- coins can display 100;
- streak = 0;
- badges = none;
- leaderboard = not opened/no participation;
- mission progress = no persisted progress.

A guest should be prompted to authenticate when an operation requires persistence.

Do not silently fabricate completed missions.

---

# 13. REAL USER WITH NO PROGRESS

A newly registered user should see:

- 100 KP
- 100 Coins
- 0 streak
- 0 earned badges
- no completed missions
- no fake leaderboard rank

Mission cards should therefore calculate their state from actual progress.

---

# 14. MULTI-SUBJECT REQUIREMENT

The Mission architecture must be reusable.

The following should work with the same components:

```
Physics
Economics
Chemistry
Biology
Geography
History
```

The UI component should receive data rather than contain subject-specific mission objects.

Bad:

```typescript
if (subject === 'physics') {
   // giant Physics UI
}

if (subject === 'economics') {
   // another UI
}
```

Preferred:

```typescript
<MissionsMapView
    subject={subject}
    missions={missions}
/>
```

---

# 15. STRICT UI RULES

The next AI MUST NOT:

- redesign the Mission Map;
- redesign Mission Detail;
- redesign Mission Chamber;
- change component ordering;
- change page orientation;
- change text unnecessarily;
- replace the existing cards;
- change spacing unnecessarily;
- replace icons;
- introduce a new visual system;
- create a generic dashboard-style mission page;
- simplify the Mission UI into a conventional quiz.

The existing V2 Mission UI is the design source of truth.

Only data binding and functional wiring should change.

If a backend limitation prevents exact functionality, preserve the UI and use a minimal appropriate loading/empty/placeholder state.

---

# 16. FILES THE NEXT AI SHOULD INSPECT FIRST

Before changing anything:

```
frontend-v2/src/components/MissionsMapView.tsx
frontend-v2/src/components/MissionDetailView.tsx
frontend-v2/src/components/MissionChamberView.tsx
frontend-v2/src/data/missions.json
frontend-v2/src/data/simulationRegistry.ts
frontend-v2/src/api.ts
frontend-v2/src/types.ts
frontend-v2/src/App.tsx

backend/src/server.ts
backend/API-V2.md

database/prisma/schema.prisma
database/prisma/migrations/
```

Also inspect the existing simulation HTML files before attempting to integrate them.

---

# 17. REQUIRED WORK ORDER

The next AI should work in this order.

### Step 1

Read all Mission components.

Do not modify them yet.

### Step 2

Read the mission JSON.

Determine its exact hierarchy.

### Step 3

Read the Prisma schema.

Identify the existing:

- Project
- ProjectVersion
- Level
- Question
- Investigation
- InvestigationAnswer
- UserProjectProgress
- ProjectCompletionReport

relationships.

### Step 4

Read the backend Mission endpoints.

Confirm their actual request/response shapes.

### Step 5

Create TypeScript types for the mission API.

Avoid `any` wherever practical.

### Step 6

Replace hard-coded Mission Map data with API/catalogue data.

Keep the JSX/layout visually unchanged.

### Step 7

Replace hard-coded Mission Detail stages with project-version/level data.

Keep the visual layout unchanged.

### Step 8

Connect Mission Chamber to the investigation API.

### Step 9

Connect simulations through the registry/configuration layer.

### Step 10

Implement completion/reward refresh.

### Step 11

Test:

- guest;
- new account;
- existing account;
- empty progress;
- active progress;
- completed mission;
- incorrect answer;
- correct answer;
- locked level;
- multiple missions;
- multiple subjects;
- unavailable simulation.

---

# 18. TESTING REQUIREMENT

Do not report the Mission system as complete until all of these have been tested.

## Frontend

- TypeScript compilation
- production build
- route/navigation test
- Mission Map rendering
- Mission Detail rendering
- Mission Chamber rendering
- responsive layout

## Backend

- API starts successfully
- database connection
- authentication
- investigation creation
- investigation retrieval
- answer submission
- server evaluation
- completion
- progress persistence
- reward persistence

## Integration

At minimum test:

```
Register
  ↓
Receive 100 KP / 100 Coins
  ↓
Open subject
  ↓
Open mission
  ↓
Start investigation
  ↓
Answer question
  ↓
Receive server result
  ↓
Continue
  ↓
Complete mission
  ↓
Progress persists
  ↓
Rewards persist
  ↓
Reload page
  ↓
Same progress appears
```

---

# 19. DO NOT MAKE THESE ASSUMPTIONS

Do not assume:

- every mission has five levels;
- every mission has five questions;
- every simulation has the same controls;
- every question is MCQ;
- every answer is numeric;
- every subject has identical metadata;
- every user has progress;
- every user belongs to the leaderboard;
- every mission has a simulation;
- every simulation file is available.

The data model must determine these values.

---

# 20. CURRENT STATUS SUMMARY

| Area | Status |
|---|---|
| V2 frontend folder | COMPLETE |
| Approved UI copied | COMPLETE |
| Legacy frontend preserved | COMPLETE |
| API client | COMPLETE |
| Auth API/UI connection | COMPLETE |
| Profile persistence connection | COMPLETE |
| Dashboard real-data connection | MOSTLY COMPLETE |
| Badge empty/earned rendering | COMPLETE |
| Leaderboard empty state | COMPLETE |
| Database V2 schema/migration | COMPLETE |
| Daily quote API | COMPLETE |
| Daily directives API | COMPLETE |
| Existing simulations copied | COMPLETE |
| Simulation registry | COMPLETE |
| Mission catalogue copied | COMPLETE |
| Mission API foundation | COMPLETE |
| Mission Map data binding | INCOMPLETE |
| Mission Detail data binding | INCOMPLETE |
| Mission Chamber API integration | INCOMPLETE |
| Simulation → Mission Chamber integration | INCOMPLETE |
| Mission completion/reward frontend flow | INCOMPLETE |
| Full production build | NOT VERIFIED |
| Full live DB integration test | NOT VERIFIED |

---

# 21. MOST IMPORTANT INSTRUCTION

**Do not rebuild the Mission UI.**

The job is to take the existing Mission UI and turn it into a real, persistent, data-driven Mission system.

Use the existing components as the visual contract.

Change:

```
hard-coded values
        ↓
API/database values
```

not:

```
approved UI
        ↓
new UI
```

Before every substantial change, inspect the existing implementation and make the smallest change required.

After each functional change, run the relevant test/build.

Never claim something works without verifying it.
