import { describe, expect, it } from 'vitest';

import type { TestResult } from '@/types/journey';
import { buildRetakePlan, isHazardPerceptionWeighted } from './retake-plan';

function result(overrides: Partial<TestResult> = {}): Pick<TestResult, 'topicErrors' | 'hpScore'> {
  return {
    topicErrors: {},
    hpScore: 60,
    ...overrides,
  };
}

describe('buildRetakePlan', () => {
  it('makes a topic with recorded errors dominate the plan', () => {
    const plan = buildRetakePlan(
      result({ topicErrors: { 'Rules of the Road': 4 } }),
    );

    expect(plan[0].category).toBe('Rules of the Road');
    expect(plan[0].errorCount).toBe(4);
    // It should clearly lead the field, not just edge out the rest.
    expect(plan[0].priority).toBeGreaterThan(plan[1].priority);
  });

  it('ranks topics with more errors above topics with fewer, all else equal', () => {
    const plan = buildRetakePlan(
      result({
        topicErrors: { 'Hazard Awareness': 1, 'Vehicle Loading': 5 },
        hpScore: 60,
      }),
    );

    const vehicleLoadingRank = plan.findIndex((p) => p.category === 'Vehicle Loading');
    const hazardAwarenessRank = plan.findIndex((p) => p.category === 'Hazard Awareness');
    expect(vehicleLoadingRank).toBeLessThan(hazardAwarenessRank);
  });

  it('produces an HP-weighted plan when the HP score is below the pass mark, even with a strong MCQ score', () => {
    const plan = buildRetakePlan(result({ topicErrors: {}, hpScore: 40 }));
    expect(plan[0].category).toBe('Hazard Awareness');
  });

  it('keeps Hazard Awareness on top even when another topic has a much worse practice history or more letter errors', () => {
    const plan = buildRetakePlan(
      result({ topicErrors: { 'Rules of the Road': 10 }, hpScore: 40 }),
      [{ category: 'Documents', total_questions: 5, correct_answers: 0, accuracy_percentage: 0 }],
    );
    expect(plan[0].category).toBe('Hazard Awareness');
  });

  it('does not HP-weight the plan when the HP score passes', () => {
    const plan = buildRetakePlan(
      result({ topicErrors: { Documents: 2 }, hpScore: 50 }),
    );
    expect(plan[0].category).toBe('Documents');
  });

  it('treats a missing HP score as not HP-weighted', () => {
    expect(isHazardPerceptionWeighted({ hpScore: null })).toBe(false);
  });

  it('uses practice history as the base gap when a category has been practised', () => {
    const plan = buildRetakePlan(result({ topicErrors: {} }), [
      { category: 'Attitude', total_questions: 10, correct_answers: 2, accuracy_percentage: 20 },
      { category: 'Documents', total_questions: 10, correct_answers: 9, accuracy_percentage: 90 },
    ]);

    const attitudeRank = plan.findIndex((p) => p.category === 'Attitude');
    const documentsRank = plan.findIndex((p) => p.category === 'Documents');
    expect(attitudeRank).toBeLessThan(documentsRank);
  });
});
