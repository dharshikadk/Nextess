# Nextess Frontend Architecture

## Onboarding

Default flow:

```text
Open Nextess
→ Start Exploring
→ Experience the UI/UX
→ Try Projects
→ Decide whether to create an account
```

**Do not make Login/Register the mandatory first screen.**

Keep Login / Sign Up accessible throughout exploration.

## Application areas

```text
Public / Anonymous
├── Landing / Start Exploring
├── Explore / Subjects
├── Project previews
├── Eligible Project Investigation
├── About
└── Login / Register

Authenticated
├── Home / Dashboard
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
- future subjects as Coming Soon

Balances are API data.

## Streak

Displays:

- streak week calendar
- leaderboard
- badges

## Profile

Displays:

- streak
- coins
- XP
- level
- username
- name
- class/grade

## Settings

Displays:

- light/dark theme
- feedback
- FAQs

## Investigation

```text
┌──────────────────────────────────────────────────────────────┐
│ Level X | Case title                         XP | Coins       │
├───────────────────────┬──────────────────────┬───────────────┤
│ CASE FILE              │ QUESTIONS            │ SIM LAB       │
│ situation/data/files   │ current question     │ simulation    │
│                        │ answer/hint          │ controls      │
├───────────────────────┴──────────────────────┼───────────────┤
│ Back                 Next                    │ CONSEQUENCE   │
└──────────────────────────────────────────────┴───────────────┘
```

Responsive layouts may stack these sections on small screens.

## Files

Files should include an instruction such as:

> Use these files to get data and information about the situation.

Tables must render as actual accessible tables.

## Simulation

Show:

> Use the variable controls to see how the system changes.

Controls need:

- label
- unit
- range
- current value
- keyboard support
- validation feedback

## State

Server state:

- project content
- investigation progress
- answer results
- rewards

Local/transient state:

- selected file
- current input
- UI tabs
- temporary simulation controls

The frontend must not calculate authoritative rewards or permissions.

## Accessibility

- semantic headings
- keyboard navigation
- visible focus
- accessible tables
- accessible form errors
- sufficient theme contrast
- reduced-motion support
