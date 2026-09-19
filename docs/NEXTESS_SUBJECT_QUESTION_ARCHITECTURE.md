# Nextess — Subject & Question/Task Architecture

This document defines the subject-specific extension layer because **not every subject uses the same question/task types**.

## 1. Shared vs variable architecture

### Shared
- subject identity
- mission shell
- mission scenario
- learning capsule framework
- mission progression
- levels/stages
- resource/file framework
- optional simulation framework
- progress/resume
- rewards
- streaks
- badges
- engagement
- account/anonymous behavior
- analytics/event concepts
- frontend design system

### Variable by subject
- question/task taxonomy
- answer/input mechanism
- evaluator
- task renderer
- evidence interpretation
- visualization
- simulation style
- subject-specific learning interaction

The variable layer plugs into the shared architecture.

## 2. Subject registry placeholders

### PHYSICS
Status: AVAILABLE

Possible task families:
- numerical
- graph/data interpretation
- prediction
- investigation
- engineering diagnosis
- simulation interaction
- structured choice

Possible simulation family: interactive physical model.

### ECONOMICS
Status: AVAILABLE

Possible task families:
- graph interpretation
- data analysis
- decision/policy selection
- scenario reasoning
- numerical analysis
- market investigation
- structured comparison

Possible simulation family: economic graph/model interaction.

### CHEMISTRY
Status: FUTURE PLACEHOLDER

Possible task families to be defined by the Content/Subject AI:
- reaction identification
- equation balancing
- observation interpretation
- experimental-data analysis
- reaction-condition selection
- molecular/particle reasoning
- numerical chemistry task
- structured classification

Possible simulation family: reaction/experiment lab.

These are examples, not final locked requirements.

### BIOLOGY
Status: FUTURE PLACEHOLDER

Possible task families:
- biological process sequencing
- diagram/specimen interpretation
- experimental-data analysis
- classification
- cause/effect
- ecosystem/population analysis
- evidence interpretation

Possible simulation family: ecosystem/population/biological-process model.

### GEOGRAPHY
Status: FUTURE PLACEHOLDER

Possible task families:
- map interpretation
- spatial pattern analysis
- climate/data interpretation
- location identification
- source comparison
- GIS-style interaction

Possible simulation family: map/spatial interaction.

### HISTORY
Status: FUTURE PLACEHOLDER

Possible task families:
- chronology
- timeline ordering
- primary-source interpretation
- source reliability
- cause/consequence
- evidence comparison
- historical scenario/decision

Possible simulation family: timeline/source investigation.

## 3. Task renderer architecture

Conceptual registry:

    TaskRendererRegistry
    ├── physics
    │   ├── numerical
    │   ├── graph
    │   ├── investigation
    │   └── simulation
    ├── economics
    │   ├── graph
    │   ├── decision
    │   ├── data-analysis
    │   └── numerical
    ├── chemistry
    │   └── future task renderers
    ├── biology
    │   └── future task renderers
    ├── geography
    │   └── future task renderers
    └── history
        └── future task renderers

The exact implementation technology is owned by the Frontend AI.

## 4. Task contract

Every renderer should receive a normalized task contract containing, where applicable:
- task ID
- subject
- task type
- prompt
- instructions
- resources
- input schema
- answer/evaluation metadata appropriate for the client
- hint availability
- explanation availability
- display order
- state
- progress information

Do not expose authoritative answers/correctness metadata before submission when that would enable cheating.

## 5. Subject-specific task state

A task may have state beyond a simple selected answer.

Examples:
- Physics: variable settings
- Economics: selected graph controls
- Chemistry: reagent/condition settings
- Biology: simulation variables
- Geography: selected map layers/location
- History: selected timeline/source evidence

The shared progress system should support task state without requiring every subject to have the same state shape.

## 6. Content creation rule

A Content AI must first choose the subject.

Then it must consult that subject's task registry.

It must NOT choose a universal question type simply because it is convenient for the database.

Choose the interaction that best represents the intended learning outcome.

If the current persistence/evaluation contract cannot support the chosen task, report the capability gap.

## 7. New subject checklist

Before publishing a new subject:
- subject placeholder exists
- subject task taxonomy documented
- task input formats documented
- evaluator behavior documented
- renderer requirements documented
- simulation requirements documented if applicable
- resource/file needs documented
- example mission structure documented
- frontend renderer tested
- backend evaluator tested
- persistence contract verified
- cross-subject regression tests pass

## 8. New task-type checklist

For a genuinely new task type:
- name
- purpose
- learning objective
- prompt structure
- input structure
- evaluation method
- feedback behavior
- hint behavior
- explanation behavior
- renderer
- backend contract
- persistence requirements
- accessibility requirements
- test cases
- example placeholder

must be documented.

## 9. Important rule

**Different question systems do not mean different Nextess architectures.**

Architecture:

    Shared Mission Framework
            ↓
    Subject Task Registry
            ↓
    Subject-specific Renderer/Evaluator
            ↓
    Shared Progress + Reward + Engagement Systems
