# Nextess Content Architecture

## Core content hierarchy

```text
Subject
  └── Project / persistent real-world case
       ├── Project version
       ├── Case files
       ├── Level 1
       │    ├── Question 1
       │    ├── Question 2
       │    ├── Question 3
       │    └── Question 4
       ├── Level 2
       └── Level 3
```

Each level stays within the same situation while addressing another issue or deeper analysis.

## Content language

Use intermediate-level English. Avoid unnecessarily advanced wording.

Questions should sound like investigations, not textbook commands.

Bad:

> Calculate X using formula Y.

Preferred:

> What change would make the system enter the unsafe region? Test your prediction.

## Question types

Recommended controlled types:

- observation
- diagnosis
- quantitative-investigation
- what-if
- prediction
- configuration
- engineering-decision
- evidence-comparison
- trend-analysis
- policy/business-decision

A content author can combine these without changing the investigation philosophy.

## Hints

Every question may have ordered hints.

Hints should move the learner forward:

1. identify the condition
2. identify the relevant quantity
3. connect quantities
4. suggest the relationship

Do not reveal the full answer prematurely.

Hint costs are content configuration, not frontend constants.

## Explanations

After solving/revealing:

1. situation
2. relevant concepts
3. why relevant
4. relationship
5. reasoning/calculation
6. result
7. simulation evidence

## Consequences

Consequences should describe what the student's choice causes.

Examples:

- stable
- target missed
- limit exceeded
- insufficient energy
- unstable configuration

Consequences should be deterministic and linked to simulation/evaluation rules.

## Level summary

Every level ends with:

- What You Learned
- Simulation Skills
- Engineering/Reasoning Skill

The summary is content authored and versioned.

## Content validation

Before publication check:

- every question has an evaluator
- every evaluator has tests
- answer explanation exists
- hints are ordered
- units are valid
- simulation variable IDs match question definitions
- no broken file references
- no duplicate IDs
- difficulty metadata is present
- learning objectives are present

## Content publishing

Use:

```text
draft -> review -> approved -> published -> retired
```

Never directly edit published content used by an active/completed investigation.
