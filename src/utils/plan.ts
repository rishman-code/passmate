import type { DVSACategory } from '@/constants/categories';
import type { MockTestResult } from '@/types/database';
import type { LocalDate } from '@/types/journey';
import { addDays, compareLocalDates, daysBetween, daysUntil, todayInLondon } from '@/utils/journey-dates';
import { computeReadiness, type ReadinessVerdict } from '@/utils/readiness';
import { sessionShapeForDaysRemaining } from '@/utils/session-shape';

export interface PlanPhase {
  headline: string;
  detail: string;
  from: LocalDate;
  /** null only for the open-ended phase when there's no test date set yet. */
  to: LocalDate | null;
  isCurrent: boolean;
}

export interface Plan {
  onTrack: boolean;
  /** Up to 3 topics to focus on — real practice weakness first, self-reported filling any gaps. */
  weakFocus: DVSACategory[];
  /** Forward-looking phases from today through test day, reusing session-shape's own brackets. */
  phases: PlanPhase[];
}

function buildPhaseTimeline(testDate: LocalDate | null, today: LocalDate): PlanPhase[] {
  if (!testDate || compareLocalDates(testDate, today) < 0) {
    const shape = sessionShapeForDaysRemaining(testDate ? daysUntil(testDate, today) : null);
    return [{ headline: shape.headline, detail: shape.detail, from: today, to: null, isCurrent: true }];
  }

  const totalDays = daysBetween(today, testDate);
  const phases: PlanPhase[] = [];
  let phaseStart = today;
  let phaseShape = sessionShapeForDaysRemaining(totalDays);

  for (let offset = 1; offset <= totalDays; offset += 1) {
    const date = addDays(today, offset);
    const remaining = daysBetween(date, testDate);
    const shape = sessionShapeForDaysRemaining(remaining);
    if (shape.headline !== phaseShape.headline) {
      phases.push({
        headline: phaseShape.headline,
        detail: phaseShape.detail,
        from: phaseStart,
        to: addDays(date, -1),
        isCurrent: false,
      });
      phaseStart = date;
      phaseShape = shape;
    }
  }

  phases.push({
    headline: phaseShape.headline,
    detail: phaseShape.detail,
    from: phaseStart,
    to: testDate,
    isCurrent: false,
  });
  phases[0].isCurrent = true;

  return phases;
}

function mergeWeakFocus(realWeak: DVSACategory[], selfReported: DVSACategory[]): DVSACategory[] {
  if (realWeak.length === 0) return selfReported.slice(0, 3);

  const merged = [...realWeak];
  for (const category of selfReported) {
    if (!merged.includes(category)) merged.push(category);
  }
  return merged.slice(0, 3);
}

/**
 * "On track" once real practice data exists close to test day: plenty of
 * runway (>13 days out, or no date set at all) always counts as on track,
 * since there's time to still turn it around. Inside 13 days, it tracks the
 * same readiness verdict the rest of the app already uses.
 */
function computeOnTrack(daysRemaining: number | null, verdict: ReadinessVerdict): boolean {
  if (daysRemaining === null || daysRemaining > 13) return true;
  return verdict !== 'not-ready';
}

export function buildPlan(
  testDate: LocalDate | null,
  weakestRealCategories: DVSACategory[],
  selfReportedWeakCategories: DVSACategory[],
  mockTestResults: Pick<MockTestResult, 'score'>[],
  overallAccuracy: number,
): Plan {
  const today = todayInLondon();
  const weakFocus = mergeWeakFocus(weakestRealCategories, selfReportedWeakCategories);
  const readiness = computeReadiness(mockTestResults, overallAccuracy, weakFocus[0] ?? null);
  const daysRemaining = testDate ? daysUntil(testDate, today) : null;

  return {
    onTrack: computeOnTrack(daysRemaining, readiness.verdict),
    weakFocus,
    phases: buildPhaseTimeline(testDate, today),
  };
}
