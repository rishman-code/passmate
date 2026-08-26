import { MOCK_TEST_PASS_SCORE, MOCK_TEST_QUESTION_COUNT } from '@/constants/categories';
import type { MockTestResult } from '@/types/database';

export type ReadinessVerdict = 'not-ready' | 'close' | 'ready';

export interface Readiness {
  verdict: ReadinessVerdict;
  /** Out of MOCK_TEST_QUESTION_COUNT — always the number the message is built from. */
  score: number;
  /** True when there's no real mock test yet and the score is derived from practice accuracy. */
  isEstimate: boolean;
  message: string;
}

/** Within this many marks of the pass mark counts as "nearly there". */
const CLOSE_MARGIN = 5;
/** This many most-recent mocks, all at/above the pass mark, before we call it "ready". */
const READY_STREAK = 2;

function closeMessage(weakestCategory: string | null): string {
  return weakestCategory
    ? `You're nearly there. Focus on ${weakestCategory} this week.`
    : "You're nearly there. Keep practising your weaker topics this week.";
}

function notReadyMessage(score: number, isEstimate: boolean): string {
  const scoreLine = `You're scoring ${score}/${MOCK_TEST_QUESTION_COUNT}. Most learners need consistent ${MOCK_TEST_PASS_SCORE}+ before test day.`;
  return isEstimate ? `Based on your practice accuracy so far: ${scoreLine}` : scoreLine;
}

/**
 * Readiness is judged primarily on real timed mock tests — that's what DVSA
 * actually scores. With no mock taken yet, practice accuracy is used as a
 * rough estimate, but that alone is never enough to call someone "ready":
 * we ask for a real mock first, so the "ready" verdict (which can prompt an
 * unbooked user to book) is never based on a guess.
 */
export function computeReadiness(
  mockTestResults: Pick<MockTestResult, 'score'>[],
  overallAccuracy: number,
  weakestCategory: string | null,
): Readiness {
  if (mockTestResults.length > 0) {
    const recentMocks = mockTestResults.slice(0, READY_STREAK);
    const latest = recentMocks[0].score;

    if (recentMocks.length >= READY_STREAK && recentMocks.every((m) => m.score >= MOCK_TEST_PASS_SCORE)) {
      return {
        verdict: 'ready',
        score: latest,
        isEstimate: false,
        message: "You're consistently scoring above the pass mark.",
      };
    }

    if (latest >= MOCK_TEST_PASS_SCORE - CLOSE_MARGIN) {
      return { verdict: 'close', score: latest, isEstimate: false, message: closeMessage(weakestCategory) };
    }

    return { verdict: 'not-ready', score: latest, isEstimate: false, message: notReadyMessage(latest, false) };
  }

  const estimatedScore = Math.round((overallAccuracy / 100) * MOCK_TEST_QUESTION_COUNT);

  if (estimatedScore >= MOCK_TEST_PASS_SCORE - CLOSE_MARGIN) {
    return {
      verdict: 'close',
      score: estimatedScore,
      isEstimate: true,
      message:
        estimatedScore >= MOCK_TEST_PASS_SCORE
          ? "Your practice accuracy looks strong — take a timed mock test to see where you really stand."
          : closeMessage(weakestCategory),
    };
  }

  return {
    verdict: 'not-ready',
    score: estimatedScore,
    isEstimate: true,
    message: notReadyMessage(estimatedScore, true),
  };
}
