import { describe, expect, it } from 'vitest';

import {
  addDays,
  addMonths,
  addYears,
  certificateExpiryDate,
  compareLocalDates,
  daysBetween,
  daysUntil,
  earliestRetakeDate,
  formatLocalDateLong,
  isCertificateValid,
  isValidLocalDate,
  monthsUntil,
  todayInLondon,
} from './journey-dates';

describe('isValidLocalDate', () => {
  it('accepts real calendar dates', () => {
    expect(isValidLocalDate('2026-08-26')).toBe(true);
    expect(isValidLocalDate('2024-02-29')).toBe(true);
  });

  it('rejects malformed or non-existent dates', () => {
    expect(isValidLocalDate('2026-8-26')).toBe(false);
    expect(isValidLocalDate('2026-13-01')).toBe(false);
    expect(isValidLocalDate('2025-02-29')).toBe(false);
    expect(isValidLocalDate('not-a-date')).toBe(false);
  });
});

describe('compareLocalDates', () => {
  it('orders dates lexicographically', () => {
    expect(compareLocalDates('2026-01-01', '2026-01-02')).toBeLessThan(0);
    expect(compareLocalDates('2026-01-02', '2026-01-01')).toBeGreaterThan(0);
    expect(compareLocalDates('2026-01-01', '2026-01-01')).toBe(0);
  });
});

describe('addDays', () => {
  it('adds days within a month', () => {
    expect(addDays('2026-08-01', 5)).toBe('2026-08-06');
  });

  it('rolls over month and year boundaries', () => {
    expect(addDays('2026-08-30', 5)).toBe('2026-09-04');
    expect(addDays('2026-12-30', 5)).toBe('2027-01-04');
  });

  it('supports negative offsets', () => {
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31');
  });
});

describe('addYears', () => {
  it('adds whole years, same month/day', () => {
    expect(addYears('2026-05-21', 2)).toBe('2028-05-21');
  });

  it('rolls a leap-day anniversary forward when the target year has no 29 Feb', () => {
    expect(addYears('2024-02-29', 1)).toBe('2025-03-01');
    expect(addYears('2024-02-29', 4)).toBe('2028-02-29');
  });
});

describe('addMonths', () => {
  it('adds whole months, same day', () => {
    expect(addMonths('2028-05-21', -6)).toBe('2027-11-21');
    expect(addMonths('2026-08-26', 3)).toBe('2026-11-26');
  });

  it('crosses a year boundary', () => {
    expect(addMonths('2026-01-15', -2)).toBe('2025-11-15');
  });

  it('normalises a day that does not exist in the target month', () => {
    expect(addMonths('2026-01-31', 1)).toBe('2026-03-03');
  });
});

describe('monthsUntil', () => {
  it('counts whole calendar months, not just elapsed days', () => {
    expect(monthsUntil('2028-05-21', '2026-05-21')).toBe(24);
    expect(monthsUntil('2028-05-20', '2026-05-21')).toBe(23);
    expect(monthsUntil('2026-05-21', '2026-05-21')).toBe(0);
  });
});

describe('daysBetween / daysUntil', () => {
  it('counts whole days forward and backward', () => {
    expect(daysBetween('2026-08-01', '2026-08-10')).toBe(9);
    expect(daysBetween('2026-08-10', '2026-08-01')).toBe(-9);
    expect(daysBetween('2026-08-01', '2026-08-01')).toBe(0);
  });

  it('is unaffected by the BST/GMT transition', () => {
    // 29 Mar 2026 is the UK clocks-forward date; a naive UTC-instant diff
    // would misreport this as anything other than exactly 1 day.
    expect(daysBetween('2026-03-28', '2026-03-29')).toBe(1);
    // 25 Oct 2026 is the UK clocks-back date.
    expect(daysBetween('2026-10-24', '2026-10-25')).toBe(1);
  });

  it('daysUntil uses an explicit "from" when given', () => {
    expect(daysUntil('2026-09-01', '2026-08-25')).toBe(7);
  });
});

describe('certificate expiry', () => {
  it('expires exactly 2 years after the pass date', () => {
    expect(certificateExpiryDate('2026-05-21')).toBe('2028-05-21');
  });

  it('is valid on the anniversary date itself but not the day after', () => {
    const expiry = certificateExpiryDate('2026-05-21');
    expect(isCertificateValid(expiry, expiry)).toBe(true);
    expect(isCertificateValid(expiry, addDays(expiry, 1))).toBe(false);
    expect(isCertificateValid(expiry, addDays(expiry, -1))).toBe(true);
  });
});

describe('todayInLondon', () => {
  it('returns a well-formed local date', () => {
    expect(isValidLocalDate(todayInLondon())).toBe(true);
  });
});

describe('earliestRetakeDate', () => {
  it('failing on a Monday gives Friday as the earliest retest (Tue/Wed/Thu are the 3 clear days)', () => {
    expect(earliestRetakeDate('2026-08-24')).toBe('2026-08-28');
  });

  it('failing on a Friday gives the following Wednesday (Sat/Mon/Tue are the 3 clear days; Sunday doesn\'t count)', () => {
    expect(earliestRetakeDate('2026-08-28')).toBe('2026-09-02');
  });

  it('a bank holiday inside the window pushes the retest date out by one working day', () => {
    const withoutHoliday = earliestRetakeDate('2026-08-24');
    const withHoliday = earliestRetakeDate('2026-08-24', ['2026-08-26']);
    expect(withoutHoliday).toBe('2026-08-28');
    expect(withHoliday).toBe('2026-08-29');
  });

  it('works with no bank holiday data at all (offline fallback path)', () => {
    expect(earliestRetakeDate('2026-08-24', [])).toBe('2026-08-28');
  });
});

describe('formatLocalDateLong', () => {
  it('formats a date-only string as a readable UK date', () => {
    expect(formatLocalDateLong('2026-08-28')).toBe('28 August 2026');
  });
});
