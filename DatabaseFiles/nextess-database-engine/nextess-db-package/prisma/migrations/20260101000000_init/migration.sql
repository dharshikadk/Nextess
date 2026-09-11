-- ============================================================================
-- NEXTESS DATABASE SCHEMA
-- PostgreSQL 16
-- ============================================================================
-- Design principles applied throughout:
--  1. Actor pattern: rows that can belong to a logged-in user OR an anonymous
--     session carry both user_id and anonymous_session_id as nullable FKs,
--     enforced by a CHECK constraint that exactly one is set.
--  2. Row-versioned content: Mission/Level/Question/MissionFile/Simulation/
--     SimulationRule are never UPDATEd once published. A content change
--     creates a NEW row (slug kept, version incremented, old row archived).
--     Every child row and every historical student record points at the
--     exact version row that was live when it was created, so old attempts
--     can never be silently reinterpreted against new content.
--  3. Controlled domain values: small closed sets (difficulty, question type,
--     file type, reward type...) are native Postgres ENUMs. Domain values
--     that content designers need to extend without a schema migration
--     (simulation consequence codes, mission problem types, badge codes)
--     live in small lookup tables with FK references instead.
--  4. The backend/database is the source of truth for xp, coins, streak,
--     correctness and completion. Nothing here allows the frontend to
--     directly assert those values without a corresponding transaction row.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;      -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS citext;        -- case-insensitive email/username

-- ============================================================================
-- SECTION 1: ENUMS (fixed, well-known domain values)
-- ============================================================================

CREATE TYPE theme_preference AS ENUM ('LIGHT', 'DARK', 'SYSTEM');

CREATE TYPE subject_status AS ENUM ('AVAILABLE', 'COMING_SOON', 'DISABLED');

-- Lifecycle of an authored content row (independent of a student's progress)
CREATE TYPE content_status AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

CREATE TYPE difficulty_level AS ENUM ('EASY', 'MEDIUM', 'HARD', 'HARDEST');

-- Status of a student's progress through a mission/level/question
CREATE TYPE progress_status AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');

CREATE TYPE mission_file_type AS ENUM (
  'REPORT', 'DATA_TABLE', 'OBSERVATION', 'ENGINEERING_REPORT',
  'ECONOMIC_REPORT', 'GRAPH', 'REFERENCE', 'CONCEPT_BRIEF'
);

CREATE TYPE question_type AS ENUM (
  'CONCEPT_IDENTIFICATION', 'INVESTIGATION', 'NUMERICAL', 'PREDICTION',
  'WHAT_IF', 'ANALYSIS', 'DECISION', 'ENGINEERING_DESIGN'
);

-- Underlying data shape of a question's expected answer / a sim variable
CREATE TYPE value_data_type AS ENUM ('NUMBER', 'INTEGER', 'BOOLEAN', 'TEXT', 'ENUM');

CREATE TYPE reward_type AS ENUM ('XP', 'COINS', 'BADGE');

CREATE TYPE reward_source AS ENUM (
  'QUESTION_CORRECT', 'HINT_UNLOCK_COST', 'LEVEL_COMPLETION',
  'MISSION_COMPLETION', 'STREAK_BONUS', 'BADGE_AWARD',
  'MANUAL_ADJUSTMENT', 'ACCOUNT_MIGRATION'
);

CREATE TYPE activity_type AS ENUM (
  'MISSION_STARTED', 'LEVEL_STARTED', 'QUESTION_ANSWERED',
  'LEVEL_COMPLETED', 'MISSION_COMPLETED', 'SIMULATION_RUN'
);

CREATE TYPE event_type AS ENUM (
  'PROJECT_OPENED', 'MISSION_STARTED', 'LEVEL_STARTED', 'QUESTION_VIEWED',
  'ANSWER_SUBMITTED', 'ANSWER_CORRECT', 'ANSWER_INCORRECT', 'HINT_USED',
  'ANSWER_REVEALED', 'SIMULATION_CHANGED', 'LEVEL_COMPLETED',
  'MISSION_COMPLETED', 'ACCOUNT_CREATED', 'THEME_CHANGED', 'FEEDBACK_SUBMITTED'
);

CREATE TYPE feedback_category AS ENUM ('BUG', 'SUGGESTION', 'CONTENT_ISSUE', 'GENERAL', 'PRAISE');

-- ============================================================================
-- SECTION 2: LOOKUP / REFERENCE TABLES (extensible controlled values)
-- ============================================================================

-- Registry of every simulation consequence code that is allowed to appear.
-- New consequence codes are added by inserting a row here, never by
-- letting a frontend/rule author write an arbitrary string.
CREATE TABLE consequence_definition (
  code          VARCHAR(64) PRIMARY KEY,          -- e.g. 'SYSTEM_STABLE'
  label         VARCHAR(160) NOT NULL,
  description   TEXT,
  severity      SMALLINT NOT NULL DEFAULT 0,       -- 0 = neutral/positive .. higher = worse
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Registry of mission "problem type" categories (Economic Decision,
-- Economic Detective, Graph Investigation, Design Challenge, ...).
-- Kept as data instead of an enum because subjects will keep inventing
-- new mission styles as content grows.
CREATE TABLE mission_problem_type (
  code          VARCHAR(64) PRIMARY KEY,
  label         VARCHAR(160) NOT NULL,
  description   TEXT,
  subject_hint  VARCHAR(32),                       -- optional: 'PHYSICS' | 'ECONOMICS' | NULL (any)
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- SECTION 3: AUTHENTICATION & IDENTITY
-- ============================================================================

CREATE TABLE app_user (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              VARCHAR(120) NOT NULL,
  username          CITEXT NOT NULL,
  email             CITEXT NOT NULL,
  grade             VARCHAR(32),                   -- class/grade, e.g. "10", "11-A"
  level             INTEGER NOT NULL DEFAULT 1,
  xp                INTEGER NOT NULL DEFAULT 0,
  coins             INTEGER NOT NULL DEFAULT 0,
  current_streak    INTEGER NOT NULL DEFAULT 0,
  longest_streak    INTEGER NOT NULL DEFAULT 0,
  last_activity_at  TIMESTAMPTZ,
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_app_user_username UNIQUE (username),
  CONSTRAINT uq_app_user_email UNIQUE (email),
  CONSTRAINT ck_app_user_xp_nonneg CHECK (xp >= 0),
  CONSTRAINT ck_app_user_coins_nonneg CHECK (coins >= 0),
  CONSTRAINT ck_app_user_streak_nonneg CHECK (current_streak >= 0 AND longest_streak >= 0)
);

-- Auth secrets kept out of the general profile table on purpose, so a
-- "give me this user's profile" query can never accidentally select a hash.
CREATE TABLE user_credential (
  user_id            UUID PRIMARY KEY REFERENCES app_user(id) ON DELETE CASCADE,
  password_hash      VARCHAR(255) NOT NULL,
  password_algo      VARCHAR(32) NOT NULL DEFAULT 'argon2id',
  password_updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  failed_login_count SMALLINT NOT NULL DEFAULT 0,
  locked_until       TIMESTAMPTZ
);

-- Anonymous, pre-account visitors. The browser only ever holds an opaque
-- token; only its salted hash is stored server-side.
CREATE TABLE anonymous_session (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token_hash    VARCHAR(255) NOT NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_active_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at            TIMESTAMPTZ NOT NULL,
  converted_to_user_id  UUID REFERENCES app_user(id) ON DELETE SET NULL,
  converted_at          TIMESTAMPTZ,
  CONSTRAINT uq_anon_session_token UNIQUE (session_token_hash)
);

-- Authenticated login sessions (web/mobile), separate from the long-lived
-- profile so tokens can be rotated/revoked independently.
CREATE TABLE user_session (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  refresh_token_hash VARCHAR(255) NOT NULL,
  user_agent        VARCHAR(255),
  ip_address        INET,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_used_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at        TIMESTAMPTZ NOT NULL,
  revoked_at        TIMESTAMPTZ,
  CONSTRAINT uq_user_session_token UNIQUE (refresh_token_hash)
);
CREATE INDEX idx_user_session_user ON user_session(user_id) WHERE revoked_at IS NULL;

CREATE TABLE user_setting (
  user_id     UUID PRIMARY KEY REFERENCES app_user(id) ON DELETE CASCADE,
  theme       theme_preference NOT NULL DEFAULT 'SYSTEM',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Anonymous visitors also get a theme preference, keyed off their session.
CREATE TABLE anonymous_setting (
  anonymous_session_id  UUID PRIMARY KEY REFERENCES anonymous_session(id) ON DELETE CASCADE,
  theme                 theme_preference NOT NULL DEFAULT 'SYSTEM',
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- SECTION 4: CONTENT DOMAIN  (Subject -> Mission -> Level -> Question)
-- ============================================================================

CREATE TABLE subject (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code          VARCHAR(32) NOT NULL,               -- 'PHYSICS', 'ECONOMICS', 'CHEMISTRY', ...
  name          VARCHAR(120) NOT NULL,
  description   TEXT,
  status        subject_status NOT NULL DEFAULT 'COMING_SOON',
  display_order INTEGER NOT NULL DEFAULT 0,
  icon          VARCHAR(64),                        -- icon key/emoji resolved by frontend
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_subject_code UNIQUE (code)
);

CREATE TABLE concept (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id    UUID NOT NULL REFERENCES subject(id) ON DELETE CASCADE,
  code          VARCHAR(64) NOT NULL,
  name          VARCHAR(160) NOT NULL,
  description   TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_concept_subject_code UNIQUE (subject_id, code)
);

-- MISSION: row-versioned. (slug, version) identifies one immutable content
-- snapshot; `is_current` marks the version students newly starting the
-- mission should be given. Historical progress rows keep pointing at
-- whatever version they actually started on.
CREATE TABLE mission (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id          UUID NOT NULL REFERENCES subject(id) ON DELETE RESTRICT,
  slug                VARCHAR(120) NOT NULL,
  version             INTEGER NOT NULL DEFAULT 1,
  is_current          BOOLEAN NOT NULL DEFAULT TRUE,
  title               VARCHAR(200) NOT NULL,
  difficulty          difficulty_level NOT NULL DEFAULT 'EASY',
  description         TEXT,
  mission_brief       TEXT,                          -- short pitch shown before starting
  role                VARCHAR(160),                   -- role the student plays, e.g. "Junior Grid Engineer"
  priority             VARCHAR(64),                    -- narrative urgency label, free text
  problem_type_code   VARCHAR(64) REFERENCES mission_problem_type(code),
  estimated_length_minutes INTEGER,
  xp_reward           INTEGER NOT NULL DEFAULT 0,
  coin_reward         INTEGER NOT NULL DEFAULT 0,
  status              content_status NOT NULL DEFAULT 'DRAFT',
  previous_version_id UUID REFERENCES mission(id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_mission_slug_version UNIQUE (slug, version),
  CONSTRAINT ck_mission_rewards_nonneg CHECK (xp_reward >= 0 AND coin_reward >= 0)
);
CREATE INDEX idx_mission_subject_current ON mission(subject_id) WHERE is_current AND status = 'PUBLISHED';
-- Only one row per slug may be flagged current.
CREATE UNIQUE INDEX uq_mission_one_current_per_slug ON mission(slug) WHERE is_current;

-- Persistent situation/case content for a mission version. 1:1 with mission.
CREATE TABLE mission_case (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id   UUID NOT NULL REFERENCES mission(id) ON DELETE CASCADE,
  title        VARCHAR(200) NOT NULL,
  situation    TEXT NOT NULL,
  background   TEXT,
  constraints  TEXT,
  objective    TEXT,
  extra        JSONB,                                -- flexible additional structured sections
  CONSTRAINT uq_mission_case_mission UNIQUE (mission_id)
);

-- LEVEL: row-versioned, scoped to one specific mission version row.
CREATE TABLE level (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id          UUID NOT NULL REFERENCES mission(id) ON DELETE CASCADE,
  level_number         INTEGER NOT NULL,             -- 1, 2, 3 within the mission
  slug                VARCHAR(120) NOT NULL,
  version             INTEGER NOT NULL DEFAULT 1,
  is_current          BOOLEAN NOT NULL DEFAULT TRUE,
  title               VARCHAR(200) NOT NULL,
  description         TEXT,
  objective           TEXT NOT NULL,                  -- "Find where the system begins to fail"
  xp_reward           INTEGER NOT NULL DEFAULT 0,
  coin_reward         INTEGER NOT NULL DEFAULT 0,
  completion_summary  TEXT,                            -- canonical debrief/conclusion text template
  concepts_applied    TEXT,                             -- human-readable summary of concepts for the debrief
  status              content_status NOT NULL DEFAULT 'DRAFT',
  previous_version_id UUID REFERENCES level(id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_level_mission_number_version UNIQUE (mission_id, level_number, version),
  CONSTRAINT ck_level_rewards_nonneg CHECK (xp_reward >= 0 AND coin_reward >= 0)
);
CREATE UNIQUE INDEX uq_level_one_current_per_slug ON level(mission_id, slug) WHERE is_current;
CREATE INDEX idx_level_mission ON level(mission_id);

-- QUESTION: row-versioned, scoped to one specific level version row.
CREATE TABLE question (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level_id            UUID NOT NULL REFERENCES level(id) ON DELETE CASCADE,
  question_number     INTEGER NOT NULL,
  slug                VARCHAR(120) NOT NULL,
  version             INTEGER NOT NULL DEFAULT 1,
  is_current          BOOLEAN NOT NULL DEFAULT TRUE,
  question_type       question_type NOT NULL,
  prompt              TEXT NOT NULL,
  instruction         TEXT,
  difficulty          difficulty_level NOT NULL DEFAULT 'EASY',
  answer_data_type    value_data_type NOT NULL DEFAULT 'TEXT',
  hint_cost_xp        INTEGER NOT NULL DEFAULT 10,
  max_attempts        INTEGER,                           -- NULL = unlimited (Try Again always available)
  xp_reward           INTEGER NOT NULL DEFAULT 0,
  coin_reward         INTEGER NOT NULL DEFAULT 0,
  display_order       INTEGER NOT NULL DEFAULT 0,
  status              content_status NOT NULL DEFAULT 'DRAFT',
  previous_version_id UUID REFERENCES question(id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_question_level_number_version UNIQUE (level_id, question_number, version),
  CONSTRAINT ck_question_hint_cost_nonneg CHECK (hint_cost_xp >= 0),
  CONSTRAINT ck_question_rewards_nonneg CHECK (xp_reward >= 0 AND coin_reward >= 0)
);
CREATE UNIQUE INDEX uq_question_one_current_per_slug ON question(level_id, slug) WHERE is_current;
CREATE INDEX idx_question_level ON question(level_id);

-- Correct answer / evaluation data. Intentionally NOT joined by any
-- read API that serves the client before submission; only the backend
-- evaluation service selects from this table.
CREATE TABLE question_answer_key (
  question_id       UUID PRIMARY KEY REFERENCES question(id) ON DELETE CASCADE,
  correct_value     TEXT,                 -- canonical correct answer (numeric/text/option ids as text)
  tolerance         NUMERIC,              -- allowed +/- tolerance for NUMERIC answers
  evaluation_rules  JSONB,                -- structured rules for multi-part / decision questions
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE question_option (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id    UUID NOT NULL REFERENCES question(id) ON DELETE CASCADE,
  option_text    TEXT NOT NULL,
  option_value   VARCHAR(64) NOT NULL,     -- stable value the client submits, e.g. 'A' / 'opt_2'
  display_order  INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT uq_question_option_value UNIQUE (question_id, option_value)
);

-- Marks which option(s) are correct. Kept separate from question_option
-- itself so a client-facing "list options" query never has to be careful
-- to strip an is_correct column.
CREATE TABLE question_option_correctness (
  question_option_id  UUID PRIMARY KEY REFERENCES question_option(id) ON DELETE CASCADE,
  is_correct          BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE hint (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id   UUID NOT NULL REFERENCES question(id) ON DELETE CASCADE,
  hint_number   INTEGER NOT NULL,
  content       TEXT NOT NULL,
  cost_xp       INTEGER NOT NULL DEFAULT 10,
  display_order INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT uq_hint_question_number UNIQUE (question_id, hint_number),
  CONSTRAINT ck_hint_cost_nonneg CHECK (cost_xp >= 0)
);

CREATE TABLE answer_explanation (
  question_id               UUID PRIMARY KEY REFERENCES question(id) ON DELETE CASCADE,
  overview                  TEXT NOT NULL,
  reasoning                 TEXT NOT NULL,
  concepts_used             TEXT,
  calculation               TEXT,
  final_result              TEXT,
  simulation_interpretation TEXT,
  engineering_meaning       TEXT,
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE question_concept (
  question_id  UUID NOT NULL REFERENCES question(id) ON DELETE CASCADE,
  concept_id   UUID NOT NULL REFERENCES concept(id) ON DELETE CASCADE,
  PRIMARY KEY (question_id, concept_id)
);

-- Files/reports/evidence. May belong to the whole mission or be scoped to
-- one level (e.g. a report that only unlocks in level 2).
CREATE TABLE mission_file (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id          UUID NOT NULL REFERENCES mission(id) ON DELETE CASCADE,
  level_id            UUID REFERENCES level(id) ON DELETE CASCADE,
  slug                VARCHAR(120) NOT NULL,
  version             INTEGER NOT NULL DEFAULT 1,
  is_current          BOOLEAN NOT NULL DEFAULT TRUE,
  name                VARCHAR(200) NOT NULL,
  file_type           mission_file_type NOT NULL,
  description         TEXT,                 -- shown to the student: "use these files to..."
  display_order       INTEGER NOT NULL DEFAULT 0,
  content             JSONB NOT NULL,        -- structured content: table rows, report text blocks, graph series
  storage_object_key  VARCHAR(500),          -- optional pointer into object storage for large/binary assets
  status              content_status NOT NULL DEFAULT 'DRAFT',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_mission_file_slug_version UNIQUE (mission_id, slug, version),
  CONSTRAINT ck_mission_file_level_same_mission CHECK (TRUE) -- enforced at application layer (level.mission_id = mission_id)
);
CREATE UNIQUE INDEX uq_mission_file_one_current_per_slug ON mission_file(mission_id, slug) WHERE is_current;
CREATE INDEX idx_mission_file_mission ON mission_file(mission_id);
CREATE INDEX idx_mission_file_level ON mission_file(level_id) WHERE level_id IS NOT NULL;

-- ============================================================================
-- SECTION 5: PHYSICS SIMULATION DOMAIN
-- ============================================================================

CREATE TABLE simulation (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id          UUID NOT NULL REFERENCES mission(id) ON DELETE CASCADE,
  level_id            UUID NOT NULL REFERENCES level(id) ON DELETE CASCADE,
  slug                VARCHAR(120) NOT NULL,
  version             INTEGER NOT NULL DEFAULT 1,
  is_current          BOOLEAN NOT NULL DEFAULT TRUE,
  title               VARCHAR(200) NOT NULL,
  description         TEXT,                  -- "use the variable controllers to see how the system changes"
  engine              VARCHAR(64) NOT NULL,   -- frontend renderer key, e.g. 'electrostatics-2d'
  configuration       JSONB NOT NULL DEFAULT '{}'::jsonb,  -- safe declarative config, never executable code
  status              content_status NOT NULL DEFAULT 'DRAFT',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_simulation_slug_version UNIQUE (mission_id, slug, version)
);
CREATE UNIQUE INDEX uq_simulation_one_current_per_slug ON simulation(mission_id, slug) WHERE is_current;
CREATE INDEX idx_simulation_level ON simulation(level_id);

CREATE TABLE simulation_variable (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  simulation_id  UUID NOT NULL REFERENCES simulation(id) ON DELETE CASCADE,
  name           VARCHAR(80) NOT NULL,        -- machine key, e.g. 'plateAPotential'
  label          VARCHAR(160) NOT NULL,       -- human label, e.g. 'Potential of Plate A'
  unit           VARCHAR(32),                 -- 'V', 'm', 'kg', ...
  data_type      value_data_type NOT NULL DEFAULT 'NUMBER',
  minimum        NUMERIC,
  maximum        NUMERIC,
  step           NUMERIC,
  default_value  NUMERIC,
  display_order  INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT uq_simulation_variable_name UNIQUE (simulation_id, name),
  CONSTRAINT ck_simulation_variable_range CHECK (minimum IS NULL OR maximum IS NULL OR minimum <= maximum)
);

-- Deterministic rule definitions. `conditions` is a safe structured
-- expression (JSON), never executable code. The rule evaluator lives in
-- backend application code and simply interprets this JSON.
CREATE TABLE simulation_rule (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  simulation_id     UUID NOT NULL REFERENCES simulation(id) ON DELETE CASCADE,
  priority          INTEGER NOT NULL DEFAULT 0,   -- lower evaluates first
  conditions        JSONB NOT NULL,               -- e.g. {"op":">","left":"electricField","right":"maximumField"}
  consequence_code  VARCHAR(64) NOT NULL REFERENCES consequence_definition(code),
  message_key       VARCHAR(160),                 -- i18n/frontend message lookup key
  CONSTRAINT uq_simulation_rule_priority UNIQUE (simulation_id, priority)
);
CREATE INDEX idx_simulation_rule_simulation ON simulation_rule(simulation_id);

-- ============================================================================
-- SECTION 6: LEARNING PROGRESS
-- ============================================================================

CREATE TABLE user_mission_progress (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID REFERENCES app_user(id) ON DELETE CASCADE,
  anonymous_session_id  UUID REFERENCES anonymous_session(id) ON DELETE CASCADE,
  mission_id            UUID NOT NULL REFERENCES mission(id) ON DELETE RESTRICT,
  current_level_id      UUID REFERENCES level(id),
  current_question_id   UUID REFERENCES question(id),
  status                progress_status NOT NULL DEFAULT 'NOT_STARTED',
  started_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_accessed_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at          TIMESTAMPTZ,
  CONSTRAINT ck_ump_owner CHECK (
    (user_id IS NOT NULL)::int + (anonymous_session_id IS NOT NULL)::int = 1
  )
);
-- One active progress row per (owner, mission). Partial unique indexes per
-- owner type since a plain UNIQUE would treat two NULLs as distinct anyway,
-- but being explicit keeps intent obvious.
CREATE UNIQUE INDEX uq_ump_user_mission ON user_mission_progress(user_id, mission_id) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX uq_ump_anon_mission ON user_mission_progress(anonymous_session_id, mission_id) WHERE anonymous_session_id IS NOT NULL;
CREATE INDEX idx_ump_user_active ON user_mission_progress(user_id) WHERE status = 'IN_PROGRESS';

CREATE TABLE user_level_progress (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID REFERENCES app_user(id) ON DELETE CASCADE,
  anonymous_session_id  UUID REFERENCES anonymous_session(id) ON DELETE CASCADE,
  level_id              UUID NOT NULL REFERENCES level(id) ON DELETE RESTRICT,
  status                progress_status NOT NULL DEFAULT 'NOT_STARTED',
  current_question      INTEGER NOT NULL DEFAULT 0,
  questions_completed    INTEGER NOT NULL DEFAULT 0,
  xp_earned             INTEGER NOT NULL DEFAULT 0,
  coins_earned          INTEGER NOT NULL DEFAULT 0,
  started_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at          TIMESTAMPTZ,
  CONSTRAINT ck_ulp_owner CHECK (
    (user_id IS NOT NULL)::int + (anonymous_session_id IS NOT NULL)::int = 1
  )
);
CREATE UNIQUE INDEX uq_ulp_user_level ON user_level_progress(user_id, level_id) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX uq_ulp_anon_level ON user_level_progress(anonymous_session_id, level_id) WHERE anonymous_session_id IS NOT NULL;

CREATE TABLE user_question_progress (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID REFERENCES app_user(id) ON DELETE CASCADE,
  anonymous_session_id  UUID REFERENCES anonymous_session(id) ON DELETE CASCADE,
  question_id           UUID NOT NULL REFERENCES question(id) ON DELETE RESTRICT,
  status                progress_status NOT NULL DEFAULT 'NOT_STARTED',
  attempt_count         INTEGER NOT NULL DEFAULT 0,
  hint_used_count       INTEGER NOT NULL DEFAULT 0,
  answer_revealed       BOOLEAN NOT NULL DEFAULT FALSE,
  solved_at             TIMESTAMPTZ,
  CONSTRAINT ck_uqp_owner CHECK (
    (user_id IS NOT NULL)::int + (anonymous_session_id IS NOT NULL)::int = 1
  )
);
CREATE UNIQUE INDEX uq_uqp_user_question ON user_question_progress(user_id, question_id) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX uq_uqp_anon_question ON user_question_progress(anonymous_session_id, question_id) WHERE anonymous_session_id IS NOT NULL;

-- Immutable attempt log. Never updated/overwritten; every submit inserts
-- a new row with the next attempt_number.
CREATE TABLE user_response (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID REFERENCES app_user(id) ON DELETE CASCADE,
  anonymous_session_id  UUID REFERENCES anonymous_session(id) ON DELETE CASCADE,
  question_id           UUID NOT NULL REFERENCES question(id) ON DELETE RESTRICT,
  attempt_number        INTEGER NOT NULL,
  answer                JSONB NOT NULL,          -- raw submitted answer payload
  is_correct            BOOLEAN NOT NULL,
  score                 NUMERIC,                 -- partial-credit score if applicable
  xp_awarded            INTEGER NOT NULL DEFAULT 0,
  coins_awarded         INTEGER NOT NULL DEFAULT 0,
  hint_used             BOOLEAN NOT NULL DEFAULT FALSE,
  submitted_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT ck_ur_owner CHECK (
    (user_id IS NOT NULL)::int + (anonymous_session_id IS NOT NULL)::int = 1
  )
);
CREATE UNIQUE INDEX uq_ur_user_question_attempt ON user_response(user_id, question_id, attempt_number) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX uq_ur_anon_question_attempt ON user_response(anonymous_session_id, question_id, attempt_number) WHERE anonymous_session_id IS NOT NULL;
CREATE INDEX idx_ur_question ON user_response(question_id);

CREATE TABLE hint_usage (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID REFERENCES app_user(id) ON DELETE CASCADE,
  anonymous_session_id  UUID REFERENCES anonymous_session(id) ON DELETE CASCADE,
  question_id           UUID NOT NULL REFERENCES question(id) ON DELETE RESTRICT,
  hint_id               UUID NOT NULL REFERENCES hint(id) ON DELETE RESTRICT,
  xp_cost               INTEGER NOT NULL,
  used_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT ck_hu_owner CHECK (
    (user_id IS NOT NULL)::int + (anonymous_session_id IS NOT NULL)::int = 1
  )
);
CREATE UNIQUE INDEX uq_hu_user_hint ON hint_usage(user_id, hint_id) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX uq_hu_anon_hint ON hint_usage(anonymous_session_id, hint_id) WHERE anonymous_session_id IS NOT NULL;

CREATE TABLE level_completion (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID REFERENCES app_user(id) ON DELETE CASCADE,
  anonymous_session_id  UUID REFERENCES anonymous_session(id) ON DELETE CASCADE,
  level_id              UUID NOT NULL REFERENCES level(id) ON DELETE RESTRICT,
  summary               TEXT NOT NULL,           -- the debrief actually shown to this student
  concepts_applied      TEXT,
  skills_developed      TEXT,
  xp_earned             INTEGER NOT NULL DEFAULT 0,
  coins_earned          INTEGER NOT NULL DEFAULT 0,
  completed_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT ck_lc_owner CHECK (
    (user_id IS NOT NULL)::int + (anonymous_session_id IS NOT NULL)::int = 1
  )
);
CREATE UNIQUE INDEX uq_lc_user_level ON level_completion(user_id, level_id) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX uq_lc_anon_level ON level_completion(anonymous_session_id, level_id) WHERE anonymous_session_id IS NOT NULL;

-- Meaningful learning activity only (not trivial page views -- those go
-- to event_log). One row per qualifying action; streak_day is the
-- derived per-calendar-day rollup used by the streak calendar UI.
CREATE TABLE user_activity (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID REFERENCES app_user(id) ON DELETE CASCADE,
  anonymous_session_id  UUID REFERENCES anonymous_session(id) ON DELETE CASCADE,
  activity_type         activity_type NOT NULL,
  activity_date         DATE NOT NULL DEFAULT CURRENT_DATE,
  metadata              JSONB,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT ck_ua_owner CHECK (
    (user_id IS NOT NULL)::int + (anonymous_session_id IS NOT NULL)::int = 1
  )
);
CREATE INDEX idx_ua_user_date ON user_activity(user_id, activity_date) WHERE user_id IS NOT NULL;
CREATE INDEX idx_ua_anon_date ON user_activity(anonymous_session_id, activity_date) WHERE anonymous_session_id IS NOT NULL;

-- Derived, upserted daily rollup: "did this user do qualifying activity on
-- this date". Powers the streak calendar without scanning user_activity.
CREATE TABLE streak_day (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID REFERENCES app_user(id) ON DELETE CASCADE,
  anonymous_session_id  UUID REFERENCES anonymous_session(id) ON DELETE CASCADE,
  activity_date         DATE NOT NULL,
  qualifying_activity_count INTEGER NOT NULL DEFAULT 1,
  CONSTRAINT ck_sd_owner CHECK (
    (user_id IS NOT NULL)::int + (anonymous_session_id IS NOT NULL)::int = 1
  )
);
CREATE UNIQUE INDEX uq_sd_user_date ON streak_day(user_id, activity_date) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX uq_sd_anon_date ON streak_day(anonymous_session_id, activity_date) WHERE anonymous_session_id IS NOT NULL;

-- ============================================================================
-- SECTION 7: REWARDS
-- ============================================================================

-- Immutable ledger. app_user.xp / app_user.coins are denormalized running
-- totals maintained ONLY by applying rows from this table inside the same
-- transaction; never updated directly by an API handler.
CREATE TABLE reward_transaction (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID REFERENCES app_user(id) ON DELETE CASCADE,
  anonymous_session_id  UUID REFERENCES anonymous_session(id) ON DELETE CASCADE,
  type                  reward_type NOT NULL,
  amount                INTEGER NOT NULL,           -- positive = credit, negative = debit (e.g. hint cost)
  source                reward_source NOT NULL,
  reference_id          UUID,                        -- points at question_id / level_id / mission_id / badge_id depending on source
  idempotency_key       VARCHAR(200) NOT NULL,       -- deterministic per real-world action; enforces exactly-once
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT ck_rt_owner CHECK (
    (user_id IS NOT NULL)::int + (anonymous_session_id IS NOT NULL)::int = 1
  ),
  CONSTRAINT uq_rt_idempotency UNIQUE (idempotency_key)
);
CREATE INDEX idx_rt_user ON reward_transaction(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_rt_anon ON reward_transaction(anonymous_session_id) WHERE anonymous_session_id IS NOT NULL;

CREATE TABLE badge (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code          VARCHAR(64) NOT NULL,
  name          VARCHAR(160) NOT NULL,
  description   TEXT,
  icon          VARCHAR(64),
  criteria      JSONB NOT NULL,          -- declarative criteria, evaluated by backend service
  active        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_badge_code UNIQUE (code)
);

CREATE TABLE user_badge (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID REFERENCES app_user(id) ON DELETE CASCADE,
  anonymous_session_id  UUID REFERENCES anonymous_session(id) ON DELETE CASCADE,
  badge_id              UUID NOT NULL REFERENCES badge(id) ON DELETE RESTRICT,
  earned_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata              JSONB,
  CONSTRAINT ck_ub_owner CHECK (
    (user_id IS NOT NULL)::int + (anonymous_session_id IS NOT NULL)::int = 1
  )
);
CREATE UNIQUE INDEX uq_ub_user_badge ON user_badge(user_id, badge_id) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX uq_ub_anon_badge ON user_badge(anonymous_session_id, badge_id) WHERE anonymous_session_id IS NOT NULL;

-- ============================================================================
-- SECTION 8: ANALYTICS
-- ============================================================================

-- Raw, high-volume immutable event stream. Source of truth for anything
-- analytics needs to recompute later.
CREATE TABLE event_log (
  id                    BIGSERIAL PRIMARY KEY,
  user_id               UUID REFERENCES app_user(id) ON DELETE SET NULL,
  anonymous_session_id  UUID REFERENCES anonymous_session(id) ON DELETE SET NULL,
  event_type            event_type NOT NULL,
  entity_type           VARCHAR(32),     -- 'MISSION' | 'LEVEL' | 'QUESTION' | 'SIMULATION' | ...
  entity_id             UUID,
  metadata              JSONB,
  occurred_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_event_log_user_time ON event_log(user_id, occurred_at) WHERE user_id IS NOT NULL;
CREATE INDEX idx_event_log_anon_time ON event_log(anonymous_session_id, occurred_at) WHERE anonymous_session_id IS NOT NULL;
CREATE INDEX idx_event_log_type_time ON event_log(event_type, occurred_at);

-- Per-user, per-concept rolling performance aggregate. Recomputed
-- incrementally whenever a user_response referencing that concept lands.
CREATE TABLE concept_performance (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID REFERENCES app_user(id) ON DELETE CASCADE,
  anonymous_session_id UUID REFERENCES anonymous_session(id) ON DELETE CASCADE,
  concept_id        UUID NOT NULL REFERENCES concept(id) ON DELETE CASCADE,
  attempts_count    INTEGER NOT NULL DEFAULT 0,
  correct_count     INTEGER NOT NULL DEFAULT 0,
  hints_used_count  INTEGER NOT NULL DEFAULT 0,
  last_practiced_at TIMESTAMPTZ,
  CONSTRAINT ck_cp_owner CHECK (
    (user_id IS NOT NULL)::int + (anonymous_session_id IS NOT NULL)::int = 1
  )
);
CREATE UNIQUE INDEX uq_cp_user_concept ON concept_performance(user_id, concept_id) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX uq_cp_anon_concept ON concept_performance(anonymous_session_id, concept_id) WHERE anonymous_session_id IS NOT NULL;

-- Recurring-mistake detector: one row per (user, question) that captures
-- a wrong-answer pattern worth surfacing to a teacher/analytics view.
CREATE TABLE mistake_record (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID REFERENCES app_user(id) ON DELETE CASCADE,
  anonymous_session_id UUID REFERENCES anonymous_session(id) ON DELETE CASCADE,
  question_id       UUID NOT NULL REFERENCES question(id) ON DELETE CASCADE,
  concept_id        UUID REFERENCES concept(id) ON DELETE SET NULL,
  wrong_attempt_count INTEGER NOT NULL DEFAULT 1,
  last_wrong_answer  JSONB,
  first_seen_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT ck_mr_owner CHECK (
    (user_id IS NOT NULL)::int + (anonymous_session_id IS NOT NULL)::int = 1
  )
);
CREATE UNIQUE INDEX uq_mr_user_question ON mistake_record(user_id, question_id) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX uq_mr_anon_question ON mistake_record(anonymous_session_id, question_id) WHERE anonymous_session_id IS NOT NULL;

-- Periodic denormalized cache for dashboards; explicitly non-authoritative,
-- safe to drop and recompute at any time from event_log/user_response.
CREATE TABLE user_performance_snapshot (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                   UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  computed_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  total_questions_answered  INTEGER NOT NULL DEFAULT 0,
  accuracy_rate             NUMERIC(5,4),
  avg_attempts_per_question NUMERIC(6,2),
  total_hints_used          INTEGER NOT NULL DEFAULT 0,
  missions_completed        INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_ups_user_time ON user_performance_snapshot(user_id, computed_at DESC);

-- ============================================================================
-- SECTION 9: USER INPUT
-- ============================================================================

CREATE TABLE feedback (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID REFERENCES app_user(id) ON DELETE SET NULL,
  anonymous_session_id  UUID REFERENCES anonymous_session(id) ON DELETE SET NULL,
  message               TEXT NOT NULL,
  category              feedback_category NOT NULL DEFAULT 'GENERAL',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT ck_fb_owner CHECK (
    (user_id IS NOT NULL)::int + (anonymous_session_id IS NOT NULL)::int <= 1
  )
);
CREATE INDEX idx_feedback_created ON feedback(created_at DESC);

-- ============================================================================
-- SECTION 10: LEADERBOARD SUPPORT INDEXES
-- Leaderboard itself is a query (ORDER BY xp/coins/level DESC on app_user),
-- not a maintained table, per spec. These indexes make it fast at scale.
-- ============================================================================

CREATE INDEX idx_app_user_xp_desc ON app_user(xp DESC) WHERE is_active;
CREATE INDEX idx_app_user_coins_desc ON app_user(coins DESC) WHERE is_active;
CREATE INDEX idx_app_user_level_desc ON app_user(level DESC) WHERE is_active;

-- ============================================================================
-- SECTION 11: touch updated_at triggers (kept minimal, applied where useful)
-- ============================================================================

CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_app_user_updated_at BEFORE UPDATE ON app_user
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_subject_updated_at BEFORE UPDATE ON subject
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_mission_updated_at BEFORE UPDATE ON mission
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_level_updated_at BEFORE UPDATE ON level
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_question_updated_at BEFORE UPDATE ON question
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_user_setting_updated_at BEFORE UPDATE ON user_setting
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
