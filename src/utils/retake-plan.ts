import { DVSA_CATEGORIES, type DVSACategory } from '@/constants/categories';
import type { CategoryScore } from '@/types/database';
import type { TestResult } from '@/types/journey';

/** How much one recorded topic error on the result letter boosts that topic's priority. */
export const ERROR_WEIGHT = 3;

const HP_PASS_MARK = 44;

/** Topics the user hasn't practised yet are treated as moderately weak, not perfect. */
const UNPRACTISED_BASE_GAP = 50;

export interface TopicPriority {
  category: DVSACategory;
  priority: number;
  errorCount: number;
}

function baseGap(category: DVSACategory, categoryScores: CategoryScore[]): number {
  const score = categoryScores.find((s) => s.category === category);
  if (!score || score.total_questions === 0) return UNPRACTISED_BASE_GAP;
  return 100 - score.accuracy_percentage;
}

export function isHazardPerceptionWeighted(result: Pick<TestResult, 'hpScore'>): boolean {
  return result.hpScore !== null && result.hpScore < HP_PASS_MARK;
}

/**
 * Ranks all 14 DVSA topics by retake priority: existing practice weakness plus a
 * boost for every error the result letter recorded against that topic. When the
 * hazard perception score is below the pass mark, Hazard Awareness is pinned
 * above every other topic regardless of MCQ score or practice history — DVSA
 * doesn't attribute HP failures to a topic band, so this is the closest
 * practisable proxy in the question bank, and a fixed additive boost could
 * still lose to a topic with a genuinely bad practice history.
 */
export function buildRetakePlan(
  result: Pick<TestResult, 'topicErrors' | 'hpScore'>,
  categoryScores: CategoryScore[] = [],
): TopicPriority[] {
  const priorities = DVSA_CATEGORIES.map((category) => {
    const errorCount = result.topicErrors[category] ?? 0;
    const priority = baseGap(category, categoryScores) + errorCount * ERROR_WEIGHT;
    return { category, priority, errorCount };
  });

  if (isHazardPerceptionWeighted(result)) {
    const highest = Math.max(...priorities.map((p) => p.priority));
    const hazardAwareness = priorities.find((p) => p.category === 'Hazard Awareness');
    if (hazardAwareness) {
      hazardAwareness.priority = highest + 1;
    }
  }

  return priorities.sort((a, b) => b.priority - a.priority);
}
