import { describe, expect, it } from 'vitest';

import type { Question, UserProgress } from '@/types/database';
import { buildMistakeLedger } from './mistake-ledger';

function question(overrides: Partial<Question> = {}): Question {
  return {
    id: 'q1',
    category: 'Alertness',
    question_text: 'Sample question?',
    option_a: 'A',
    option_b: 'B',
    option_c: 'C',
    option_d: 'D',
    correct_answer: 'a',
    explanation: 'Because A is correct.',
    ...overrides,
  };
}

function progressEntry(correct: boolean): UserProgress {
  return { question_id: 'x', answered_correctly: correct, answered_at: new Date().toISOString(), attempt_count: 1 };
}

describe('buildMistakeLedger', () => {
  it('includes a question answered incorrectly, tagged as wrong', () => {
    const q = question({ id: 'q1' });
    const ledger = buildMistakeLedger([q], { q1: progressEntry(false) }, {});
    expect(ledger).toHaveLength(1);
    expect(ledger[0].reason).toBe('wrong');
  });

  it('includes a flagged question even if never answered, tagged as flagged', () => {
    const q = question({ id: 'q2' });
    const ledger = buildMistakeLedger([q], {}, { q2: true });
    expect(ledger).toHaveLength(1);
    expect(ledger[0].reason).toBe('flagged');
  });

  it('tags a question both wrong and flagged as "both"', () => {
    const q = question({ id: 'q3' });
    const ledger = buildMistakeLedger([q], { q3: progressEntry(false) }, { q3: true });
    expect(ledger[0].reason).toBe('both');
  });

  it('excludes a question answered correctly and never flagged', () => {
    const q = question({ id: 'q4' });
    const ledger = buildMistakeLedger([q], { q4: progressEntry(true) }, {});
    expect(ledger).toHaveLength(0);
  });

  it('a later correct re-attempt does not remove a question from the ledger, since the store never overwrites the wrong flag by itself', () => {
    // recordAnswer overwrites progress with the latest attempt, so this documents
    // real behaviour: only the most recent attempt is tracked, not history.
    // Flagging is what survives a correct re-attempt.
    const q = question({ id: 'q5' });
    const ledger = buildMistakeLedger([q], { q5: progressEntry(true) }, { q5: true });
    expect(ledger).toHaveLength(1);
    expect(ledger[0].reason).toBe('flagged');
  });

  it('filters by category when one is given', () => {
    const alertness = question({ id: 'a1', category: 'Alertness' });
    const attitude = question({ id: 'b1', category: 'Attitude' });
    const progress = { a1: progressEntry(false), b1: progressEntry(false) };

    const filtered = buildMistakeLedger([alertness, attitude], progress, {}, 'Attitude');
    expect(filtered).toHaveLength(1);
    expect(filtered[0].question.id).toBe('b1');
  });

  it('returns everything wrong or flagged when no filter is given', () => {
    const alertness = question({ id: 'a1', category: 'Alertness' });
    const attitude = question({ id: 'b1', category: 'Attitude' });
    const progress = { a1: progressEntry(false), b1: progressEntry(false) };

    expect(buildMistakeLedger([alertness, attitude], progress, {})).toHaveLength(2);
  });
});
