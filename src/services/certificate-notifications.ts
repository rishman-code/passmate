import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import type { LocalDate } from '@/types/journey';
import { buildCertificateExpiryNotifications } from '@/utils/certificate-notifications';
import { compareLocalDates, parseLocalDate, todayInLondon } from '@/utils/journey-dates';

/**
 * Schedules the certificate-expiry reminders as local notifications, after
 * requesting permission — this should only ever be called at the moment the
 * user saves a pass date, never on first launch, per the journey spec.
 * Cancels any previously scheduled certificate reminders first, so this also
 * doubles as the reschedule path when the pass date is edited. No-ops on web
 * (local notification scheduling is a native-only capability here) and skips
 * any trigger date that's already in the past.
 */
export async function scheduleCertificateExpiryNotifications(expiryDate: LocalDate): Promise<void> {
  if (Platform.OS === 'web') return;

  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return;

  await Notifications.cancelAllScheduledNotificationsAsync();

  const today = todayInLondon();
  for (const spec of buildCertificateExpiryNotifications(expiryDate)) {
    if (compareLocalDates(spec.date, today) <= 0) continue;

    const { year, month, day } = parseLocalDate(spec.date);
    await Notifications.scheduleNotificationAsync({
      content: { title: spec.title, body: spec.body },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(year, month - 1, day, 9, 0, 0),
      },
    });
  }
}

export async function cancelCertificateExpiryNotifications(): Promise<void> {
  if (Platform.OS === 'web') return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}
