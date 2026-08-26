/**
 * Pre-generates AI explanations for all questions and caches them in Supabase.
 * Safe to re-run — skips questions that are already cached.
 *
 * Usage: node scripts/generate-all-explanations.js
 *
 * Estimated cost: ~$0.25 for all 717 questions at Claude Haiku pricing.
 * Once complete, the Anthropic API key is no longer needed in production.
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const CONCURRENCY = 5;   // concurrent API calls — lower if you hit 429s
const RETRY_LIMIT = 3;
const RETRY_DELAY_MS = 2000;

// ---------------------------------------------------------------------------
// Bootstrap
// ---------------------------------------------------------------------------

const ENV = fs
  .readFileSync(path.join(__dirname, '../.env'), 'utf-8')
  .split('\n')
  .reduce((acc, line) => {
    const eq = line.indexOf('=');
    if (eq > 0) acc[line.slice(0, eq).trim()] = line.slice(eq + 1).trim();
    return acc;
  }, {});

const ANTHROPIC_KEY = ENV.EXPO_PUBLIC_ANTHROPIC_API_KEY ?? '';
const supabase = createClient(
  ENV.EXPO_PUBLIC_SUPABASE_URL,
  ENV.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

if (!ANTHROPIC_KEY || ANTHROPIC_KEY === 'placeholder') {
  console.error('EXPO_PUBLIC_ANTHROPIC_API_KEY is not set in .env');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function stripMarkdown(text) {
  return text
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/^\s*[-*]\s+/gm, '')
    .trim();
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function callAnthropic(question, attempt = 1) {
  const correctText = question[`option_${question.correct_answer}`];

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5',
      max_tokens: 200,
      messages: [
        {
          role: 'user',
          content: `You are a UK driving theory test instructor. In 2-3 clear sentences, explain why "${correctText}" is the correct answer to the question below. Build on the official DVSA explanation but make it more memorable for a learner. Write in plain prose — no markdown, no bullet points, no headers, no bold or italic formatting.

Question: ${question.question_text}
Category: ${question.category}
Correct answer: ${correctText}
DVSA explanation: ${question.explanation}`,
        },
      ],
    }),
  });

  if (res.status === 429 && attempt <= RETRY_LIMIT) {
    const wait = RETRY_DELAY_MS * attempt;
    process.stdout.write(`\n  [rate limit] waiting ${wait}ms before retry ${attempt}/${RETRY_LIMIT}...`);
    await sleep(wait);
    return callAnthropic(question, attempt + 1);
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status}: ${body.slice(0, 120)}`);
  }

  const data = await res.json();
  return stripMarkdown(data.content[0].text);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  // 1. Fetch all questions
  const { data: questions, error: qErr } = await supabase
    .from('questions')
    .select('id, question_text, category, correct_answer, option_a, option_b, option_c, option_d, explanation');

  if (qErr) throw new Error(`Fetch questions failed: ${qErr.message}`);
  console.log(`Questions in database : ${questions.length}`);

  // 2. Fetch already-cached IDs
  const { data: cached, error: cErr } = await supabase
    .from('ai_explanation_cache')
    .select('question_id');

  if (cErr) throw new Error(`Fetch cache failed: ${cErr.message}`);
  const cachedIds = new Set(cached.map((r) => r.question_id));
  console.log(`Already cached        : ${cachedIds.size}`);

  const todo = questions.filter((q) => !cachedIds.has(q.id));
  console.log(`To generate           : ${todo.length}`);

  if (todo.length === 0) {
    console.log('\nAll explanations already cached — nothing to do.');
    return;
  }

  console.log(`\nGenerating with concurrency=${CONCURRENCY}...\n`);

  let done = 0;
  let errors = 0;
  const failed = [];

  // 3. Process in parallel batches
  for (let i = 0; i < todo.length; i += CONCURRENCY) {
    const batch = todo.slice(i, i + CONCURRENCY);

    await Promise.all(
      batch.map(async (question) => {
        try {
          const explanation = await callAnthropic(question);

          const { error: upsertErr } = await supabase.from('ai_explanation_cache').upsert({
            question_id: question.id,
            ai_explanation: explanation,
            created_at: new Date().toISOString(),
          });

          if (upsertErr) throw new Error(`Upsert failed: ${upsertErr.message}`);

          done++;
        } catch (err) {
          errors++;
          failed.push({ id: question.id, error: err.message });
        }

        const total = done + errors;
        const pct = Math.round((total / todo.length) * 100);
        process.stdout.write(
          `\r  ${total}/${todo.length} (${pct}%)  ✓ ${done}  ✗ ${errors}   `
        );
      })
    );
  }

  // 4. Summary
  console.log('\n');
  console.log(`Generated : ${done}`);
  console.log(`Errors    : ${errors}`);

  if (failed.length > 0) {
    console.log('\nFailed questions (re-run the script to retry):');
    failed.forEach((f) => console.log(`  ${f.id}: ${f.error}`));
  }

  const { count } = await supabase
    .from('ai_explanation_cache')
    .select('*', { count: 'exact', head: true });

  console.log(`\nTotal cached in Supabase: ${count} / ${questions.length}`);

  if (count === questions.length) {
    console.log('\nAll explanations cached. The Anthropic API key is no longer needed in production.');
  }
}

main().catch((err) => {
  console.error('\nFailed:', err.message);
  process.exit(1);
});
