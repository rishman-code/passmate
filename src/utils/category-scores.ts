import { DVSA_CATEGORIES } from '@/constants/categories';
import type { CategoryScore, UserProgress } from '@/types/database';

export function computeCategoryScores(
  progress: Record<string, UserProgress>,
  questionCategories: Record<string, string>,
): CategoryScore[] {
  const byCategory: Record<string, { total: number; correct: number }> = {};

  for (const category of DVSA_CATEGORIES) {
    byCategory[category] = { total: 0, correct: 0 };
  }

  for (const entry of Object.values(progress)) {
    const category = questionCategories[entry.question_id];
    if (!category) {
      continue;
    }

    byCategory[category].total += 1;
    if (entry.answered_correctly) {
      byCategory[category].correct += 1;
    }
  }

  return DVSA_CATEGORIES.map((category) => {
    const { total, correct } = byCategory[category];
    return {
      category,
      total_questions: total,
      correct_answers: correct,
      accuracy_percentage: total > 0 ? Math.round((correct / total) * 100) : 0,
    };
  });
}

export function getWeakestCategories(scores: CategoryScore[], limit = 3): CategoryScore[] {
  return scores
    .filter((score) => score.total_questions > 0)
    .sort((a, b) => a.accuracy_percentage - b.accuracy_percentage)
    .slice(0, limit);
}
