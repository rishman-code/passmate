import type { Question } from '@/types/database';

const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL ?? '';

export const isAIExplanationConfigured = backendUrl.length > 0;

export async function generateAIExplanation(
  question: Question,
  wrongAnswer: string,
): Promise<string> {
  if (!isAIExplanationConfigured) {
    return question.explanation;
  }

  const correctOption = question[`option_${question.correct_answer}` as keyof Question] as string;

  const response = await fetch(`${backendUrl}/api/ai-explanation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      question_text: question.question_text,
      category: question.category,
      wrong_answer_text: wrongAnswer,
      correct_answer_text: correctOption,
      official_explanation: question.explanation,
    }),
  });

  if (!response.ok) {
    return question.explanation;
  }

  const data = await response.json();
  return data.explanation ?? question.explanation;
}
