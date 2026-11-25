import { DVSA_CATEGORIES } from '@/constants/categories';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { SAMPLE_QUESTIONS } from '@/data/sample-questions';
import type { Question } from '@/types/database';

const PAGE_SIZE = 1000;

/**
 * Thrown when Supabase is configured but returns no questions (query error,
 * or zero rows -- e.g. RLS switched on for `questions` without a SELECT
 * policy). We deliberately do NOT fall back to SAMPLE_QUESTIONS here: their
 * ids (q1..q14) don't exist in the database, so every progress save would
 * fail its foreign key, and a 14-question mock test can never reach the
 * 43/50 pass mark. Sample questions are only for running without Supabase.
 */
export class QuestionsUnavailableError extends Error {
  constructor(detail: string) {
    super(`Questions could not be loaded: ${detail}`);
    this.name = 'QuestionsUnavailableError';
  }
}

async function fetchQuestionsPage(from: number, to: number, category?: string) {
  let query = supabase.from('questions').select('*').range(from, to);

  if (category) {
    query = query.eq('category', category);
  }

  return query;
}

export async function fetchAllQuestions(): Promise<Question[]> {
  if (!isSupabaseConfigured) {
    return SAMPLE_QUESTIONS;
  }

  const all: Question[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await fetchQuestionsPage(from, from + PAGE_SIZE - 1);

    if (error) {
      console.error('fetchAllQuestions error:', error.message);
      if (all.length > 0) return all;
      throw new QuestionsUnavailableError(error.message);
    }

    if (!data?.length) {
      break;
    }

    all.push(...(data as Question[]));

    if (data.length < PAGE_SIZE) {
      break;
    }

    from += PAGE_SIZE;
  }

  if (all.length === 0) {
    console.error('fetchAllQuestions: Supabase returned 0 questions (check RLS on public.questions)');
    throw new QuestionsUnavailableError('the questions table returned no rows');
  }

  return all;
}

export async function fetchQuestionsByCategory(category: string): Promise<Question[]> {
  if (!isSupabaseConfigured) {
    return SAMPLE_QUESTIONS.filter((q) => q.category === category);
  }

  const all: Question[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await fetchQuestionsPage(from, from + PAGE_SIZE - 1, category);

    if (error) {
      console.error('fetchQuestionsByCategory error:', error.message);
      if (all.length > 0) return all;
      throw new QuestionsUnavailableError(error.message);
    }

    if (!data?.length) {
      break;
    }

    all.push(...(data as Question[]));

    if (data.length < PAGE_SIZE) {
      break;
    }

    from += PAGE_SIZE;
  }

  if (all.length > 0) {
    return all;
  }

  console.error(`fetchQuestionsByCategory: Supabase returned 0 questions for "${category}"`);
  throw new QuestionsUnavailableError(`no questions returned for ${category}`);
}

export async function fetchQuestionById(id: string): Promise<Question | undefined> {
  if (!isSupabaseConfigured) {
    return SAMPLE_QUESTIONS.find((q) => q.id === id);
  }

  const { data, error } = await supabase.from('questions').select('*').eq('id', id).maybeSingle();

  if (error) {
    console.error('fetchQuestionById error:', error.message);
    return undefined;
  }

  if (!data) {
    return undefined;
  }

  return data as Question;
}

export function shuffleQuestions<T>(items: T[]): T[] {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function selectMockTestQuestions(questions: Question[], count: number): Question[] {
  if (questions.length === 0) {
    return [];
  }

  const byCategory = new Map<string, Question[]>();

  for (const category of DVSA_CATEGORIES) {
    byCategory.set(category, []);
  }

  for (const question of questions) {
    const bucket = byCategory.get(question.category);
    if (bucket) {
      bucket.push(question);
    }
  }

  const basePerCategory = Math.floor(count / DVSA_CATEGORIES.length);
  let remainder = count % DVSA_CATEGORIES.length;
  const selected: Question[] = [];

  for (const category of DVSA_CATEGORIES) {
    const pool = shuffleQuestions(byCategory.get(category) ?? []);
    let take = basePerCategory;

    if (remainder > 0) {
      take += 1;
      remainder -= 1;
    }

    selected.push(...pool.slice(0, take));
  }

  if (selected.length < count) {
    const usedIds = new Set(selected.map((q) => q.id));
    const leftovers = shuffleQuestions(questions.filter((q) => !usedIds.has(q.id)));
    selected.push(...leftovers.slice(0, count - selected.length));
  }

  return shuffleQuestions(selected).slice(0, count);
}
