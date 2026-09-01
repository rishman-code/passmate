import type { LocalDate } from '@/types/journey';
import { addDays, todayInLondon } from '@/utils/journey-dates';

export interface ReEngagementNotificationSpec {
  id: string;
  date: LocalDate;
  title: string;
  body: string;
}

/** Rotated so a user who ignores several in a row isn't shown the exact same line twice running. */
const MESSAGES: readonly { title: string; body: string }[] = [
  {
    title: "Don't Skip Today! 🚦",
    body: "Your theory test won't revise itself — a few minutes of practice keeps you on track.",
  },
  {
    title: 'Still aiming to pass first time? 🚗',
    body: 'A quick session today keeps your weak spots from creeping back in.',
  },
  {
    title: 'GreenLight is waiting for you 🟢',
    body: 'Jump back in — a little practice now beats cramming before test day.',
  },
  {
    title: "Don't lose your green light 🚦",
    body: 'Your streak and weak-spot progress are still here. Come finish what you started.',
  },
];

export const REENGAGEMENT_START_DAY_OFFSET = 2;
export const REENGAGEMENT_REMINDER_COUNT = 14;
export const REENGAGEMENT_REMINDER_HOUR = 18;

/**
 * A run of daily "come back" reminders, starting two days after `from` (the
 * last time the app was opened) and continuing daily for two weeks. Pure and
 * testable -- scheduling (which needs the device and permissions) lives in
 * services/re-engagement-notifications.ts, which rebuilds and reschedules
 * this whole run from scratch every time the app is opened or foregrounded.
 * That means a user who keeps opening the app never actually reaches day
 * two, and someone who goes quiet just gets whichever schedule was in place
 * the last time they were seen -- this never needs to run all the way out
 * in practice.
 */
export function buildReEngagementNotifications(from: LocalDate = todayInLondon()): ReEngagementNotificationSpec[] {
  return Array.from({ length: REENGAGEMENT_REMINDER_COUNT }, (_, i) => {
    const message = MESSAGES[i % MESSAGES.length];
    return {
      id: `greenlight-reengagement-${i}`,
      date: addDays(from, REENGAGEMENT_START_DAY_OFFSET + i),
      ...message,
    };
  });
}
