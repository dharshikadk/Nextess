-- ============================================================================
-- MIGRATION: generic_simulation_type_and_state
-- Purpose: make "simulation type" and "simulation runtime state" first-class,
-- subject-agnostic concepts, per the mission content contract. Purely
-- additive — no existing table is dropped, renamed, or has a column removed.
--
-- Why this is needed even though `simulation.engine`/`configuration` already
-- existed: `engine` is a free-text frontend renderer key (e.g.
-- 'electrostatics-2d'), which conflates "what component renders this" with
-- "what kind of simulation this logically is". Content authors and analytics
-- need a small, controlled, extensible category ("simulation type") that
-- isn't tied to a specific frontend component version. We follow the exact
-- same lookup-table pattern already used for `consequence_definition` and
-- `mission_problem_type` — new categories are inserted as rows, never as an
-- enum migration and never as a new per-subject table.
--
-- `user_simulation_state` is new: a generic, actor-pattern table (same
-- user_id/anonymous_session_id CHECK convention as every other progress
-- table) that lets a student's in-progress simulation controller values be
-- resumed later, regardless of which subject's simulation it is.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Lookup table: controlled, extensible simulation categories.
--    One row per logical simulation category. Subjects add rows here, not
--    new tables. subject_hint is advisory only (like mission_problem_type).
-- ---------------------------------------------------------------------------
CREATE TABLE simulation_type (
  code          VARCHAR(64) PRIMARY KEY,
  label         VARCHAR(160) NOT NULL,
  description   TEXT,
  subject_hint  VARCHAR(32),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 2. Add the FK column to the existing `simulation` table. Nullable so this
--    is a zero-downtime, backward-compatible change against existing rows;
--    application/content layers should treat it as required for new rows
--    (enforced at the content-contract level, documented in
--    MISSION_CONTENT_SPEC.md, not as a hard NOT NULL — see rationale below).
-- ---------------------------------------------------------------------------
ALTER TABLE simulation
  ADD COLUMN type_code VARCHAR(64) REFERENCES simulation_type(code);

CREATE INDEX idx_simulation_type ON simulation(type_code);

-- ---------------------------------------------------------------------------
-- 3. Generic per-actor simulation runtime state. One row per (actor,
--    simulation): the last-known controller values / interaction state, so
--    a student can leave a simulation mid-adjustment and resume later.
--    This is intentionally separate from `simulation.configuration` (the
--    authored, static setup) and from `user_response.answer` (the final
--    submitted answer to a question) — it is transient working state.
-- ---------------------------------------------------------------------------
CREATE TABLE user_simulation_state (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID REFERENCES app_user(id) ON DELETE CASCADE,
  anonymous_session_id  UUID REFERENCES anonymous_session(id) ON DELETE CASCADE,
  simulation_id         UUID NOT NULL REFERENCES simulation(id) ON DELETE CASCADE,
  state                 JSONB NOT NULL DEFAULT '{}'::jsonb,   -- e.g. {"plateAPotential": 420}
  last_consequence_code VARCHAR(64) REFERENCES consequence_definition(code),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT ck_uss_owner CHECK (
    (user_id IS NOT NULL)::int + (anonymous_session_id IS NOT NULL)::int = 1
  )
);
CREATE UNIQUE INDEX uq_uss_user_simulation ON user_simulation_state(user_id, simulation_id) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX uq_uss_anon_simulation ON user_simulation_state(anonymous_session_id, simulation_id) WHERE anonymous_session_id IS NOT NULL;

CREATE TRIGGER trg_user_simulation_state_updated_at BEFORE UPDATE ON user_simulation_state
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- 4. Seed the initial controlled simulation-type vocabulary: one entry per
--    subject-style simulation experience named in the requirements, plus a
--    generic fallback. This is DATA, not a schema decision per subject —
--    adding a 7th subject's simulation style later is one more INSERT here.
-- ---------------------------------------------------------------------------
INSERT INTO simulation_type (code, label, description, subject_hint) VALUES
  ('PHYSICS_INTERACTIVE_MODEL',  'Physics Interactive Model',        'Variable-controller driven physical system simulation (fields, circuits, mechanics, etc.).', 'PHYSICS'),
  ('ECONOMIC_GRAPH_MODEL',       'Economic Graph / Data Model',      'Interactive economic graphs, market/supply-demand models, or data-driven scenario tools.', 'ECONOMICS'),
  ('CHEMISTRY_REACTION_LAB',     'Chemistry Reaction Lab',           'Virtual lab / reaction simulation with adjustable reagents, conditions, and observed outcomes.', 'CHEMISTRY'),
  ('BIOLOGY_ECOSYSTEM_MODEL',    'Biology Ecosystem Model',          'Population/ecosystem or physiological process simulation with adjustable parameters.', 'BIOLOGY'),
  ('GEOGRAPHY_MAP_INTERACTION',  'Geography Map Interaction',        'Map-based / geospatial interactive exploration and data layering.', 'GEOGRAPHY'),
  ('HISTORY_TIMELINE_INVESTIGATION', 'History Timeline Investigation', 'Timeline, map, or archive-based interactive historical investigation.', 'HISTORY'),
  ('GENERIC_INTERACTIVE',        'Generic Interactive',              'Fallback category for an interactive experience that does not fit an existing type yet.', NULL)
ON CONFLICT (code) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 5. Backfill: the one existing seeded simulation (template-physics-mission,
--    sim-level-1) predates this column. Classify it so no existing row is
--    left in an ambiguous state.
-- ---------------------------------------------------------------------------
UPDATE simulation
SET type_code = 'PHYSICS_INTERACTIVE_MODEL'
WHERE slug = 'sim-level-1' AND is_current AND type_code IS NULL;
