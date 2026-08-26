import { useEffect } from 'react';

import { useJourneyStore } from '@/stores/journey-store';
import { isCertificateValid } from '@/utils/journey-dates';

/**
 * If a certified user's certificate expiry passes without a recorded
 * practical pass, the journey spec calls for moving them into the `retake`
 * state so they're re-engaged with a fresh plan. This app has no way to
 * track a practical pass (out of scope, per the spec), so an expired
 * certificate is the only signal available.
 */
export function useCertificateExpiryWatch() {
  const journey = useJourneyStore((s) => s.journey);
  const updateJourney = useJourneyStore((s) => s.updateJourney);

  useEffect(() => {
    if (journey.state !== 'certified' || !journey.certificate) return;
    if (isCertificateValid(journey.certificate.expiryDate)) return;

    updateJourney({ state: 'retake' });
  }, [journey.state, journey.certificate, updateJourney]);
}
