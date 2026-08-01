/**
 * Imports the DVSA Cat B question bank (Feb 2026 XLSX) into Supabase.
 *
 * Usage: node scripts/import-questions.js
 *
 * - Skips NI Exempt questions (14 rows)
 * - Maps XLSX categories to the 14 app categories
 * - Clears existing questions and user_progress before inserting
 * - Inserts in batches of 100 to avoid Supabase payload limits
 */

const xlsx = require('xlsx');
const { createClient } = require('@supabase/supabase-js');
const { randomUUID } = require('crypto');
const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const XLSX_PATH = path.join(
  __dirname,
  '../wetransfer_extracted/Car Updates/Latest Question Bank - February 2026/Car (Cat B) QB Feb 2026.xlsx'
);

// Read .env manually — no dotenv dependency needed
const ENV = fs
  .readFileSync(path.join(__dirname, '../.env'), 'utf-8')
  .split('\n')
  .reduce((acc, line) => {
    const eq = line.indexOf('=');
    if (eq > 0) acc[line.slice(0, eq).trim()] = line.slice(eq + 1).trim();
    return acc;
  }, {});

const supabase = createClient(
  ENV.EXPO_PUBLIC_SUPABASE_URL,
  ENV.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

// ---------------------------------------------------------------------------
// Category mapping — XLSX topic (trimmed, lowercased) → app category name
// ---------------------------------------------------------------------------

const CATEGORY_MAP = {
  'alertness': 'Alertness',
  'attitude': 'Attitude',
  'essential documents': 'Documents',
  'hazard awareness': 'Hazard Awareness',
  'incidents, accidents and emergencies': 'Accidents',
  'motorway rules': 'Motorway Rules',
  'other types of vehicle': 'Other Types of Vehicle',
  'road and traffic signs': 'Road and Traffic Signs',
  'rules of the road': 'Rules of the Road',
  'safety and your vehicle': 'Safety and Your Vehicle',
  'safety and your vehicle/motorcycle': 'Safety and Your Vehicle',
  'safety margins': 'Safety Margins',
  'vehicle handling': 'Vehicle Handling',
  'vehicle/motorcycle handling': 'Vehicle Handling',
  'vehicle loading': 'Vehicle Loading',
  'vehicle/motorcycle loading': 'Vehicle Loading',
  'vulnerable road users': 'Vulnerable Road Users',
};

const BATCH_SIZE = 100;

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('Reading XLSX…');
  const wb = xlsx.readFile(XLSX_PATH);
  const ws = wb.Sheets[wb.SheetNames[0]];
  // Row 0 = title banner, Row 1 = column headers, data starts at Row 2
  const rows = xlsx.utils.sheet_to_json(ws, { header: 1 }).slice(2);

  const questions = [];
  const skipped = [];
  const unknownCategories = new Set();

  for (const row of rows) {
    const [
      item,       // 0  AB2001
      topic,      // 1  Alertness
      answer,     // 2  C
      stem,       // 3  question text
      ,           // 4  Mark one answer
      optA,       // 5
      optB,       // 6
      optC,       // 7
      optD,       // 8
      explText,   // 9
      ,           // 10 List Amendments
      niExempt,   // 11
    ] = row;

    if (niExempt === 'NI EXEMPT' || niExempt === 'NI Exempt') {
      skipped.push({ item, reason: 'NI Exempt' });
      continue;
    }

    if (!stem || !answer || !optA || !optB || !optC || !optD) {
      skipped.push({ item, reason: 'missing field' });
      continue;
    }

    const categoryKey = (topic ?? '').trim().toLowerCase();
    const category = CATEGORY_MAP[categoryKey];
    if (!category) {
      unknownCategories.add(topic);
      skipped.push({ item, reason: `unknown category: ${topic}` });
      continue;
    }

    questions.push({
      id: randomUUID(),
      category,
      question_text: stem.trim(),
      option_a: String(optA).trim(),
      option_b: String(optB).trim(),
      option_c: String(optC).trim(),
      option_d: String(optD).trim(),
      correct_answer: answer.trim().toLowerCase(),
      explanation: explText ? String(explText).trim() : '',
    });
  }

  console.log(`\nParsed:   ${questions.length} questions to import`);
  console.log(`Skipped:  ${skipped.length} rows`);
  if (unknownCategories.size > 0) {
    console.warn('Unknown categories (skipped):', [...unknownCategories]);
  }

  // ---------------------------------------------------------------------------
  // Confirm before destructive operations
  // ---------------------------------------------------------------------------

  console.log('\nThis will DELETE all existing questions and user_progress rows.');
  console.log('Press Ctrl+C within 5 seconds to abort…');
  await new Promise(r => setTimeout(r, 5000));

  // ---------------------------------------------------------------------------
  // Clear existing data
  // ---------------------------------------------------------------------------

  console.log('\nClearing user_progress…');
  const { error: progressErr } = await supabase
    .from('user_progress')
    .delete()
    .gte('answered_at', '2000-01-01');
  if (progressErr) throw new Error(`user_progress delete: ${progressErr.message}`);

  console.log('Clearing ai_explanation_cache…');
  const { error: cacheErr } = await supabase
    .from('ai_explanation_cache')
    .delete()
    .neq('question_id', '00000000-0000-0000-0000-000000000000');
  if (cacheErr) throw new Error(`ai_explanation_cache delete: ${cacheErr.message}`);

  console.log('Clearing questions…');
  const { error: questionsErr } = await supabase
    .from('questions')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // matches all rows
  if (questionsErr) throw new Error(`questions delete: ${questionsErr.message}`);

  // ---------------------------------------------------------------------------
  // Insert in batches
  // ---------------------------------------------------------------------------

  const totalBatches = Math.ceil(questions.length / BATCH_SIZE);
  console.log(`\nInserting ${questions.length} questions in ${totalBatches} batches…\n`);

  for (let i = 0; i < questions.length; i += BATCH_SIZE) {
    const batch = questions.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const { error } = await supabase.from('questions').insert(batch);
    if (error) throw new Error(`Batch ${batchNum} insert failed: ${error.message}`);
    const pct = Math.round((batchNum / totalBatches) * 100);
    process.stdout.write(`  Batch ${batchNum}/${totalBatches} (${pct}%)\r`);
  }

  // ---------------------------------------------------------------------------
  // Verify
  // ---------------------------------------------------------------------------

  const { count, error: countErr } = await supabase
    .from('questions')
    .select('*', { count: 'exact', head: true });
  if (countErr) throw new Error(`Count check failed: ${countErr.message}`);

  console.log(`\n\nDone! Questions in database: ${count}`);

  const breakdown = {};
  for (const q of questions) {
    breakdown[q.category] = (breakdown[q.category] ?? 0) + 1;
  }
  console.log('\nCategory breakdown:');
  Object.entries(breakdown).sort().forEach(([cat, n]) => console.log(`  ${n.toString().padStart(3)}  ${cat}`));
}

main().catch(err => {
  console.error('\nFailed:', err.message);
  process.exit(1);
});
