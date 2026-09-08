# Nextess Frontend Architecture

## UI direction

The supplied frontend specification requests an aesthetic pastel-color theme and light/dark theme support.

Do not let styling decisions leak into domain logic.

## Application areas

```text
Public
├── Login/Register
└── About

Authenticated
├── Home
├── Streak
├── Profile
├── Settings
└── Project Investigation
```

## Home

Displays:

- XP
- coins
- streak
- welcome line
- "Explore, Experiment and Solve"
- Physics
- Economics
- future subjects marked Coming Soon

Data comes from the API. The frontend must not calculate the authoritative balances.

## Streak

Displays:

- streak week calendar
- leaderboard
- badges

Leaderboard must be server-provided.

## Profile

Displays:

- streak
- coins
- XP
- level
- username
- name
- class/grade

Only public profile fields should be returned.

## Settings

Displays:

- light/dark theme
- feedback
- FAQs

Theme preference is UI state persisted through user settings if cross-device persistence is desired.

## About

Explains the learning purpose and investigation method.

## Investigation page

Required persistent layout:

```text
┌──────────────────────────────────────────────────────────────┐
│ Level X | Case title                         XP | Coins       │
├───────────────────────┬──────────────────────┬───────────────┤
│ CASE FILE              │ QUESTIONS            │ SIM LAB       │
│ situation/data/files   │ current question     │ simulation    │
│                        │ answer/hint          │ controls      │
│                        │                      │               │
├───────────────────────┴──────────────────────┼───────────────┤
│ Back                 Next                    │ CONSEQUENCE   │
└──────────────────────────────────────────────┴───────────────┘
```

On smaller screens this becomes a responsive stacked layout while preserving access to all three functions.

## File viewer

Every file must show how it is used, e.g.:

> Use this file to find data and information about the situation.

Tables must render as actual accessible tables.

## Simulation lab

Show a short instruction such as:

> Use the variable controls to see how the system changes.

Simulation controls must have:

- label
- unit
- allowed range
- current value
- keyboard support
- validation message

## State model

Use server state for:

- project content
- investigation progress
- answer results
- rewards

Use local state for:

- open file
- selected tab
- current input before submit
- simulation controls before persistence if appropriate

## Navigation

Back/Next should be state-aware.

Do not let navigation accidentally mark a question as completed.

A completed state should be returned by the backend.

## Accessibility

- keyboard navigable
- semantic headings
- visible focus
- accessible labels
- sufficient contrast in both themes
- reduced-motion support
- tables with headers
- error messages connected to inputs
