import Anthropic from '@anthropic-ai/sdk';

import type { Question } from '@/types/database';

const apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY ?? '';

export const isAIConfigured = apiKey.length > 0 && apiKey !== 'placeholder';

export async function generateAIExplanation(question: Question): Promise<string> {
  if (!isAIConfigured) {
    return question.explanation;
  }

  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
  const correctText = question[`option_${question.correct_answer}` as keyof Question] as string;

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 200,
    messages: [
      {
        role: 'user',
        content: `You are a UK driving theory test instructor. In 2-3 clear sentences, explain why "${correctText}" is the correct answer to the question below. Build on the official DVSA explanation but make it more memorable for a learner.

Question: ${question.question_text}
Category: ${question.category}
Correct answer: ${correctText}
DVSA explanation: ${question.explanation}`,
      },
    ],
  });

  const block = message.content[0];
  return block.type === 'text' ? block.text : question.explanation;
}
