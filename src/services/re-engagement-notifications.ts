import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { parseLocalDate } from '@/utils/journey-dates';
import {
  buildReEngagementNotifications,
  REENGAGEMENT_REMINDER_COUNT,
  REENGAGEMENT_REMINDER_HOUR,
} from '@/utils/re-engagement-notifications';

/**
 * Schedules the "come back" reminder chain: nothing for the next two days,
 * then a daily nudge for two weeks after that. Call this every time the app
 * is opened or foregrounded (see hooks/use-re-engagement-reminders.ts) --
 * it always cancels and replaces the whole chain first, so a user who keeps
 * opening the app never actually reaches day two, and someone who goes
 * quiet just gets the schedule that was in place the last time they were
 * seen. Uses fixed identifiers (rather than cancelAllScheduledNotificationsAsync)
 * so this never clobbers the unrelated certificate-expiry reminders. No-ops
 * on web (local notification scheduling is a native-only capability here).
 */
export async function scheduleReEngagementReminders(): Promise<void> {
  if (Platform.OS === 'web') return;

  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return;

  await cancelReEngagementReminders();

  for (const spec of buildReEngagementNotifications()) {
    const { year, month, day } = parseLocalDate(spec.date);
    await Notifications.scheduleNotificationAsync({
      identifier: spec.id,
      content: { title: spec.title, body: spec.body },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(year, month - 1, day, REENGAGEMENT_REMINDER_HOUR, 0, 0),
      },
    });
  }
}

export async function cancelReEngagementReminders(): Promise<void> {
  if (Platform.OS === 'web') return;
  await Promise.all(
    Array.from({ length: REENGAGEMENT_REMINDER_COUNT }, (_, i) =>
      Notifications.cancelScheduledNotificationAsync(`greenlight-reengagement-${i}`).catch(() => {}),
    ),
  );
}
