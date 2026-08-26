import { describe, expect, it } from 'vitest';

import { MOCK_TEST_PASS_SCORE, MOCK_TEST_QUESTION_COUNT } from '@/constants/categories';
import { computeReadiness } from './readiness';

describe('computeReadiness', () => {
  it('is "ready" only after two consecutive mocks at/above the pass mark', () => {
    const readiness = computeReadiness(
      [{ score: MOCK_TEST_PASS_SCORE + 2 }, { score: MOCK_TEST_PASS_SCORE }],
      90,
      null,
    );
    expect(readiness.verdict).toBe('ready');
    expect(readiness.score).toBe(MOCK_TEST_PASS_SCORE + 2);
    expect(readiness.isEstimate).toBe(false);
  });

  it('is not "ready" off a single good mock — needs a second to confirm consistency', () => {
    const readiness = computeReadiness([{ score: MOCK_TEST_PASS_SCORE + 2 }], 90, null);
    expect(readiness.verdict).not.toBe('ready');
  });

  it('is "close" when the latest mock is within the margin of the pass mark', () => {
    const readiness = computeReadiness(
      [{ score: MOCK_TEST_PASS_SCORE - 3 }, { score: MOCK_TEST_PASS_SCORE - 8 }],
      70,
      'Hazard Awareness',
    );
    expect(readiness.verdict).toBe('close');
    expect(readiness.message).toContain('Hazard Awareness');
  });

  it('is "not ready" with a clearly low mock score, and the message states that exact score', () => {
    const readiness = computeReadiness([{ score: 31 }], 50, null);
    expect(readiness.verdict).toBe('not-ready');
    expect(readiness.score).toBe(31);
    expect(readiness.message).toContain('31/50');
  });

  it('never contradicts itself: the displayed score always matches the verdict basis', () => {
    const cases: Array<[{ score: number }[], number]> = [
      [[{ score: 45 }, { score: 44 }], 45],
      [[{ score: 20 }], 20],
      [[], 20], // no mocks -> estimated from the 40% overall accuracy passed below: round(0.4 * 50)
    ];
    for (const [mocks, expectedScore] of cases) {
      const readiness = computeReadiness(mocks, 40, null);
      expect(readiness.score).toBe(expectedScore);
      if (readiness.verdict === 'not-ready') {
        expect(readiness.message).toContain(`${readiness.score}/${MOCK_TEST_QUESTION_COUNT}`);
      }
    }
  });

  it('falls back to an accuracy-based estimate with no mock taken yet, and never claims "ready" from an estimate alone', () => {
    const readiness = computeReadiness([], 96, null);
    expect(readiness.isEstimate).toBe(true);
    expect(readiness.verdict).not.toBe('ready');
    expect(readiness.verdict).toBe('close');
  });

  it('estimate path also goes "not ready" for low accuracy', () => {
    const readiness = computeReadiness([], 30, null);
    expect(readiness.verdict).toBe('not-ready');
    expect(readiness.isEstimate).toBe(true);
  });
});
