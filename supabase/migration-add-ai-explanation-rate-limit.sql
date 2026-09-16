-- GreenLight: Per-user daily cap on AI explanation calls
--
-- Bounds Anthropic spend per account per day. The ai-explanation Edge
-- Function is the only writer (service role key bypasses RLS), so no
-- write policy is needed for it -- RLS is enabled purely to deny direct
-- client access.

CREATE TABLE IF NOT EXISTS ai_explanation_usage (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  usage_date date NOT NULL,
  request_count integer NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, usage_date)
);

ALTER TABLE ai_explanation_usage ENABLE ROW LEVEL SECURITY;

-- Atomically increments today's counter for a user and returns the new
-- count, so concurrent requests can't race past the daily cap.
CREATE OR REPLACE FUNCTION increment_ai_explanation_usage(p_user_id uuid, p_date date)
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO ai_explanation_usage (user_id, usage_date, request_count)
  VALUES (p_user_id, p_date, 1)
  ON CONFLICT (user_id, usage_date)
  DO UPDATE SET request_count = ai_explanation_usage.request_count + 1
  RETURNING request_count;
$$;

-- SECURITY DEFINER runs as the function owner regardless of caller --
-- only the service role should ever call it, so keep it out of reach of
-- normal authenticated/anon roles.
REVOKE ALL ON FUNCTION increment_ai_explanation_usage(uuid, date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION increment_ai_explanation_usage(uuid, date) TO service_role;
