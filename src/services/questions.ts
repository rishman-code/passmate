import { DVSA_CATEGORIES } from '@/constants/categories';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { SAMPLE_QUESTIONS } from '@/data/sample-questions';
import type { Question } from '@/types/database';

const PAGE_SIZE = 1000;

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
      console.warn('fetchAllQuestions error:', error.message);
      return all.length > 0 ? all : SAMPLE_QUESTIONS;
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

  return all.length > 0 ? all : SAMPLE_QUESTIONS;
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
      console.warn('fetchQuestionsByCategory error:', error.message);
      break;
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

  return SAMPLE_QUESTIONS.filter((q) => q.category === category);
}

export async function fetchQuestionById(id: string): Promise<Question | undefined> {
  if (!isSupabaseConfigured) {
    return SAMPLE_QUESTIONS.find((q) => q.id === id);
  }

  const { data, error } = await supabase.from('questions').select('*').eq('id', id).maybeSingle();

  if (error || !data) {
    return SAMPLE_QUESTIONS.find((q) => q.id === id);
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
