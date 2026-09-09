# Nextess Data Contract

## Core entities

```text
AnonymousSession
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

## AnonymousSession

- id
- secure session identifier
- createdAt
- lastActivityAt
- expiresAt

This is separate from `User`.

## User

- id
- name
- username unique
- passwordHash
- grade/class
- level
- createdAt
- updatedAt
- lastActivityAt

## Subject

- id
- key
- displayName
- status
- ordering

Initial active subjects: Physics and Economics.

## Project

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
- anonymousAccess
- currentPublishedVersionId

## ProjectVersion

- id
- projectId
- version
- status
- contentChecksum
- publishedAt
- retiredAt

Published versions are immutable.

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
- consequenceDefinition
- explanation

## CaseFile

- id
- projectVersionId
- name
- mimeType
- content
- displayMode
- ordering

Display modes may include prose, table, report and dataset.

## Investigation

- id
- userId nullable
- anonymousSessionId nullable
- projectVersionId
- currentLevelId
- status
- startedAt
- completedAt
- lastActivityAt

An investigation must belong to either an authenticated user or an anonymous session according to state rules.

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

- id
- userId
- investigationId
- sourceId
- rewardType
- amount
- reasonCode
- idempotencyKey
- createdAt

Anonymous sessions should not automatically receive durable account rewards unless product rules explicitly define otherwise.

## Badge/UserBadge

Badge criteria are server-evaluated.

## StreakActivity

Daily qualifying activity is server-generated.

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

Never store secrets in audit metadata.

## Integrity rules

- foreign keys
- unique usernames
- unique project slugs
- unique content versions
- unique badge keys
- deliberate cascade policies
- indexes for ownership and frequently queried fields
