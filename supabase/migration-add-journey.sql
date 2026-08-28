-- GreenLight: Add journey layer (test date, retake, certificate tracking)
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor → New query)
-- Safe to run once — uses IF NOT EXISTS / IF EXISTS guards throughout.

CREATE TABLE IF NOT EXISTS user_journey (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  state text NOT NULL DEFAULT 'preparing'
    CHECK (state IN ('preparing', 'booked', 'retake', 'certified')),
  test_date date,
  last_result jsonb,
  certificate jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE user_journey ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_own_journey" ON user_journey;
CREATE POLICY "users_own_journey" ON user_journey
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
