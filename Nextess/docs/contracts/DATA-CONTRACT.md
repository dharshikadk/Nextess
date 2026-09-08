# Nextess Data Contract

This is the logical data model. Exact Prisma syntax may differ, but semantics must remain.

## Core entities

```text
User
UserSetting
Subject
Project
ProjectVersion
Level
Question
QuestionVersion
Hint
CaseFile
CaseFileVersion
SimulationDefinition
Investigation
InvestigationAnswer
RewardLedger
Badge
UserBadge
StreakActivity
UserNote
Feedback
AuditEvent
```

## User

Fields:

- id
- name
- username (unique)
- passwordHash
- grade/class
- xpBalance or derived XP
- coinBalance or derived coins
- level
- createdAt
- updatedAt
- lastActivityAt

Sensitive authentication data must be isolated from public profile data.

## Subject

- id
- key
- displayName
- status
- ordering

Initial active subjects:

- physics
- economics

Future subjects can exist as disabled/coming-soon content.

## Project

A project/case is a persistent real-world situation.

- id
- subjectId
- slug
- title
- mission
- role
- priority
- problemType
- estimatedLength
- status
- currentPublishedVersionId

## ProjectVersion

Versioned content is important because completed investigations must remain interpretable.

- id
- projectId
- version
- status
- contentChecksum
- publishedAt
- retiredAt

A published version used by a student should never be mutated in place.

## Level

- id
- projectVersionId
- levelNumber
- title
- learningObjectives
- simulationDefinitionId
- completionRules

## Question

- id
- levelId
- questionNumber
- questionType
- prompt
- evaluationDefinition
- explanation
- consequenceDefinition

Question content should be versioned with the project version or independently through QuestionVersion.

## CaseFile

A file shown throughout a level.

- id
- projectVersionId
- name
- mimeType
- content
- displayMode
- ordering

`displayMode` may include:

- prose
- table
- report
- dataset

## Hint

- id
- questionId
- sequence
- text
- coinCost
- unlockRule

Hints should be authored content, not dynamically invented during scoring.

## Investigation

Represents a student's attempt/resume state.

- id
- userId
- projectVersionId
- currentLevelId
- status
- startedAt
- completedAt
- lastActivityAt

## InvestigationAnswer

- id
- investigationId
- questionId
- attemptNumber
- answerPayload
- normalizedAnswer
- result
- evaluatorVersion
- consequenceCode
- submittedAt

## RewardLedger

Immutable accounting events:

- id
- userId
- investigationId
- sourceId
- rewardType
- amount
- reasonCode
- idempotencyKey
- createdAt

Use a unique constraint on idempotencyKey where appropriate.

## Badge

- id
- key
- name
- description
- criteriaDefinition
- icon

## UserBadge

- userId
- badgeId
- earnedAt
- sourceEventId

## StreakActivity

- id
- userId
- activityDate
- activityType
- sourceId
- createdAt

Use a unique rule so one qualifying activity cannot create duplicate daily streak credit.

## UserNote

- id
- userId
- investigationId nullable
- content
- createdAt
- updatedAt

## Feedback

- id
- userId nullable
- category
- message
- status
- createdAt

## AuditEvent

- id
- actorType
- actorId
- action
- entityType
- entityId
- metadata
- createdAt

Never put secrets in metadata.

## Important constraints

- foreign keys on ownership relationships
- unique username
- unique project slug
- unique published version per project/version number
- unique badge key
- unique daily streak activity per user/day/type where required
- indexes on userId, projectId, subjectId, createdAt and leaderboard fields
- cascading deletes must be deliberate; never use broad cascade rules without review

## Content integrity

A project version should carry a checksum or equivalent immutable identifier. Attempts store the version they used.
