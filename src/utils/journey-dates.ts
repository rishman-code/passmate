import type { LocalDate } from '@/types/journey';

const LOCAL_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export interface DateParts {
  year: number;
  month: number;
  day: number;
}

export function parseLocalDate(date: LocalDate): DateParts {
  const [year, month, day] = date.split('-').map(Number);
  return { year, month, day };
}

function partsToUTCDate({ year, month, day }: DateParts): Date {
  return new Date(Date.UTC(year, month - 1, day));
}

function utcDateToLocalDate(d: Date): LocalDate {
  const year = String(d.getUTCFullYear()).padStart(4, '0');
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Today's calendar date as seen in Europe/London, independent of the
 * device's own timezone. Never derive this from a UTC instant directly
 * (e.g. `new Date().toISOString()`) — that shifts the date by a day for
 * part of the year across the BST/GMT boundary.
 */
export function todayInLondon(): LocalDate {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/London',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

export function isValidLocalDate(value: string): value is LocalDate {
  if (!LOCAL_DATE_PATTERN.test(value)) return false;
  const parts = parseLocalDate(value as LocalDate);
  const d = partsToUTCDate(parts);
  return (
    d.getUTCFullYear() === parts.year &&
    d.getUTCMonth() === parts.month - 1 &&
    d.getUTCDate() === parts.day
  );
}

/** Lexicographic compare is safe for YYYY-MM-DD strings. */
export function compareLocalDates(a: LocalDate, b: LocalDate): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function addDays(date: LocalDate, days: number): LocalDate {
  const d = partsToUTCDate(parseLocalDate(date));
  d.setUTCDate(d.getUTCDate() + days);
  return utcDateToLocalDate(d);
}

/**
 * Adds whole years to a date. If the result would land on a day that
 * doesn't exist in the target year (29 Feb in a non-leap year), it rolls
 * forward to 1 Mar, matching native Date semantics.
 */
export function addYears(date: LocalDate, years: number): LocalDate {
  const { year, month, day } = parseLocalDate(date);
  return utcDateToLocalDate(partsToUTCDate({ year: year + years, month, day }));
}

/**
 * Adds whole months to a date, normalising an out-of-range day into the
 * following month (e.g. 31 Jan + 1 month -> 3 Mar in a non-leap year),
 * matching addYears' rollover behaviour.
 */
export function addMonths(date: LocalDate, months: number): LocalDate {
  const { year, month, day } = parseLocalDate(date);
  const totalMonths = month - 1 + months;
  const newYear = year + Math.floor(totalMonths / 12);
  const newMonth = (((totalMonths % 12) + 12) % 12) + 1;
  return utcDateToLocalDate(partsToUTCDate({ year: newYear, month: newMonth, day }));
}

/** Whole calendar months from `from` to `target`. Negative when `target` is in the past. */
export function monthsUntil(target: LocalDate, from: LocalDate = todayInLondon()): number {
  const a = parseLocalDate(from);
  const b = parseLocalDate(target);
  let months = (b.year - a.year) * 12 + (b.month - a.month);
  if (b.day < a.day) months -= 1;
  return months;
}

/** Whole days from `from` to `to`. Negative when `to` is in the past. */
export function daysBetween(from: LocalDate, to: LocalDate): number {
  const a = partsToUTCDate(parseLocalDate(from));
  const b = partsToUTCDate(parseLocalDate(to));
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

export function daysUntil(target: LocalDate, from: LocalDate = todayInLondon()): number {
  return daysBetween(from, target);
}

/** A DVSA theory certificate is valid for 2 years, inclusive of the anniversary date. */
export function certificateExpiryDate(passDate: LocalDate): LocalDate {
  return addYears(passDate, 2);
}

export function isCertificateValid(expiryDate: LocalDate, asOf: LocalDate = todayInLondon()): boolean {
  return compareLocalDates(asOf, expiryDate) <= 0;
}

/**
 * DVSA test centres run Monday-Saturday; only Sunday and bank holidays are
 * excluded from "working days" for the rebooking rule below.
 */
function isWorkingDay(date: LocalDate, bankHolidays: ReadonlySet<string>): boolean {
  const dayOfWeek = partsToUTCDate(parseLocalDate(date)).getUTCDay();
  return dayOfWeek !== 0 && !bankHolidays.has(date);
}

/**
 * Earliest date a candidate can sit a DVSA theory test again after failing on
 * `failDate`: at least 3 clear working days must fall strictly between the
 * fail date and the retest date, then the retest itself lands on the next
 * working day after those 3. Fail on a Monday -> earliest retest is Friday
 * (Tue/Wed/Thu are the 3 clear days). Fail on a Friday -> earliest retest is
 * the following Wednesday (Sat/Mon/Tue are the 3 clear days; Sunday doesn't
 * count as a working day so it's skipped, not counted).
 */
export function earliestRetakeDate(failDate: LocalDate, bankHolidays: readonly string[] = []): LocalDate {
  const holidaySet = new Set(bankHolidays);

  let cursor = failDate;
  let clearDaysFound = 0;
  while (clearDaysFound < 3) {
    cursor = addDays(cursor, 1);
    if (isWorkingDay(cursor, holidaySet)) {
      clearDaysFound += 1;
    }
  }

  do {
    cursor = addDays(cursor, 1);
  } while (!isWorkingDay(cursor, holidaySet));

  return cursor;
}

/** Displays a LocalDate as e.g. "21 May 2028", unaffected by the device's own timezone. */
export function formatLocalDateLong(date: LocalDate): string {
  return partsToUTCDate(parseLocalDate(date)).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}
