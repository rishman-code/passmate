import { describe, expect, it } from 'vitest';

import { buildCertificateExpiryNotifications } from '@/utils/certificate-notifications';

describe('buildCertificateExpiryNotifications', () => {
  it('produces the four reminders from the spec, anchored to the expiry date', () => {
    const notifications = buildCertificateExpiryNotifications('2028-05-21');
    expect(notifications).toHaveLength(4);
    expect(notifications.map((n) => n.date)).toEqual([
      '2027-11-21', // 6 months before
      '2028-02-21', // 3 months before
      '2028-04-21', // 1 month before
      '2028-05-07', // 2 weeks before
    ]);
  });

  it('every reminder has non-empty title and body text', () => {
    for (const notification of buildCertificateExpiryNotifications('2028-05-21')) {
      expect(notification.title.length).toBeGreaterThan(0);
      expect(notification.body.length).toBeGreaterThan(0);
    }
  });

  it('none of the reminder copy hints that extensions are possible', () => {
    for (const notification of buildCertificateExpiryNotifications('2028-05-21')) {
      expect(notification.body.toLowerCase()).not.toContain('extension');
    }
  });
});
