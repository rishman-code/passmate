import { describe, expect, it } from 'vitest';

import { sessionShapeForDaysRemaining } from './session-shape';

describe('sessionShapeForDaysRemaining', () => {
  it('no date set -> breadth-first, no spaced repetition mention', () => {
    const shape = sessionShapeForDaysRemaining(null);
    expect(shape.headline).toBe('15 minutes a day');
    expect(shape.detail).not.toMatch(/spaced repetition/);
  });

  it('> 28 days -> breadth-first with spaced repetition', () => {
    const shape = sessionShapeForDaysRemaining(29);
    expect(shape.headline).toBe('15 minutes a day');
    expect(shape.detail).toMatch(/spaced repetition/);
  });

  it('14-28 days -> 20 min/day mixed practice', () => {
    expect(sessionShapeForDaysRemaining(28).headline).toBe('20 minutes a day');
    expect(sessionShapeForDaysRemaining(14).headline).toBe('20 minutes a day');
  });

  it('7-13 days -> weak-topic drilling', () => {
    expect(sessionShapeForDaysRemaining(13).headline).toBe('Weak-topic drilling');
    expect(sessionShapeForDaysRemaining(7).headline).toBe('Weak-topic drilling');
  });

  it('3-6 days -> timed mocks + mistake review, no new topics', () => {
    expect(sessionShapeForDaysRemaining(6).headline).toBe('Timed mocks + mistake review');
    expect(sessionShapeForDaysRemaining(3).detail).toMatch(/No new topics/);
  });

  it('1-2 days -> light review only, explicitly discourages cramming', () => {
    const shape = sessionShapeForDaysRemaining(1);
    expect(shape.headline).toBe('Light review only');
    expect(shape.detail).toMatch(/cram/i);
  });

  it('day of -> calm, no content', () => {
    const shape = sessionShapeForDaysRemaining(0);
    expect(shape.headline).toBe('Test day');
    expect(shape.detail).toMatch(/No new content/);
  });

  it('emphasizes the mistake ledger only for the two closest-to-test brackets', () => {
    expect(sessionShapeForDaysRemaining(1).emphasizeMistakeReview).toBe(true);
    expect(sessionShapeForDaysRemaining(6).emphasizeMistakeReview).toBe(true);
    expect(sessionShapeForDaysRemaining(7).emphasizeMistakeReview).toBe(false);
    expect(sessionShapeForDaysRemaining(0).emphasizeMistakeReview).toBe(false);
    expect(sessionShapeForDaysRemaining(null).emphasizeMistakeReview).toBe(false);
  });
});
