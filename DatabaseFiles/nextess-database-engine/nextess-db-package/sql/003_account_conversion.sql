-- ============================================================================
-- ACCOUNT CONVERSION: migrate an AnonymousSession's data onto a new User
-- Wrapped in one transaction. Re-running with the same anonymous_session_id
-- after it has already been converted is a no-op (idempotent) because the
-- anonymous_session.converted_to_user_id gate below short-circuits it.
-- ============================================================================

CREATE OR REPLACE FUNCTION migrate_anonymous_session_to_user(
  p_anonymous_session_id UUID,
  p_user_id UUID
) RETURNS VOID AS $$
DECLARE
  v_already_converted UUID;
BEGIN
  SELECT converted_to_user_id INTO v_already_converted
  FROM anonymous_session WHERE id = p_anonymous_session_id FOR UPDATE;

  IF v_already_converted IS NOT NULL THEN
    RAISE NOTICE 'Anonymous session % already converted to user %, skipping.', p_anonymous_session_id, v_already_converted;
    RETURN;
  END IF;

  -- Mission / level / question progress
  UPDATE user_mission_progress SET user_id = p_user_id, anonymous_session_id = NULL
    WHERE anonymous_session_id = p_anonymous_session_id
      AND mission_id NOT IN (SELECT mission_id FROM user_mission_progress WHERE user_id = p_user_id);
  UPDATE user_level_progress SET user_id = p_user_id, anonymous_session_id = NULL
    WHERE anonymous_session_id = p_anonymous_session_id
      AND level_id NOT IN (SELECT level_id FROM user_level_progress WHERE user_id = p_user_id);
  UPDATE user_question_progress SET user_id = p_user_id, anonymous_session_id = NULL
    WHERE anonymous_session_id = p_anonymous_session_id
      AND question_id NOT IN (SELECT question_id FROM user_question_progress WHERE user_id = p_user_id);

  -- Immutable historical records: safe to re-parent directly, PK stays unique
  UPDATE user_response SET user_id = p_user_id, anonymous_session_id = NULL
    WHERE anonymous_session_id = p_anonymous_session_id;
  UPDATE hint_usage SET user_id = p_user_id, anonymous_session_id = NULL
    WHERE anonymous_session_id = p_anonymous_session_id;
  UPDATE level_completion SET user_id = p_user_id, anonymous_session_id = NULL
    WHERE anonymous_session_id = p_anonymous_session_id
      AND level_id NOT IN (SELECT level_id FROM level_completion WHERE user_id = p_user_id);
  UPDATE user_activity SET user_id = p_user_id, anonymous_session_id = NULL
    WHERE anonymous_session_id = p_anonymous_session_id;
  UPDATE streak_day SET user_id = p_user_id, anonymous_session_id = NULL
    WHERE anonymous_session_id = p_anonymous_session_id
      AND activity_date NOT IN (SELECT activity_date FROM streak_day WHERE user_id = p_user_id);

  -- Rewards ledger: re-parent, then recompute the user's running totals
  -- FROM THE LEDGER (never additive) to guarantee no double counting.
  UPDATE reward_transaction SET user_id = p_user_id, anonymous_session_id = NULL
    WHERE anonymous_session_id = p_anonymous_session_id;

  UPDATE user_badge SET user_id = p_user_id, anonymous_session_id = NULL
    WHERE anonymous_session_id = p_anonymous_session_id
      AND badge_id NOT IN (SELECT badge_id FROM user_badge WHERE user_id = p_user_id);

  UPDATE concept_performance SET user_id = p_user_id, anonymous_session_id = NULL
    WHERE anonymous_session_id = p_anonymous_session_id
      AND concept_id NOT IN (SELECT concept_id FROM concept_performance WHERE user_id = p_user_id);

  UPDATE mistake_record SET user_id = p_user_id, anonymous_session_id = NULL
    WHERE anonymous_session_id = p_anonymous_session_id
      AND question_id NOT IN (SELECT question_id FROM mistake_record WHERE user_id = p_user_id);

  -- Recompute authoritative balances directly from the ledger (source of truth)
  UPDATE app_user u SET
    xp = COALESCE((SELECT SUM(amount) FROM reward_transaction WHERE user_id = u.id AND type = 'XP'), 0),
    coins = COALESCE((SELECT SUM(amount) FROM reward_transaction WHERE user_id = u.id AND type = 'COINS'), 0)
  WHERE u.id = p_user_id;

  UPDATE anonymous_session
    SET converted_to_user_id = p_user_id, converted_at = now()
    WHERE id = p_anonymous_session_id;

  INSERT INTO event_log (user_id, event_type, entity_type, entity_id, metadata)
  VALUES (p_user_id, 'ACCOUNT_CREATED', 'ANONYMOUS_SESSION', p_anonymous_session_id,
          jsonb_build_object('migratedFrom', p_anonymous_session_id));
END;
$$ LANGUAGE plpgsql;
