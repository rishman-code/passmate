-- PassMate: Add self-reported weak topics, captured during onboarding
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor → New query)
-- Safe to run once — uses IF NOT EXISTS guard.

ALTER TABLE user_journey
  ADD COLUMN IF NOT EXISTS self_reported_weak_topics jsonb NOT NULL DEFAULT '[]'::jsonb;
