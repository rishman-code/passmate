-- GreenLight: Lock down ai_explanation_cache
-- Authenticated users can read cached explanations.
-- Writes come only from the ai-explanation Edge Function (service role key),
-- which bypasses RLS entirely — so no write policy is needed.

ALTER TABLE ai_explanation_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated_read_cache" ON ai_explanation_cache;
CREATE POLICY "authenticated_read_cache" ON ai_explanation_cache
  FOR SELECT TO authenticated
  USING (true);
