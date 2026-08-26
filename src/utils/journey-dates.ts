import type { LocalDate } from '@/types/journey';

const LOCAL_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

interface DateParts {
  year: number;
  month: number;
  day: number;
}

function parseLocalDate(date: LocalDate): DateParts {
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
