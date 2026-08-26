export interface SessionShape {
  headline: string;
  detail: string;
}

/**
 * Maps days-to-test into the session shape from the journey spec. `null`
 * means no test date is set yet.
 */
export function sessionShapeForDaysRemaining(daysRemaining: number | null): SessionShape {
  if (daysRemaining === null) {
    return {
      headline: '15 minutes a day',
      detail: 'Breadth-first coverage across all topics.',
    };
  }

  if (daysRemaining <= 0) {
    return {
      headline: 'Test day',
      detail: 'No new content today — just what to bring and the pass marks.',
    };
  }

  if (daysRemaining <= 2) {
    return {
      headline: 'Light review only',
      detail: "Skim your mistake ledger. Don't cram — it won't help this close to test day.",
    };
  }

  if (daysRemaining <= 6) {
    return {
      headline: 'Timed mocks + mistake review',
      detail: 'No new topics from here. Focus on timed mock tests and reviewing past mistakes.',
    };
  }

  if (daysRemaining <= 13) {
    return {
      headline: 'Weak-topic drilling',
      detail: 'Two timed mock tests this week, plus focused drilling on your weakest topics.',
    };
  }

  if (daysRemaining <= 28) {
    return {
      headline: '20 minutes a day',
      detail: 'Mixed practice, with one timed mock test this week.',
    };
  }

  return {
    headline: '15 minutes a day',
    detail: 'Breadth-first coverage with light spaced repetition.',
  };
}
