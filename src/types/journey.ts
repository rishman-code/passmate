import type { DVSACategory } from '@/constants/categories';

/** Date-only, no time component, always interpreted in Europe/London. */
export type LocalDate = string;

export type JourneyState = 'preparing' | 'booked' | 'retake' | 'certified';

export interface TestResult {
  attemptDate: LocalDate;
  mcqScore: number | null;
  hpScore: number | null;
  topicErrors: Partial<Record<DVSACategory, number>>;
  clipScores: number[] | null;
  source: 'ocr' | 'manual';
  outcome: 'pass' | 'fail';
}

export interface Certificate {
  passDate: LocalDate;
  expiryDate: LocalDate;
  certificateNumber: string | null;
}

export interface UserJourney {
  state: JourneyState;
  testDate: LocalDate | null;
  lastResult: TestResult | null;
  certificate: Certificate | null;
  /**
   * Self-reported during onboarding, before any real practice data exists.
   * Once the user has actually answered questions, real category accuracy
   * is the better signal — this is a starting prior, not overwritten by
   * practice but naturally outweighed by it in plan-building.
   */
  selfReportedWeakCategories: DVSACategory[];
  updatedAt: string;
}
