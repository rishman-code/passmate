import { describe, expect, it } from 'vitest';

import { addDays, todayInLondon } from '@/utils/journey-dates';
import { buildPlan } from './plan';

const today = todayInLondon();

describe('buildPlan phases', () => {
  it('produces a single open-ended phase when no test date is set', () => {
    const plan = buildPlan(null, [], [], [], 0);
    expect(plan.phases).toHaveLength(1);
    expect(plan.phases[0].to).toBeNull();
    expect(plan.phases[0].isCurrent).toBe(true);
    expect(plan.phases[0].headline).toBe('15 minutes a day');
  });

  it('builds a chronological timeline of phases from today through test day', () => {
    const testDate = addDays(today, 40);
    const plan = buildPlan(testDate, [], [], [], 0);

    // 40 days out crosses every bracket: 15min -> 20min -> drilling -> mocks -> review -> test day.
    expect(plan.phases.map((p) => p.headline)).toEqual([
      '15 minutes a day',
      '20 minutes a day',
      'Weak-topic drilling',
      'Timed mocks + mistake review',
      'Light review only',
      'Test day',
    ]);
    expect(plan.phases[0].from).toBe(today);
    expect(plan.phases[0].isCurrent).toBe(true);
    expect(plan.phases.at(-1)?.to).toBe(testDate);

    // Phases are contiguous: each phase's start is the day after the previous phase's end.
    for (let i = 1; i < plan.phases.length; i += 1) {
      expect(plan.phases[i].from).toBe(addDays(plan.phases[i - 1].to as string, 1));
    }
  });

  it('starts the timeline at today, not at the far past, when the test is very close', () => {
    const testDate = addDays(today, 1);
    const plan = buildPlan(testDate, [], [], [], 0);
    expect(plan.phases[0].from).toBe(today);
    expect(plan.phases[0].headline).toBe('Light review only');
  });

  it('falls back to a single open-ended phase for a test date already in the past', () => {
    const plan = buildPlan(addDays(today, -5), [], [], [], 0);
    expect(plan.phases).toHaveLength(1);
    expect(plan.phases[0].to).toBeNull();
  });
});

describe('buildPlan weakFocus', () => {
  it('uses self-reported topics when there is no real practice data yet', () => {
    const plan = buildPlan(null, [], ['Hazard Awareness', 'Motorway Rules'], [], 0);
    expect(plan.weakFocus).toEqual(['Hazard Awareness', 'Motorway Rules']);
  });

  it('prioritises real weak categories over self-reported ones once real data exists', () => {
    const plan = buildPlan(null, ['Documents'], ['Hazard Awareness'], [], 0);
    expect(plan.weakFocus[0]).toBe('Documents');
    expect(plan.weakFocus).toContain('Hazard Awareness');
  });

  it('caps weak focus at 3 topics', () => {
    const plan = buildPlan(
      null,
      ['Documents', 'Accidents', 'Attitude'],
      ['Hazard Awareness', 'Motorway Rules'],
      [],
      0,
    );
    expect(plan.weakFocus).toHaveLength(3);
  });

  it('does not duplicate a category that appears in both lists', () => {
    const plan = buildPlan(null, ['Documents'], ['Documents', 'Attitude'], [], 0);
    expect(plan.weakFocus).toEqual(['Documents', 'Attitude']);
  });
});

describe('buildPlan onTrack', () => {
  it('is always on track with no test date set', () => {
    expect(buildPlan(null, [], [], [], 0).onTrack).toBe(true);
  });

  it('is on track with plenty of runway even if not ready yet', () => {
    const testDate = addDays(today, 20);
    expect(buildPlan(testDate, [], [], [], 10).onTrack).toBe(true);
  });

  it('is behind schedule close to test day with a not-ready verdict', () => {
    const testDate = addDays(today, 5);
    expect(buildPlan(testDate, [], [], [], 10).onTrack).toBe(false);
  });

  it('is on track close to test day once the readiness verdict is not "not-ready"', () => {
    const testDate = addDays(today, 5);
    expect(buildPlan(testDate, [], [], [], 96).onTrack).toBe(true);
  });
});
