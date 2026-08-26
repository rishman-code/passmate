import type { LocalDate } from '@/types/journey';
import { addDays, addMonths } from '@/utils/journey-dates';

export interface CertificateNotificationSpec {
  date: LocalDate;
  title: string;
  body: string;
}

/**
 * The four reminders from the journey spec, anchored to the certificate's
 * expiry date. Pure and testable — scheduling (which needs the device and
 * permissions) lives in services/certificate-notifications.ts.
 */
export function buildCertificateExpiryNotifications(expiryDate: LocalDate): CertificateNotificationSpec[] {
  return [
    {
      date: addMonths(expiryDate, -6),
      title: 'You can rebook your practical early',
      body: "Passing your theory test again resets a fresh 2-year window — worth knowing if your practical hasn't happened yet.",
    },
    {
      date: addMonths(expiryDate, -3),
      title: 'Practical test waits are long right now',
      body: "Waits are commonly running 14–22 weeks. Worth checking your practical test booking if you haven't already.",
    },
    {
      date: addMonths(expiryDate, -1),
      title: 'Your theory certificate expires in a month',
      body: "If you haven't passed your practical test by then, you'll need to resit your theory test.",
    },
    {
      date: addDays(expiryDate, -14),
      title: 'Final reminder — 2 weeks left',
      body: 'Your theory certificate expires in 2 weeks. Tap to jump back into revision if you need to resit.',
    },
  ];
}
