# Nextess Mission Content Contract (MISSION_CONTENT_SPEC.md)

This is the contract a future **Content/Mission AI** (or human content author) must follow to add a mission for **any** subject — Physics, Economics, or a future subject like Chemistry, Biology, Geography, or History — **without any Prisma schema change, migration, or code change.**

> **Core rule:** if what you're doing is "write a new mission using entity types that already exist" → it's a content operation, follow this document. If you need a genuinely new *kind* of field, question type, file type, or simulation category the schema doesn't support at all → that's a capability change, stop and flag it for a database/schema change instead of forcing it into existing fields.

## 0. Naming note — generic concept → actual table

The requirements brief for this contract used generic names for common mission concepts. To avoid an unnecessary rename/migration of an already-working, already-validated schema, here is the exact mapping. **Use the right-hand column** when writing INSERT statements or Prisma Client calls — the left-hand names are the vocabulary this document uses when talking about the concept in the abstract.

| Generic concept | Actual Nextess table/model |
|---|---|
| Subject | `subject` |
| Mission | `mission` + `mission_case` (the persistent scenario) |
| MissionStage | `level` (a mission has exactly 3 levels/stages today; see §5) |
| Question | `question` |
| Hint | `hint` |
| Resource / Data File | `mission_file` |
| Evaluation / Answer | `question_answer_key` (correct value/tolerance/rules), `question_option` + `question_option_correctness` (for choice questions), `answer_explanation` (the "Reveal Answer" walkthrough) |
| Progress / Submission | `user_mission_progress`, `user_level_progress`, `user_question_progress`, `user_response` — **not written by content authors**, populated at runtime |
| Rewards | `reward_transaction` (ledger), `badge`/`user_badge` — mission/level/question `xp_reward`/`coin_reward` fields declare the *amount*; the ledger is written at runtime, not by content authors |
| Simulation | `simulation` + `simulation_variable` + `simulation_rule` + `simulation_type` (lookup) |
| Simulation state | `user_simulation_state` — **not written by content authors**, populated at runtime as students interact |
| Concept tag | `concept` + `question_concept` |

## 1. The golden rule of this schema: content is versioned by row, never by UPDATE

Every content table below (`mission`, `level`, `question`, `mission_file`, `simulation`) has: `slug` (stable logical identifier), `version` (integer), `is_current` (boolean), `status` (`DRAFT` | `PUBLISHED` | `ARCHIVED`).

- **A Content AI creating a brand-new mission** always inserts `version = 1, is_current = true, status = 'DRAFT'`.
- **A Content AI revising an existing, already-`PUBLISHED` mission** must NOT run an `UPDATE` on the published row. It inserts a new row with the same `slug`, `version = <old version> + 1`, `is_current = true`, `previous_version_id = <old row's id>`, and the database (via a partial unique index) automatically prevents two rows sharing a slug from both being `is_current`. Content authoring tooling must set the old row's `is_current = false` in the same transaction.
- Never delete a `PUBLISHED` content row that has any student history pointing at it (progress/response/completion tables use `ON DELETE RESTRICT` against content — the database will refuse the delete). Use `status = 'ARCHIVED'` instead.

## 2. Subject

Missions attach to an **existing** `subject.id` — a Content AI does not create subjects. All six subjects already exist:

| code | status today |
|---|---|
| PHYSICS | AVAILABLE |
| ECONOMICS | AVAILABLE |
| CHEMISTRY | COMING_SOON |
| BIOLOGY | COMING_SOON |
| HISTORY | COMING_SOON |
| GEOGRAPHY | COMING_SOON |

A Content AI may add missions to a `COMING_SOON` subject in `DRAFT` status at any time (content review can happen before the subject flips to `AVAILABLE` on the home page). **Flipping a subject's `status` to `AVAILABLE` is a product decision, not something the Content AI should do automatically** just because it added a mission — call it out for a human/product owner to flip once there's enough reviewed content.

## 3. Mission

Required fields (`mission` table):

| Field | Type | Notes |
|---|---|---|
| `subject_id` | UUID FK | must reference an existing `subject.id` |
| `slug` | string | stable, kebab-case, unique per version chain, e.g. `chem-titration-mystery` |
| `title` | string | ≤ 200 chars |
| `difficulty` | `EASY`\|`MEDIUM`\|`HARD`\|`HARDEST` | controlled enum, do not invent new values |
| `problem_type_code` | string FK, optional but recommended | must reference an existing `mission_problem_type.code`. If the mission's style genuinely doesn't fit any existing code (see §3a), that's a lookup-table *data* addition, not a schema change — insert a new row into `mission_problem_type` first. |
| `status` | `DRAFT` initially | Content AI never sets `PUBLISHED` directly — that's a review gate |

Optional but strongly recommended: `description`, `mission_brief`, `role`, `priority`, `estimated_length_minutes`, `xp_reward`, `coin_reward` (both ≥ 0).

**Scenario / case** goes in a 1:1 `mission_case` row: `title`, `situation` (required — the persistent real-world situation text), `background`, `constraints`, `objective`. Use the `extra` JSONB field for any subject-specific structured content that doesn't fit those columns (e.g. a Geography mission's starting map bounding box, a History mission's era/date range) — this is exactly what that field is for; **do not** ask for a schema change to add a narrow, mission-specific field when `extra` JSONB already covers it.

### 3a. `mission_problem_type` — extensible without a schema change

Existing rows include `ENGINEERING_DESIGN_CHALLENGE`, `FAULT_INVESTIGATION`, `ECONOMIC_DECISION`, `ECONOMIC_DETECTIVE`, `FIX_THE_ECONOMY`, `MARKET_ANALYSIS`, `GOVERNMENT_BUDGET`, `GRAPH_INVESTIGATION`. A Content AI building, say, a History mission styled as "read primary sources and reach a verdict" should first check whether an existing code fits (`GRAPH_INVESTIGATION`/generic ones might not); if not, **insert one new row** into `mission_problem_type` (`code`, `label`, `description`, `subject_hint`) before referencing it from the mission. This is a content/data operation, not a migration.

## 4. Files / Resources (`mission_file`)

Every mission **must** have at least one file with `file_type = 'CONCEPT_BRIEF'` (mission-scoped, `level_id = NULL`) — a plain-language overview of the concepts involved, satisfying the "beat the ambiguity" requirement from the original frontend spec, for every subject alike.

Other files are scoped to a specific `level_id` when they should only appear once the student reaches that level; otherwise leave `level_id` null for mission-wide files.

`file_type` is a controlled enum: `REPORT`, `DATA_TABLE`, `OBSERVATION`, `ENGINEERING_REPORT`, `ECONOMIC_REPORT`, `GRAPH`, `REFERENCE`, `CONCEPT_BRIEF`. These names are subject-neutral on purpose — a Biology mission's population data table is a `DATA_TABLE`, a History mission's primary-source excerpt is a `REFERENCE` or `REPORT`, a Geography mission's climate data is a `DATA_TABLE` or `GRAPH`. **Do not request new file types per subject** — these eight cover any structured evidence a mission needs; if genuinely nothing fits, that is a rare capability gap to flag, not a default action.

`content` is JSONB. For anything the frontend should render as a table, use exactly this shape so the renderer doesn't need subject-specific parsing:
```json
{"table": {"columns": ["Col A", "Col B"], "rows": [["v1", "v2"], ["v3", "v4"]]}}
```
For narrative/report content, use a `sections` shape:
```json
{"sections": [{"heading": "...", "body": "..."}]}
```
For large/binary assets (scanned documents, images), do not put binary data in `content` — store the asset in object storage and put its key in `storage_object_key`.

## 5. Stages / Levels (`level`)

Every mission has **exactly 3 levels** (`level_number` 1, 2, 3), per the existing product design — the same persistent situation addressed at three stages. Required per level: `title`, `objective` (what this stage is about, e.g. "Diagnose the cause"), `xp_reward`, `coin_reward` ≥ 0. `completion_summary` and `concepts_applied` are the canonical debrief template shown at the end of the level — write these as if speaking directly to the student, since the runtime copies this into the student's own `level_completion.summary` on completion.

## 6. Questions (`question`)

Each level holds an ordered set of questions (`question_number`, `display_order`). Required: `question_type`, `prompt`, `answer_data_type`, `hint_cost_xp` (≥ 0, default 10 — matches the "+10 XP to unlock a hint" product rule), `xp_reward`, `coin_reward`.

`question_type` is a controlled enum — pick whichever genuinely matches, regardless of subject:

| Type | Typical use |
|---|---|
| `CONCEPT_IDENTIFICATION` | "which concept explains this observation" |
| `INVESTIGATION` | "what does this file/data tell you" |
| `NUMERICAL` | requires a computed number |
| `PREDICTION` | "what will happen if..." |
| `WHAT_IF` | counterfactual/scenario branching |
| `ANALYSIS` | interpret data/evidence and explain |
| `DECISION` | choose a course of action under constraints |
| `ENGINEERING_DESIGN` | design/configure a system to meet a spec |

`answer_data_type` (`NUMBER`\|`INTEGER`\|`BOOLEAN`\|`TEXT`\|`ENUM`) tells the evaluator what shape to expect and determines whether you need `question_option` rows (for `ENUM`/choice questions) or a `question_answer_key` row (for `NUMBER`/`TEXT`/others).

### 6a. Evaluation / Answer

- **Choice questions**: insert `question_option` rows (`option_text`, `option_value`, `display_order`), then a matching `question_option_correctness` row per option (`is_correct` true/false). **Never expose `is_correct` in the same query path a client-facing "list options" API would use** — it deliberately lives in a separate table for this reason; keep authoring it that way.
- **Numeric/text/structured questions**: one `question_answer_key` row — `correct_value` (canonical answer as text), `tolerance` (numeric-only, e.g. `0.1` for a computed result), `evaluation_rules` JSONB for anything more structured (multi-part decisions, weighted criteria). This table is never joined into a pre-submission client response either.
- **Every question must have exactly one `answer_explanation` row** — this is the full "Reveal Answer" walkthrough, and per the product's "student freedom to choose" rule it must explain *every step*, not just state the final answer. Fill `overview`, `reasoning`, `concepts_used`, `calculation` (if applicable), `final_result`, and whichever of `simulation_interpretation` / `engineering_meaning` fits the subject — leave the other blank rather than forcing an irrelevant field. A History or Geography question that has no calculation should just leave `calculation` null; that's expected, not an error.

### 6b. Hints

One or more `hint` rows per question, ordered by `hint_number`, each progressively less subtle (never jump straight to the formula/answer on hint 1). `cost_xp` defaults to 10; keep it consistent with the question's own `hint_cost_xp` unless there's a deliberate reason for a specific hint to cost differently.

### 6c. Concepts

Tag each question with one or more `concept` rows via `question_concept`. If a needed concept doesn't exist yet for the subject (e.g. Chemistry's "Reaction Rate"), insert it into `concept` (`subject_id`, `code`, `name`, `description`) first — this is a lookup/data addition, exactly like `mission_problem_type`, not a schema change. This tagging is what powers per-concept performance analytics later, so do not skip it.

## 7. Simulations — generic mechanism for every subject

Only add a `simulation` row if the mission stage genuinely needs an interactive, variable-driven experience. **Economics missions typically will not have one** (they use files/reports/questions instead) — that's expected and correct, not a gap.

Required fields:

| Field | Notes |
|---|---|
| `mission_id`, `level_id` | which stage the simulation belongs to |
| `engine` | the specific frontend renderer component key (e.g. `'electrostatics-2d'`, `'reaction-lab-titration'`, `'ecosystem-population-model'`, `'map-layer-explorer'`, `'timeline-investigation'`) — this is a frontend/backend integration contract, coordinate the exact string with whoever owns that renderer registry |
| `type_code` | FK into `simulation_type` — the **subject-agnostic category** (see table below). Prefer an existing type; if truly nothing fits, insert a new `simulation_type` row (data operation) rather than leaving it null or forcing a mismatched category |
| `configuration` | JSONB — **safe declarative configuration only.** Canvas/scene setup, starting conditions, visual layout hints. **Never put executable code (JS/Python/etc.) in this field or anywhere in the database** — the rule evaluator is backend application code that *interprets* this data |

Existing `simulation_type` vocabulary (extend by inserting new rows, never new tables):

| code | subject_hint |
|---|---|
| `PHYSICS_INTERACTIVE_MODEL` | PHYSICS |
| `ECONOMIC_GRAPH_MODEL` | ECONOMICS |
| `CHEMISTRY_REACTION_LAB` | CHEMISTRY |
| `BIOLOGY_ECOSYSTEM_MODEL` | BIOLOGY |
| `GEOGRAPHY_MAP_INTERACTION` | GEOGRAPHY |
| `HISTORY_TIMELINE_INVESTIGATION` | HISTORY |
| `GENERIC_INTERACTIVE` | (fallback, any subject) |

### 7a. Variables (`simulation_variable`)

One row per controllable input: `name` (machine key, camelCase, e.g. `reagentConcentration`), `label` (human-readable), `unit`, `data_type`, `minimum`/`maximum`/`step`/`default_value`. This directly drives whatever "variable controller" widgets the frontend renders — a Chemistry concentration slider and a Physics voltage slider are both just rows here.

### 7b. Rules (`simulation_rule`)

`conditions` is a **safe JSON expression**, e.g.:
```json
{"op": ">", "left": "reagentConcentration", "right": 0.8}
```
`consequence_code` must reference an existing `consequence_definition.code` (`SYSTEM_STABLE`, `SAFE_CONFIGURATION`, `TARGET_MISSED`, `LIMIT_EXCEEDED`, `ENERGY_LIMIT_EXCEEDED`, `FAILURE`). If a subject genuinely needs a new outcome category (e.g. Biology's `POPULATION_COLLAPSE`), insert it into `consequence_definition` first — data addition, not schema change. Rules are evaluated by backend code in `priority` order (lowest first); the database never executes a rule itself.

### 7c. Runtime state — not authored by the Content AI

`user_simulation_state` is written by the running application as students interact with controllers, not by content authoring. Don't insert rows here when creating a mission.

## 8. Rewards

Content authors declare reward *amounts* only: `mission.xp_reward`/`coin_reward`, `level.xp_reward`/`coin_reward`, `question.xp_reward`/`coin_reward`, `hint.cost_xp`. All must be ≥ 0. **Never write to `reward_transaction`, `app_user.xp`, or `app_user.coins` directly** — those are runtime ledger writes made by the backend when a student actually earns/spends something, keyed by a deterministic idempotency key. A Content AI's job stops at declaring the amounts a correct answer/level/mission *should* pay out.

Badges tied to a mission are optional: insert a `badge` row with a `criteria` JSON the backend's badge-awarding service understands (e.g. `{"type": "mission_completion", "missionSlug": "chem-titration-mystery"}`) rather than hardcoding the check anywhere in frontend code.

## 9. Ordering & IDs

- `level.level_number` and `question.question_number`/`display_order` control the ladder/sequence the student walks through. Numbers should be contiguous starting at 1 within their parent.
- All IDs are database-generated UUIDs (`gen_random_uuid()` / `default(uuid())` in Prisma) — a Content AI should never invent or hardcode a UUID; let inserts generate them and use returned IDs for child rows within the same transaction.
- All content for one mission (case, levels, files, simulations, questions, options, hints, explanations, concept tags) must be inserted in **one transaction** so a partially-written mission never becomes visible.

## 10. Required vs optional — quick reference

| Entity | Required | Optional |
|---|---|---|
| Mission | subject_id, slug, title, difficulty, status | description, mission_brief, role, priority, problem_type_code, estimated_length_minutes, xp/coin_reward |
| MissionCase | mission_id, title, situation | background, constraints, objective, extra |
| Level | mission_id, level_number, slug, title, objective | description, xp/coin_reward, completion_summary, concepts_applied |
| MissionFile | mission_id, slug, name, file_type, content | level_id, description, display_order, storage_object_key |
| Question | level_id, question_number, slug, question_type, prompt, answer_data_type | instruction, difficulty, hint_cost_xp (has default), max_attempts, xp/coin_reward |
| QuestionAnswerKey | question_id | correct_value, tolerance, evaluation_rules (at least one of these should be meaningfully populated) |
| QuestionOption | question_id, option_text, option_value | display_order |
| Hint | question_id, hint_number, content | cost_xp (has default) |
| AnswerExplanation | question_id, overview, reasoning | concepts_used, calculation, final_result, simulation_interpretation, engineering_meaning |
| Simulation | mission_id, level_id, slug, title, engine, type_code (recommended, nullable at the DB level) | description, configuration (defaults to `{}`) |
| SimulationVariable | simulation_id, name, label, data_type | unit, minimum, maximum, step, default_value |
| SimulationRule | simulation_id, conditions, consequence_code | priority (defaults to 0), message_key |

## 11. Validation rules a Content AI must self-check before inserting

1. `subject_id` exists and, if the subject is `COMING_SOON`, that's fine — just don't also flip its status.
2. `slug` values are unique within their scope (`mission.slug`+`version`; `level.slug` unique within the mission; `question.slug`/`mission_file.slug`/`simulation.slug` unique within their parent) and only one row per slug has `is_current = true`.
3. Every `xp_reward`/`coin_reward`/`cost_xp`/`hint_cost_xp` is ≥ 0.
4. Every enum field (`difficulty`, `question_type`, `answer_data_type`, `file_type`, `status`) uses one of the existing controlled values — do not invent new enum strings; if a new category is genuinely needed, that's a schema change to flag, not something to freehand.
5. Every `problem_type_code`/`concept` code/`consequence_code`/`simulation_type` code referenced actually exists in its lookup table first (insert the lookup row in the same transaction if it doesn't yet).
6. A choice question (`answer_data_type = 'ENUM'`) has at least 2 `question_option` rows and exactly the intended one(s) marked correct in `question_option_correctness`.
7. Every question has an `answer_explanation` row — "Reveal Answer" must never come up empty.
8. Every mission has at least one `CONCEPT_BRIEF` file.
9. Physics-style interactive missions have a `simulation` row with ≥ 1 `simulation_variable` and ≥ 1 `simulation_rule`; missions that don't need interactivity (most Economics, and likely early Chemistry/Biology/Geography/History missions) simply have none — don't force an empty simulation into existence.
10. `simulation.configuration` and `simulation_rule.conditions` contain only JSON — no code, no script tags, no serialized functions.

## 12. What the Mission AI should NOT do

- Do not create a new table, enum value, or Prisma model for a new subject or a new mission "style" — express it through `subject_id`, `problem_type_code`, `question_type`, `file_type`, and `simulation_type` instead.
- Do not `UPDATE` a `PUBLISHED` content row — version it (see §1).
- Do not write to progress, response, reward-ledger, or simulation-state tables — those are runtime-only.
- Do not flip a subject from `COMING_SOON` to `AVAILABLE` — flag it for a human.
- Do not invent a UUID or bypass the transaction boundary described in §9.
