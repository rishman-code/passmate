import type { Question, UserProgress } from '@/types/database';

export function buildAdaptiveQuestionQueue(
  allQuestions: Question[],
  progress: Record<string, UserProgress>,
  count = 10,
): Question[] {
  if (allQuestions.length === 0) {
    return [];
  }

  const weighted = allQuestions.map((question) => {
    const entry = progress[question.id];
    let weight = 1;

    if (!entry) {
      weight = 3;
    } else if (!entry.answered_correctly) {
      weight = 5 + entry.attempt_count;
    } else if (entry.attempt_count > 1) {
      weight = 2;
    }

    return { question, weight };
  });

  const selected: Question[] = [];
  const pool = [...weighted];

  while (selected.length < count && pool.length > 0) {
    const totalWeight = pool.reduce((sum, item) => sum + item.weight, 0);
    let random = Math.random() * totalWeight;

    for (let i = 0; i < pool.length; i += 1) {
      random -= pool[i].weight;
      if (random <= 0) {
        selected.push(pool[i].question);
        pool.splice(i, 1);
        break;
      }
    }
  }

  return selected;
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function getOptionLabel(answer: string): string {
  return answer.toUpperCase();
}

export function getOptionText(
  question: Question,
  option: 'a' | 'b' | 'c' | 'd',
): string {
  const key = `option_${option}` as keyof Question;
  return question[key] as string;
}
