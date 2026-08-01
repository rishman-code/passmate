-- PassMate: Add user auth to progress tables
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor → New query)
-- Safe to run once — uses IF NOT EXISTS / IF EXISTS guards throughout.

-- ── 1. user_progress ─────────────────────────────────────────────────────────

-- Clear existing anonymous rows (they have no user_id)
TRUNCATE TABLE user_progress;

-- Drop old single-column primary key
ALTER TABLE user_progress DROP CONSTRAINT IF EXISTS user_progress_pkey;

-- Add user_id column (NOT NULL after truncate so no existing rows break)
ALTER TABLE user_progress
  ADD COLUMN IF NOT EXISTS user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE;

-- New composite primary key
ALTER TABLE user_progress ADD PRIMARY KEY (user_id, question_id);

-- Enable RLS and add policy
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_own_progress" ON user_progress;
CREATE POLICY "users_own_progress" ON user_progress
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ── 2. mock_test_results ──────────────────────────────────────────────────────

TRUNCATE TABLE mock_test_results;

ALTER TABLE mock_test_results
  ADD COLUMN IF NOT EXISTS user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE mock_test_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_own_mock_results" ON mock_test_results;
CREATE POLICY "users_own_mock_results" ON mock_test_results
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ── 3. questions & ai_explanation_cache stay public (RLS OFF) ────────────────
-- No changes needed — these tables are read-only public data.


-- ── Done ─────────────────────────────────────────────────────────────────────
-- After running this, go to Authentication → Providers in the Supabase
-- dashboard and confirm Email provider is enabled.
-- To skip email confirmation during development:
--   Authentication → Email Templates → disable "Confirm email" toggle.
