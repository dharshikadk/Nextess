# Adding a real Physics or Economics mission later

The schema never needs to change to add real content — you insert rows following the same shape as `sql/002_seed_template.sql`. This is the exact checklist an ingestion script (or a future admin tool) should follow.

## 1. Mission

```sql
INSERT INTO mission (subject_id, slug, version, is_current, title, difficulty,
                      description, mission_brief, role, priority, problem_type_code,
                      estimated_length_minutes, xp_reward, coin_reward, status)
VALUES (:subjectId, 'real-mission-slug', 1, TRUE, 'Real Title', 'MEDIUM', ...,
        'ENGINEERING_DESIGN_CHALLENGE' | 'ECONOMIC_DECISION' | ..., 30, 100, 40, 'DRAFT');
```
Keep `status = 'DRAFT'` until content review is done, then flip to `'PUBLISHED'` — a `DRAFT` mission is never surfaced by the "available missions" query (`WHERE is_current AND status = 'PUBLISHED'`).

## 2. Mission case (the persistent situation)

One row, 1:1 with the mission, in `mission_case`. `extra` (JSONB) can hold any additional structured sections a specific mission needs without a migration.

## 3. Levels (exactly 3, per the frontend spec)

Three rows in `level`, `level_number` 1/2/3, each with its own `objective` (the different issue/stage of the same situation) and `completion_summary` (the canonical debrief template — the actual text shown to a specific student on completion is stored per-attempt in `level_completion.summary`, which can start from this template and be personalized).

## 4. Files

- **Always include** one `mission_file` with `file_type = 'CONCEPT_BRIEF'` scoped to the mission (no `level_id`) — the "brief overview of the concepts to help students beat the ambiguity" the frontend spec requires in every mission.
- Add one or more `REPORT`/`DATA_TABLE`/`ENGINEERING_REPORT`/`ECONOMIC_REPORT`/`GRAPH`/`OBSERVATION`/`REFERENCE` files per level as needed. `content` is JSONB — for anything the frontend renders as a table, shape it as `{"table": {"columns": [...], "rows": [[...], ...]}}` so the frontend can render it directly without guessing a format.
- For large/binary assets (e.g. a real scanned report image), put the file in object storage and reference it via `storage_object_key`; don't put binary data in `content`.

## 5. Physics only — Simulation

Skip this whole section for Economics missions.

1. One `simulation` row per level that has one, with `engine` set to whatever key your frontend's simulation renderer registry expects (e.g. `'electrostatics-2d'`).
2. One `simulation_variable` row per controllable input (name/label/unit/min/max/step/default) — this directly drives the "variable controllers" UI.
3. One or more `simulation_rule` rows. `conditions` must be a **safe JSON expression**, never code:
   ```json
   {"op": ">", "left": "electricField", "right": "maximumField"}
   ```
   `consequence_code` must reference an existing `consequence_definition.code`. If your mission needs a new outcome type (e.g. `OVERLOAD_TRIP`), insert it into `consequence_definition` first — never invent a code inline that isn't registered there; the foreign key will reject it if you try.
4. The backend's rule-evaluator (application code, not the database) reads these rows, evaluates the variables the student set against each rule in `priority` order, and returns the first matching `consequence_code`.

## 6. Questions

Per question: one `question` row, then whichever of these apply:
- `question_option` (+ `question_option_correctness`) if it's a multiple-choice-style question.
- `question_answer_key` for numeric/text/decision questions — `tolerance` for numeric answers, `evaluation_rules` JSON for anything more structured (e.g. multi-part engineering decisions).
- One or more `hint` rows, ordered by `hint_number`, each progressively less subtle. `cost_xp` matches the "+10 XP to unlock a hint" rule from the frontend spec.
- One `answer_explanation` row — this is what "Reveal Answer" shows. Fill in every field you can (`reasoning`, `calculation`, `simulation_interpretation` for physics / `engineering_meaning`, etc.) so the explanation actually walks through every step, not just the final number.
- `question_concept` rows linking to one or more `concept` rows, so analytics can later say "this student struggles with Potential Difference" rather than only "this student struggles with Question #14."

## 7. Publishing

Flip `status` from `DRAFT` to `PUBLISHED` on the mission (and its levels/questions/files/simulation) once content review passes. `is_current` stays `TRUE` on the first version of everything; you only touch `is_current`/`previous_version_id` when you're releasing a **revision** of already-published content (see `ARCHITECTURE.md` section I) — never edit a published row in place.

## 8. Badges tied to the new mission (optional)

If the mission should award a mission-specific badge, add a `badge` row with a `criteria` JSON the backend's badge-awarding service understands (e.g. `{"type": "mission_completion", "missionSlug": "real-mission-slug"}`), rather than hardcoding the check in frontend JavaScript.

---

`sql/002_seed_template.sql` is a complete worked example of every step above for both a Physics mission (with simulation) and an Economics mission (without) — copy its structure, not its placeholder text.
