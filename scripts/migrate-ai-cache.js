/**
 * Prints the SQL needed to migrate ai_explanation_cache.
 * Run the output in your Supabase dashboard → SQL editor.
 *
 * Usage: node scripts/migrate-ai-cache.js
 */

const SQL = `
-- Migrate ai_explanation_cache: one explanation per question (not per wrong answer)
DROP TABLE IF EXISTS ai_explanation_cache;

CREATE TABLE ai_explanation_cache (
  question_id text PRIMARY KEY REFERENCES questions(id) ON DELETE CASCADE,
  ai_explanation text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
`.trim();

console.log('Run this SQL in your Supabase dashboard → SQL editor:\n');
console.log(SQL);
