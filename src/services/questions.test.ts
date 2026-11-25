import { beforeEach, describe, expect, it, vi } from 'vitest';

type QueryResult = { data: unknown[] | null; error: { message: string } | null };

const state: { result: QueryResult } = { result: { data: [], error: null } };

vi.mock('@/lib/supabase', () => {
  const builder = {
    select: () => builder,
    range: () => builder,
    eq: () => builder,
    then: (resolve: (r: QueryResult) => unknown) => Promise.resolve(state.result).then(resolve),
  };
  return {
    isSupabaseConfigured: true,
    supabase: { from: () => builder },
  };
});

import { QuestionsUnavailableError, fetchAllQuestions, fetchQuestionsByCategory } from './questions';

const realQuestion = {
  id: 'dvsa-001',
  category: 'Alertness',
  question_text: 'Q',
  option_a: 'a',
  option_b: 'b',
  option_c: 'c',
  option_d: 'd',
  correct_answer: 'a',
  explanation: 'e',
};

describe('question fetching with Supabase configured', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('returns database rows when there are some', async () => {
    state.result = { data: [realQuestion], error: null };
    await expect(fetchAllQuestions()).resolves.toEqual([realQuestion]);
  });

  it('throws instead of falling back to sample questions when 0 rows come back (e.g. RLS with no policy)', async () => {
    state.result = { data: [], error: null };
    await expect(fetchAllQuestions()).rejects.toBeInstanceOf(QuestionsUnavailableError);
    await expect(fetchQuestionsByCategory('Alertness')).rejects.toBeInstanceOf(QuestionsUnavailableError);
  });

  it('throws on a query error', async () => {
    state.result = { data: null, error: { message: 'permission denied' } };
    await expect(fetchAllQuestions()).rejects.toBeInstanceOf(QuestionsUnavailableError);
  });
});
