import { generateAIExplanation } from '@/lib/anthropic';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import type { AIExplanationCache, Question } from '@/types/database';

const memoryCache = new Map<string, string>();

function cacheKey(questionId: string, wrongAnswer: string) {
  return `${questionId}:${wrongAnswer}`;
}

export async function getAIExplanation(
  question: Question,
  wrongAnswer: string,
): Promise<string> {
  const key = cacheKey(question.id, wrongAnswer);
  const cached = memoryCache.get(key);

  if (cached) {
    return cached;
  }

  if (isSupabaseConfigured) {
    const { data } = await supabase
      .from('ai_explanation_cache')
      .select('ai_explanation')
      .eq('question_id', question.id)
      .eq('wrong_answer', wrongAnswer)
      .maybeSingle();

    if (data?.ai_explanation) {
      memoryCache.set(key, data.ai_explanation);
      return data.ai_explanation;
    }
  }

  const explanation = await generateAIExplanation(question, wrongAnswer);
  memoryCache.set(key, explanation);

  if (isSupabaseConfigured) {
    const entry: AIExplanationCache = {
      question_id: question.id,
      wrong_answer: wrongAnswer,
      ai_explanation: explanation,
      created_at: new Date().toISOString(),
    };

    await supabase.from('ai_explanation_cache').upsert(entry);
  }

  return explanation;
}
