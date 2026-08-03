import { supabase } from '@/lib/supabase';
import type { Question } from '@/types/database';

function stripMarkdown(text: string): string {
  return text
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/^\s*[-*]\s+/gm, '')
    .trim();
}

const memoryCache = new Map<string, string>();

export async function getAIExplanation(question: Question): Promise<string> {
  const cached = memoryCache.get(question.id);
  if (cached) return cached;

  try {
    const { data, error } = await supabase.functions.invoke<{ explanation: string }>('ai-explanation', {
      body: { question_id: question.id },
    });

    if (error || !data?.explanation) return question.explanation;

    const clean = stripMarkdown(data.explanation);
    memoryCache.set(question.id, clean);
    return clean;
  } catch {
    return question.explanation;
  }
}
