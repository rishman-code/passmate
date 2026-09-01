import { describe, expect, it } from 'vitest';

import {
  buildReEngagementNotifications,
  REENGAGEMENT_REMINDER_COUNT,
  REENGAGEMENT_START_DAY_OFFSET,
} from '@/utils/re-engagement-notifications';
import { addDays, todayInLondon } from '@/utils/journey-dates';

describe('buildReEngagementNotifications', () => {
  it('schedules the full run, starting two days after the given date', () => {
    const notifications = buildReEngagementNotifications('2028-05-21');
    expect(notifications).toHaveLength(REENGAGEMENT_REMINDER_COUNT);
    expect(notifications[0].date).toBe('2028-05-23');
  });

  it('lands one reminder per day with no gaps or repeats', () => {
    const notifications = buildReEngagementNotifications('2028-05-21');
    const dates = notifications.map((n) => n.date);
    expect(new Set(dates).size).toBe(dates.length);
    for (let i = 1; i < dates.length; i++) {
      const prev = new Date(dates[i - 1]);
      const curr = new Date(dates[i]);
      expect((curr.getTime() - prev.getTime()) / 86_400_000).toBe(1);
    }
  });

  it('gives every reminder a unique id and non-empty title/body', () => {
    const notifications = buildReEngagementNotifications('2028-05-21');
    expect(new Set(notifications.map((n) => n.id)).size).toBe(notifications.length);
    for (const n of notifications) {
      expect(n.title.length).toBeGreaterThan(0);
      expect(n.body.length).toBeGreaterThan(0);
    }
  });

  it('defaults to starting from today when no date is given', () => {
    const notifications = buildReEngagementNotifications();
    expect(notifications[0].date).toBe(addDays(todayInLondon(), REENGAGEMENT_START_DAY_OFFSET));
  });
});
