-- ============================================================================
-- NEXTESS SEED / TEMPLATE DATA
-- This file is intentionally NOT real educational content. It shows the
-- exact shape a content author (or an ingestion script) must produce to
-- add one real Physics mission and one real Economics mission later.
-- Every "TEMPLATE" / "PLACEHOLDER" string is a marker to replace.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. LOOKUP DATA -- consequence codes (physics simulation outcomes)
-- ----------------------------------------------------------------------------
INSERT INTO consequence_definition (code, label, description, severity) VALUES
  ('SYSTEM_STABLE',          'System Stable',            'The configuration stayed within safe operating limits.', 0),
  ('SAFE_CONFIGURATION',     'Safe Configuration',        'The chosen variables produce a safe, working configuration.', 0),
  ('TARGET_MISSED',          'Target Missed',             'The configuration did not reach the required target.', 1),
  ('LIMIT_EXCEEDED',         'Limit Exceeded',            'A monitored quantity exceeded its safe limit.', 2),
  ('ENERGY_LIMIT_EXCEEDED',  'Energy Limit Exceeded',     'The system consumed/stored more energy than the allowed limit.', 2),
  ('FAILURE',                'Failure',                   'The system failed under the chosen configuration.', 3)
ON CONFLICT (code) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 2. LOOKUP DATA -- mission problem types (extensible, both subjects)
-- ----------------------------------------------------------------------------
INSERT INTO mission_problem_type (code, label, description, subject_hint) VALUES
  ('ENGINEERING_DESIGN_CHALLENGE', 'Engineering Design Challenge', 'Design a system that satisfies given constraints.', 'PHYSICS'),
  ('FAULT_INVESTIGATION',          'Fault Investigation',         'Diagnose why a system failed or drifted from spec.', 'PHYSICS'),
  ('ECONOMIC_DECISION',            'Economic Decision',           'Make a policy/business decision under constraints.', 'ECONOMICS'),
  ('ECONOMIC_DETECTIVE',           'Economic Detective',          'Investigate data/reports to explain an economic event.', 'ECONOMICS'),
  ('FIX_THE_ECONOMY',              'Fix the Economy',             'Propose and evaluate interventions to correct a problem.', 'ECONOMICS'),
  ('MARKET_ANALYSIS',              'Market Analysis',             'Analyze market data/graphs to reach a conclusion.', 'ECONOMICS'),
  ('GOVERNMENT_BUDGET',            'Government Budget',           'Allocate a constrained budget across competing needs.', 'ECONOMICS'),
  ('GRAPH_INVESTIGATION',          'Graph Investigation',         'Read and interpret a graph to answer questions.', NULL)
ON CONFLICT (code) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 3. SUBJECTS (Home page data-driven subject tiles)
-- ----------------------------------------------------------------------------
INSERT INTO subject (code, name, description, status, display_order, icon) VALUES
  ('PHYSICS',    'Physics',    'Real-world engineering problems solved through investigation and simulation.', 'AVAILABLE',   1, '⚛️'),
  ('ECONOMICS',  'Economics',  'Real-world economic decisions solved through data, reports and analysis.',     'AVAILABLE',   2, '💹'),
  ('CHEMISTRY',  'Chemistry',  'Coming soon.',  'COMING_SOON', 3, '🧪'),
  ('BIOLOGY',    'Biology',    'Coming soon.',  'COMING_SOON', 4, '🧬'),
  ('HISTORY',    'History',    'Coming soon.',  'COMING_SOON', 5, '📜'),
  ('GEOGRAPHY',  'Geography',  'Coming soon.',  'COMING_SOON', 6, '🌍')
ON CONFLICT (code) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 4. CONCEPTS (a handful per subject, extend freely)
-- ----------------------------------------------------------------------------
INSERT INTO concept (subject_id, code, name, description)
SELECT s.id, c.code, c.name, c.description
FROM subject s
JOIN (VALUES
  ('PHYSICS', 'ELECTRIC_FIELD',       'Electric Field',        'Force per unit charge in a region of space.'),
  ('PHYSICS', 'ELECTRIC_POTENTIAL',   'Electric Potential',    'Potential energy per unit charge at a point.'),
  ('PHYSICS', 'POTENTIAL_DIFFERENCE', 'Potential Difference',  'Voltage between two points.'),
  ('ECONOMICS', 'INFLATION',          'Inflation',             'General rise in price levels over time.'),
  ('ECONOMICS', 'FISCAL_POLICY',      'Fiscal Policy',         'Government use of spending/taxation to influence the economy.'),
  ('ECONOMICS', 'SUPPLY_DEMAND',      'Supply and Demand',     'Relationship between quantity supplied/demanded and price.')
) AS c(subject_code, code, name, description) ON c.subject_code = s.code
ON CONFLICT (subject_id, code) DO NOTHING;

-- ============================================================================
-- 5. TEMPLATE PHYSICS MISSION  (placeholder content, real simulation wiring)
-- ============================================================================
WITH phys AS (SELECT id FROM subject WHERE code = 'PHYSICS'),
ins_mission AS (
  INSERT INTO mission (
    subject_id, slug, version, is_current, title, difficulty, description,
    mission_brief, role, priority, problem_type_code, estimated_length_minutes,
    xp_reward, coin_reward, status
  )
  SELECT id, 'template-physics-mission', 1, TRUE,
    '[TEMPLATE] Physics Mission Title',
    'MEDIUM',
    '[TEMPLATE] One-paragraph description of the persistent real-world situation.',
    '[TEMPLATE] Short pitch shown before the student starts the mission.',
    '[TEMPLATE] Role the student plays, e.g. "Junior Grid Engineer"',
    '[TEMPLATE] Narrative urgency label',
    'ENGINEERING_DESIGN_CHALLENGE',
    30, 100, 40, 'DRAFT'
  FROM phys
  RETURNING id
)
INSERT INTO mission_case (mission_id, title, situation, background, constraints, objective, extra)
SELECT id,
  '[TEMPLATE] Case Title',
  '[TEMPLATE] The persistent situation text shown at the top of the mission.',
  '[TEMPLATE] Background context.',
  '[TEMPLATE] Constraints the student must respect.',
  '[TEMPLATE] The objective the student is working toward.',
  '{}'::jsonb
FROM ins_mission;

-- Level 1..3 for the template physics mission
WITH m AS (SELECT id FROM mission WHERE slug = 'template-physics-mission' AND is_current),
lvl AS (
  INSERT INTO level (mission_id, level_number, slug, version, is_current, title, description, objective, xp_reward, coin_reward, completion_summary, concepts_applied, status)
  SELECT m.id, lv.n, lv.slug, 1, TRUE, lv.title, lv.description, lv.objective, 20, 10,
         '[TEMPLATE] Debrief summary for this level.',
         '[TEMPLATE] Concepts applied summary.',
         'DRAFT'
  FROM m, (VALUES
    (1, 'level-1-find-the-fault', '[TEMPLATE] Level 1 title', '[TEMPLATE] Level 1 description', '[TEMPLATE] Find where the system begins to fail'),
    (2, 'level-2-investigate',    '[TEMPLATE] Level 2 title', '[TEMPLATE] Level 2 description', '[TEMPLATE] Investigate the affected component'),
    (3, 'level-3-design-fix',     '[TEMPLATE] Level 3 title', '[TEMPLATE] Level 3 description', '[TEMPLATE] Design a safe configuration')
  ) AS lv(n, slug, title, description, objective)
  RETURNING id, level_number
)
SELECT * FROM lvl;

-- Mission-level concept overview file (required in every mission per spec)
INSERT INTO mission_file (mission_id, slug, version, is_current, name, file_type, description, display_order, content, status)
SELECT m.id, 'concept-brief', 1, TRUE,
  '[TEMPLATE] Concept Brief',
  'CONCEPT_BRIEF',
  'Use this file to get a quick overview of the concepts used in this mission before you start.',
  0,
  '{"sections": [{"heading": "[TEMPLATE] Concept", "body": "[TEMPLATE] Plain-language explanation."}]}'::jsonb,
  'DRAFT'
FROM mission m WHERE m.slug = 'template-physics-mission' AND m.is_current;

-- A level-scoped data file, shown as a table on the frontend
INSERT INTO mission_file (mission_id, level_id, slug, version, is_current, name, file_type, description, display_order, content, status)
SELECT m.id, l.id, 'engineering-report-1', 1, TRUE,
  '[TEMPLATE] Engineering Report #1',
  'ENGINEERING_REPORT',
  'Use this file to get data and information about the situation.',
  1,
  '{"table": {"columns": ["Reading", "Value", "Unit"], "rows": [["[TEMPLATE] Reading 1", "0", "V"]]}}'::jsonb,
  'DRAFT'
FROM mission m
JOIN level l ON l.mission_id = m.id AND l.level_number = 1 AND l.is_current
WHERE m.slug = 'template-physics-mission' AND m.is_current;

-- Simulation for level 1, with variables and one deterministic rule
WITH m AS (SELECT id FROM mission WHERE slug = 'template-physics-mission' AND is_current),
l1 AS (SELECT l.id FROM level l JOIN m ON l.mission_id = m.id WHERE l.level_number = 1 AND l.is_current),
sim AS (
  INSERT INTO simulation (mission_id, level_id, slug, version, is_current, title, description, engine, configuration, status)
  SELECT m.id, l1.id, 'sim-level-1', 1, TRUE,
    '[TEMPLATE] Simulation Title',
    'Use the variable controllers to see how the system changes.',
    '[TEMPLATE] frontend-engine-key',
    '{"canvas": "2d", "notes": "[TEMPLATE] safe declarative configuration only, no executable code"}'::jsonb,
    'DRAFT'
  FROM m, l1
  RETURNING id
)
INSERT INTO simulation_variable (simulation_id, name, label, unit, data_type, minimum, maximum, step, default_value, display_order)
SELECT sim.id, v.name, v.label, v.unit, 'NUMBER', v.minimum, v.maximum, v.step, v.default_value, v.display_order
FROM sim, (VALUES
  ('plateAPotential', 'Potential of Plate A', 'V', 0::numeric, 1000::numeric, 10::numeric, 300::numeric, 0)
) AS v(name, label, unit, minimum, maximum, step, default_value, display_order);

WITH sim AS (SELECT id FROM simulation WHERE slug = 'sim-level-1' AND is_current)
INSERT INTO simulation_rule (simulation_id, priority, conditions, consequence_code, message_key)
SELECT sim.id, 0,
  '{"op": ">", "left": "plateAPotential", "right": 900}'::jsonb,
  'LIMIT_EXCEEDED',
  'sim.limit_exceeded'
FROM sim;

-- One question in level 1, with option, hint and explanation
WITH m AS (SELECT id FROM mission WHERE slug = 'template-physics-mission' AND is_current),
l1 AS (SELECT l.id FROM level l JOIN m ON l.mission_id = m.id WHERE l.level_number = 1 AND l.is_current),
q AS (
  INSERT INTO question (level_id, question_number, slug, version, is_current, question_type, prompt, instruction, difficulty, answer_data_type, hint_cost_xp, max_attempts, xp_reward, coin_reward, display_order, status)
  SELECT l1.id, 1, 'q1-identify-field', 1, TRUE, 'CONCEPT_IDENTIFICATION',
    '[TEMPLATE] Question prompt text.',
    '[TEMPLATE] Instruction shown alongside the prompt.',
    'EASY', 'ENUM', 10, NULL, 10, 5, 0, 'DRAFT'
  FROM l1
  RETURNING id
)
SELECT * FROM q;

WITH q AS (SELECT id FROM question WHERE slug = 'q1-identify-field' AND is_current)
INSERT INTO question_option (question_id, option_text, option_value, display_order)
SELECT q.id, o.option_text, o.option_value, o.display_order
FROM q, (VALUES
  ('[TEMPLATE] Option A text', 'A', 0),
  ('[TEMPLATE] Option B text', 'B', 1)
) AS o(option_text, option_value, display_order);

INSERT INTO question_option_correctness (question_option_id, is_correct)
SELECT qo.id, (qo.option_value = 'A')
FROM question_option qo
JOIN question q ON q.id = qo.question_id AND q.slug = 'q1-identify-field' AND q.is_current;

INSERT INTO question_answer_key (question_id, correct_value, evaluation_rules)
SELECT id, 'A', '{"type": "single_choice"}'::jsonb
FROM question WHERE slug = 'q1-identify-field' AND is_current;

INSERT INTO hint (question_id, hint_number, content, cost_xp, display_order)
SELECT id, 1, '[TEMPLATE] First hint, nudges without revealing the formula.', 10, 0
FROM question WHERE slug = 'q1-identify-field' AND is_current;

INSERT INTO answer_explanation (question_id, overview, reasoning, concepts_used, calculation, final_result, simulation_interpretation, engineering_meaning)
SELECT id,
  '[TEMPLATE] One-line overview of the correct answer.',
  '[TEMPLATE] Step-by-step reasoning.',
  '[TEMPLATE] Electric Field, Potential Difference',
  '[TEMPLATE] E = V / d, ...',
  '[TEMPLATE] Final numeric/choice result.',
  '[TEMPLATE] What this means for the simulation outcome.',
  '[TEMPLATE] What this means for the engineering decision.'
FROM question WHERE slug = 'q1-identify-field' AND is_current;

INSERT INTO question_concept (question_id, concept_id)
SELECT q.id, c.id
FROM question q
JOIN concept c ON c.code = 'ELECTRIC_FIELD'
WHERE q.slug = 'q1-identify-field' AND q.is_current;

-- ============================================================================
-- 6. TEMPLATE ECONOMICS MISSION (placeholder content, no simulation)
-- ============================================================================
WITH econ AS (SELECT id FROM subject WHERE code = 'ECONOMICS'),
ins_mission AS (
  INSERT INTO mission (
    subject_id, slug, version, is_current, title, difficulty, description,
    mission_brief, role, priority, problem_type_code, estimated_length_minutes,
    xp_reward, coin_reward, status
  )
  SELECT id, 'template-economics-mission', 1, TRUE,
    '[TEMPLATE] Economics Mission Title',
    'MEDIUM',
    '[TEMPLATE] One-paragraph description of the persistent real-world situation.',
    '[TEMPLATE] Short pitch shown before the student starts the mission.',
    '[TEMPLATE] Role the student plays, e.g. "Junior Policy Analyst"',
    '[TEMPLATE] Narrative urgency label',
    'ECONOMIC_DECISION',
    30, 100, 40, 'DRAFT'
  FROM econ
  RETURNING id
)
INSERT INTO mission_case (mission_id, title, situation, background, constraints, objective, extra)
SELECT id,
  '[TEMPLATE] Case Title',
  '[TEMPLATE] The persistent situation text.',
  '[TEMPLATE] Background context.',
  '[TEMPLATE] Constraints.',
  '[TEMPLATE] Objective.',
  '{}'::jsonb
FROM ins_mission;

WITH m AS (SELECT id FROM mission WHERE slug = 'template-economics-mission' AND is_current)
INSERT INTO level (mission_id, level_number, slug, version, is_current, title, description, objective, xp_reward, coin_reward, completion_summary, concepts_applied, status)
SELECT m.id, lv.n, lv.slug, 1, TRUE, lv.title, lv.description, lv.objective, 20, 10,
       '[TEMPLATE] Debrief summary for this level.',
       '[TEMPLATE] Concepts applied summary.',
       'DRAFT'
FROM m, (VALUES
  (1, 'level-1-read-the-data',  '[TEMPLATE] Level 1 title', '[TEMPLATE] Level 1 description', '[TEMPLATE] Understand the current market data'),
  (2, 'level-2-diagnose',       '[TEMPLATE] Level 2 title', '[TEMPLATE] Level 2 description', '[TEMPLATE] Diagnose the cause'),
  (3, 'level-3-recommend',      '[TEMPLATE] Level 3 title', '[TEMPLATE] Level 3 description', '[TEMPLATE] Recommend a policy response')
) AS lv(n, slug, title, description, objective);

INSERT INTO mission_file (mission_id, slug, version, is_current, name, file_type, description, display_order, content, status)
SELECT m.id, 'concept-brief', 1, TRUE,
  '[TEMPLATE] Concept Brief',
  'CONCEPT_BRIEF',
  'Use this file to get a quick overview of the concepts used in this mission before you start.',
  0,
  '{"sections": [{"heading": "[TEMPLATE] Concept", "body": "[TEMPLATE] Plain-language explanation."}]}'::jsonb,
  'DRAFT'
FROM mission m WHERE m.slug = 'template-economics-mission' AND m.is_current;

INSERT INTO mission_file (mission_id, level_id, slug, version, is_current, name, file_type, description, display_order, content, status)
SELECT m.id, l.id, 'economic-report-1', 1, TRUE,
  '[TEMPLATE] Economic Report #1',
  'ECONOMIC_REPORT',
  'Use these files to get data and info about the situation.',
  1,
  '{"table": {"columns": ["Quarter", "Inflation %", "Unemployment %"], "rows": [["[TEMPLATE] Q1", "0.0", "0.0"]]}}'::jsonb,
  'DRAFT'
FROM mission m
JOIN level l ON l.mission_id = m.id AND l.level_number = 1 AND l.is_current
WHERE m.slug = 'template-economics-mission' AND m.is_current;

WITH m AS (SELECT id FROM mission WHERE slug = 'template-economics-mission' AND is_current),
l1 AS (SELECT l.id FROM level l JOIN m ON l.mission_id = m.id WHERE l.level_number = 1 AND l.is_current),
q AS (
  INSERT INTO question (level_id, question_number, slug, version, is_current, question_type, prompt, instruction, difficulty, answer_data_type, hint_cost_xp, max_attempts, xp_reward, coin_reward, display_order, status)
  SELECT l1.id, 1, 'q1-interpret-data', 1, TRUE, 'ANALYSIS',
    '[TEMPLATE] Question prompt text.',
    '[TEMPLATE] Instruction.',
    'EASY', 'NUMBER', 10, NULL, 10, 5, 0, 'DRAFT'
  FROM l1
  RETURNING id
)
INSERT INTO question_answer_key (question_id, correct_value, tolerance, evaluation_rules)
SELECT id, '4.2', 0.1, '{"type": "numeric_tolerance"}'::jsonb FROM q;

-- ============================================================================
-- 7. BADGES
-- ============================================================================
INSERT INTO badge (code, name, description, icon, criteria, active) VALUES
  ('FIRST_MISSION_COMPLETE', 'First Steps', 'Complete your first mission.', '🏅',
   '{"type": "mission_completion_count", "threshold": 1}'::jsonb, TRUE),
  ('NO_HINTS_LEVEL',         'Sharp Mind', 'Complete a level without using any hints.', '🧠',
   '{"type": "level_completion_no_hints", "threshold": 1}'::jsonb, TRUE),
  ('SEVEN_DAY_STREAK',       'Week Warrior', 'Maintain a 7-day learning streak.', '🔥',
   '{"type": "streak_length", "threshold": 7}'::jsonb, TRUE)
ON CONFLICT (code) DO NOTHING;

COMMIT;
