import Anthropic from '@anthropic-ai/sdk';

import type { Question } from '@/types/database';

const apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY ?? '';

export const isAnthropicConfigured =
  apiKey.length > 0 && !apiKey.includes('placeholder');

const anthropic = isAnthropicConfigured
  ? new Anthropic({ apiKey, dangerouslyAllowBrowser: true })
  : null;

export async function generateAIExplanation(
  question: Question,
  wrongAnswer: string,
): Promise<string> {
  if (!anthropic) {
    return question.explanation;
  }

  const correctOption = question[`option_${question.correct_answer}` as keyof Question] as string;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 300,
    messages: [
      {
        role: 'user',
        content: `You are a friendly UK driving instructor helping a learner prepare for their DVSA theory test.

Question: ${question.question_text}
Category: ${question.category}
Student's wrong answer: ${wrongAnswer}
Correct answer: ${correctOption}
Official DVSA explanation: ${question.explanation}

Explain in 2-3 short paragraphs why the student's answer was wrong and why the correct answer is right. Use simple language. Be encouraging, not condescending.`,
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === 'text');
  return textBlock?.type === 'text' ? textBlock.text : question.explanation;
}
