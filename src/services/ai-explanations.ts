import { generateAIExplanation } from '@/lib/anthropic';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import type { AIExplanationCache, Question } from '@/types/database';

function stripMarkdown(text: string): string {
  return text
    .replace(/^#{1,6}\s+/gm, '')   // headings
    .replace(/\*\*(.+?)\*\*/g, '$1') // bold
    .replace(/\*(.+?)\*/g, '$1')     // italic
    .replace(/`(.+?)`/g, '$1')       // inline code
    .replace(/^\s*[-*]\s+/gm, '')    // bullet points
    .trim();
}

const memoryCache = new Map<string, string>();

export async function getAIExplanation(question: Question): Promise<string> {
  const cached = memoryCache.get(question.id);
  if (cached) return cached;

  if (isSupabaseConfigured) {
    const { data } = await supabase
      .from('ai_explanation_cache')
      .select('ai_explanation')
      .eq('question_id', question.id)
      .maybeSingle();

    if (data?.ai_explanation) {
      const clean = stripMarkdown(data.ai_explanation);
      memoryCache.set(question.id, clean);
      return clean;
    }
  }

  const explanation = stripMarkdown(await generateAIExplanation(question));
  memoryCache.set(question.id, explanation);

  if (isSupabaseConfigured) {
    const entry: AIExplanationCache = {
      question_id: question.id,
      ai_explanation: explanation,
      created_at: new Date().toISOString(),
    };
    await supabase.from('ai_explanation_cache').upsert(entry);
  }

  return explanation;
}
