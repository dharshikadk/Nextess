# Nextess — Product & Architecture Source of Truth

**Status:** Canonical product/UX/AI architecture rules  
**Scope:** Product behavior, learning model, gamification, engagement, mission architecture, subject extensibility, question-system extensibility, simulations, frontend behavior, content-authoring rules, and AI collaboration boundaries.  
**Database implementation:** Intentionally out of scope for this document. Do not modify the existing database/schema from this document.  
**Audience:** Architecture AI, Frontend AI, Backend AI, Content/Mission AI, Simulation AI, Testing AI, Integration AI, and future AI agents.

## 1. Absolute source-of-truth rule

This document defines how Nextess is supposed to work.

Every AI working on Nextess MUST:
1. Read this document before making architectural or product changes.
2. Preserve existing behavior unless a new requirement explicitly changes it.
3. Treat subject-specific differences as intentional, not as inconsistencies.
4. Keep shared architecture generic while allowing subject-specific content, question systems, simulations, and presentation requirements.
5. Never force every subject into the Physics/Economics question model.
6. Never create a new subject-specific copy of the entire mission architecture merely because a subject has different question types.
7. Never change the database schema, Prisma schema, migrations, or database files unless the task explicitly belongs to the Database AI.
8. If a requested capability cannot be represented by the current contracts, stop and report the exact capability gap instead of silently changing unrelated architecture.
9. Preserve backward compatibility with existing working features.
10. Prefer additive, modular, data-driven changes.

This file is the product-level contract. Database-specific implementation details remain owned by the Database AI and existing database documentation.

## 2. Product identity

Nextess is a serious, production-grade learning webapp focused on real-world learning, investigation, problem solving, reasoning, and applied understanding.

It is NOT intended to be a conventional exam-question website.

The experience should combine:
- real-world missions
- guided learning
- investigation
- evidence/data interpretation
- interactive simulations where appropriate
- deterministic evaluation where the current system requires it
- visible progress
- rewards
- streaks
- achievements
- short-term goals
- optional competition
- frequent but useful return prompts
- strong UI/UX clarity
- persistent progress for registered users
- anonymous exploration before account creation

Gamification exists to reinforce learning behavior. It must never become the purpose of the product.

## 3. Entry and account model

The primary product journey is:

**Open Nextess → Start exploring → Experience UI/UX → Try projects/missions → Decide whether to create an account**

A login page MUST NOT be the first gate.

Users can explore the interface, inspect subjects, start eligible missions, interact with supported learning content, experience simulations, and build temporary progress as an anonymous learner.

Signup/login must remain available from inside the webapp at any appropriate time.

When an anonymous learner creates an account, eligible anonymous progress should be migrated into the account according to the backend/database account-conversion contract.

Account creation is an invitation to save progress, streaks, achievements and history, not an unnecessary blocking wall.

## 4. Core learning loop

**Discover → Learn → Practice → Investigate → Solve → Receive feedback → Earn progress/rewards → Continue → Return**

A mission should make the next useful action obvious.

The interface should always answer:
- Where am I?
- What am I doing?
- Why am I doing it?
- What have I completed?
- What happens next?
- What have I earned?
- Where can I continue?

## 5. Shared mission architecture

The shared high-level structure is:

**Subject → Mission → Mission brief/scenario → Learning capsule where appropriate → Levels/stages → Subject-appropriate questions/tasks → Files/data/evidence where appropriate → Simulation where appropriate → Feedback → Level completion → Mission completion → Rewards/progress/achievement updates**

The shared structure is intentional.

However, the **question/task system is NOT globally identical**.

A subject may require different question/task types, answer mechanisms, evaluation logic, visual interaction, or evidence handling.

The mission shell remains reusable while the question/task layer is extensible.

## 6. Most important extensibility rule: subject-specific question systems

Nextess must NOT define one universal question list such as "every subject uses MCQ + numerical + text + prediction + analysis."

Different subjects can have fundamentally different learning interactions.

### Physics
Possible task families:
- numerical calculation
- graph/data interpretation
- variable manipulation
- prediction
- engineering diagnosis
- measurement analysis
- simulation-based reasoning
- multiple choice
- structured numerical response

### Economics
Possible task families:
- graph interpretation
- data analysis
- policy/decision selection
- economic reasoning
- scenario comparison
- numerical analysis
- market investigation
- structured choice

### Chemistry
Possible task families:
- reaction identification
- equation balancing
- observation interpretation
- reaction-condition selection
- molecular/particle reasoning
- experimental-data analysis
- numerical chemistry tasks
- structured classification

### Biology
Possible task families:
- biological-process sequencing
- specimen/diagram interpretation
- experimental-data analysis
- classification
- cause/effect reasoning
- population/ecosystem analysis
- evidence interpretation

### Geography
Possible task families:
- map interpretation
- spatial analysis
- climate/data interpretation
- location identification
- pattern detection
- GIS-like interaction
- source comparison

### History
Possible task families:
- chronology
- primary-source interpretation
- source reliability analysis
- cause/consequence
- evidence comparison
- historical decision/scenario analysis
- timeline interaction

These are examples, not a locked final list.

Each subject's actual question/task taxonomy must be defined by the relevant Content/Subject AI and approved against the architecture.

## 7. Shared question contract vs subject-specific implementation

### Shared question/task contract

Every interactive learning task should be able to communicate:
- task ID
- task type
- prompt/instructions
- supporting content/resources
- input mechanism
- expected answer/evaluation representation
- feedback
- hints where applicable
- explanation/reveal-answer content where applicable
- reward/progress result
- ordering
- completion state

### Subject-specific implementation

The actual task type and renderer can differ.

Conceptually:

**Shared Mission UI → Task Renderer Registry → Physics Task Renderer / Economics Task Renderer / Chemistry Task Renderer / Biology Task Renderer / Geography Task Renderer / History Task Renderer / future subject renderer**

The frontend must select the correct renderer from content/task metadata rather than hard-code one universal question component.

## 8. Subject question registry

Every subject should have an explicit question/task registry containing, as applicable:
- supported task types
- supported input types
- supported evaluation modes
- supported renderers
- optional simulation types
- mission templates

A new subject should be able to define these without duplicating the complete mission architecture.

## 9. Subject placeholders

The architecture must explicitly reserve future subject capacity for:
1. Physics — AVAILABLE/current
2. Economics — AVAILABLE/current
3. Chemistry — FUTURE PLACEHOLDER
4. Biology — FUTURE PLACEHOLDER
5. Geography — FUTURE PLACEHOLDER
6. History — FUTURE PLACEHOLDER

Each placeholder has room for:
- subject metadata
- question/task registry
- renderer registry
- mission templates
- simulation types
- resource/file patterns
- evaluation rules
- reward defaults
- content-authoring notes

A placeholder is not permission to invent final content. It is an architectural extension point.

## 10. Mission levels

The exact number of levels is controlled by the current product/database contract and must not be changed by frontend/content AIs without an explicit product/database decision.

Levels represent stages of the same mission.

A level may contain:
- objective
- questions/tasks
- evidence/files
- simulation
- subject-specific interactions
- completion/debrief
- reward

The frontend must not assume that every level contains the same interaction types.

Examples:
- Physics may contain a simulation and numerical analysis.
- History may contain source documents and a timeline interaction.
- Geography may contain map interaction and data tables.
- Biology may contain experiment data.
- Economics may contain graphs and decision tasks.

## 11. Learning capsules

Learning capsules are short guided learning experiences placed before or around problem solving where useful.

They should be concise, interactive, easy to scan, progressively revealed, visually clear, and focused on the knowledge needed for the mission.

Typical flow:

**Concept → Explanation → Example/visual → Quick understanding → Ready to solve**

The capsule framework is shared across subjects, but content format can be subject-specific.

## 12. Mission brief

Every mission should establish:
- mission title
- real-world scenario
- learner role where applicable
- objective
- relevant context
- difficulty
- expected type of thinking
- available evidence/resources
- simulation information if present
- rewards
- clear next action

## 13. Evidence and files

Mission evidence may include:
- reports
- data tables
- graphs
- observations
- images
- references
- concept briefs
- subject-specific evidence

The frontend should use reusable resource viewers.

Do not build a unique file viewer for every subject unless the learning interaction genuinely requires a different renderer.

## 14. Simulation architecture

Every subject MAY have its own simulation style.

Examples:
- Physics → interactive physical model
- Economics → graph/model interaction
- Chemistry → reaction/experiment model
- Biology → ecosystem/population/biological process model
- Geography → map/spatial interaction
- History → timeline/source investigation

A simulation is optional unless the mission genuinely requires one.

Simulation architecture should have:
- simulation identity
- simulation type
- renderer/engine key
- declarative configuration
- controllable variables
- deterministic rules where applicable
- outcomes/consequences
- runtime state where supported

Executable code must not be placed inside content data/configuration.

## 15. Gamification system

Nextess uses distinct progression concepts:
- KP/XP = learning/progression
- Coins = spendable reward currency
- Streak = consistency
- Badges/Achievements = milestones
- Leaderboard = optional competitive progression

These must not be treated as one generic points field.

Rewards should be meaningful and tied to learning actions.

## 16. Reward timing

Good reward events include:
- completing a learning capsule
- answering correctly
- completing a level
- completing a mission
- reaching a streak milestone
- earning a badge
- completing a contest

Do not reward meaningless UI actions such as repeatedly opening a page or clicking tabs.

The backend is authoritative for reward allocation. The frontend displays the result.

Reward allocation must be idempotent.

## 17. Streaks

The streak system should show:
- current streak
- best streak
- current-day state
- next streak milestone
- streak rewards
- recent activity

States may include active, at-risk, lost, and recovered/restarted where supported.

Losing a streak should not shame the learner. The goal is to encourage the learner to return.

## 18. Daily goals

The dashboard may show small meaningful goals such as:
- complete a mission
- complete a level
- answer a number of questions/tasks
- maintain today's streak
- complete a learning capsule

Progress should be visible.

## 19. Leaderboards

Leaderboards are an optional engagement layer, not the core learning mechanism.

The current product direction uses short contests and achievement/medal rewards.

Leaderboard systems must avoid rewarding meaningless grinding.

Only meaningful learning activity should materially affect competitive progress.

The interface should provide actionable proximity such as distance to the next position or milestone.

## 20. Badges and achievements

Badge categories can include:
- consistency
- mission completion
- perfect performance
- subject milestones
- challenge/contest achievements
- long-term learning milestones

Badges should represent something meaningful.

## 21. Resume and persistence

A learner should be able to leave and return without losing meaningful progress.

The application should be able to resume:
- subject
- mission
- level/stage
- current task/question
- appropriate task state
- simulation state where supported
- progress status

The UI should surface a clear **Continue Mission** action.

## 22. Anonymous learning

Anonymous exploration is a first-class product requirement.

Anonymous users may have temporary mission progress, activity, streak-related state, simulation state and learning interactions where supported by the existing backend/database architecture.

When an account is created, conversion should preserve eligible progress without duplication.

Do not create a separate frontend experience for anonymous users. Shared components should work for both anonymous and authenticated actors.

## 23. Engagement and return psychology

Use UX psychology responsibly.

Useful principles:
- progress visibility
- goal gradient
- small wins
- immediate feedback
- clear next action
- curiosity
- completion momentum
- personalized continuation
- reward anticipation
- recognition

Do not use manipulative dark patterns, shame, false scarcity, fabricated urgency, or misleading notifications.

## 24. Engagement prompts

Prompts should be contextual.

Examples:
- "Your streak is waiting. Complete today's learning activity."
- "You're partway through this mission. Continue from where you stopped."
- "One more level completes today's goal."
- "80 KP until your next milestone."
- "Complete a meaningful learning activity to progress."

Prompts must never fabricate urgency.

## 25. Mascot system

The puppy mascot is a consistent Nextess companion.

Possible states:
- happy
- thinking
- encouraging
- celebrating
- concerned/at-risk
- completion

Mascot messages should support the learning context and remain non-intrusive.

## 26. Frontend architecture rule

The frontend must be data-driven and reusable.

Recommended conceptual components:
- MissionShell
- MissionBrief
- LearningCapsule
- MissionLadder
- LevelView
- TaskRenderer
- SubjectTaskRegistry
- FileViewer
- SimulationPanel
- ProgressDisplay
- KPDisplay
- CoinDisplay
- StreakDisplay
- DailyGoals
- AchievementCard
- Leaderboard
- ResumeMissionCard
- CompletionCard
- EngagementPrompt
- Mascot

The frontend must not duplicate complete mission pages for each subject.

## 27. Backend authority rule

The backend is authoritative for:
- authentication
- authorization
- progress persistence
- answer evaluation where applicable
- reward allocation
- streak calculation
- badge/achievement awarding
- leaderboard data
- anonymous-to-account conversion
- anti-duplication/idempotency
- simulation rule evaluation where server-side evaluation is required

The frontend must never be trusted to award itself KP, coins, badges, or leaderboard progress.

## 28. Content AI rule

The Content/Mission AI creates educational content, not database architecture.

It must:
- read the current mission/content contract
- use the existing subject placeholder
- use the subject's approved question/task structure
- use appropriate evidence/files
- define hints/explanations where supported
- define simulations only when needed
- keep content realistic and educational
- never invent a database table to solve a content problem

If the subject requires a capability that the current data contract cannot represent, report the gap to the Database/Architecture AI.

## 29. Simulation AI rule

The Simulation AI must:
- read the subject's simulation requirements
- preserve the shared simulation contract
- provide the renderer/engine contract needed by frontend/backend
- define variables, inputs, outputs and deterministic consequences where applicable
- document the integration interface
- avoid executable logic inside database content

## 30. Database AI boundary

The Database AI owns:
- schema
- Prisma models
- migrations
- constraints
- indexes
- persistence structures
- content storage structures

No other AI should modify database files merely to make its own task easier.

If a capability gap genuinely requires schema changes, stop and report it.

## 31. Testing AI rule

Testing must cover shared behavior and subject-specific behavior, including:
- Physics task renderer
- Economics task renderer
- future subject placeholders
- unsupported task-type failure
- reward idempotency
- resume behavior
- anonymous conversion
- simulation state
- leaderboard consistency
- new missions without new hard-coded pages

## 32. Integration AI rule

The Integration AI must preserve explicit contracts between:

**Content → Database → Backend → API → Frontend**

and where relevant:

**Simulation → Backend → Frontend**

A subject-specific feature must not silently break other subjects.

## 33. Adding a new subject

Process:
1. Use the subject placeholder.
2. Define educational mission style.
3. Define question/task taxonomy.
4. Define input/evaluation models.
5. Define frontend task renderers.
6. Define optional simulation types.
7. Define evidence/file patterns.
8. Create missions using the shared mission structure.
9. Test the subject without changing unrelated subjects.
10. Request database changes only if an actual capability gap exists.

Do NOT clone the entire Physics mission architecture into another subject.

## 34. Adding a new question/task type

Before adding one:
1. Determine whether an existing type can represent it.
2. Reuse it if possible.
3. Otherwise define the new task contract.
4. Identify frontend/backend/database impact.
5. If persistence changes are required, flag the Database AI.
6. Add renderer/evaluator contract.
7. Add tests.
8. Add placeholder/example.
9. Document the new type.

A new question type is not automatically a new database table.

## 35. UI consistency rule

Shared UI remains consistent for:
- navigation
- typography
- spacing
- progress indicators
- reward displays
- mission shell
- completion cards
- mascot behavior
- account controls
- accessibility

Subject-specific UI is allowed when the learning interaction genuinely differs.

## 36. Accessibility and usability

Every new feature must consider:
- keyboard navigation
- readable contrast
- focus states
- touch targets
- responsive layouts
- screen-reader semantics where applicable
- reduced-motion preferences
- clear error states
- non-color-only feedback

## 37. Performance

Animations must be purposeful.

Avoid:
- excessive effects
- unnecessary re-renders
- large assets blocking initial load
- simulations freezing the page
- reward animations delaying navigation

The learner must always be able to continue.

## 38. Security and trust

Never trust client-provided:
- reward amounts
- completion status
- leaderboard scores
- correct-answer flags
- authorization state

Sensitive evaluation data should not be exposed before submission when that would enable cheating.

## 39. Change-control rule

Before changing anything, identify:
- what requirement changed
- which layer owns the change
- which files are affected
- which files must remain untouched
- whether an API/data contract changes
- whether a migration is required

If the task explicitly says not to touch a layer, respect that boundary.

## 40. Definition of done

A feature is complete only when:
- intended behavior is implemented
- existing behavior is preserved
- relevant contract is documented
- correct AI-owned layer was changed
- cross-layer contracts are explicit
- subject-specific behavior is isolated
- future subjects remain supported
- tests/validation cover the change
- no unrelated database/frontend/backend behavior was changed

## 41. Non-negotiable summary

**Nextess has one shared learning architecture, but not one identical question system.**

Shared architecture:

**Subject → Mission → Scenario → Learning → Levels → Tasks → Evidence → Optional Simulation → Feedback → Completion → Progress → Rewards**

The task/question layer is extensible per subject.

**Physics, Economics, Chemistry, Biology, Geography and History may use different task/question types and different renderers.**

Everything else should be shared wherever it genuinely can be.
