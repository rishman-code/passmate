import { useEffect, useState } from 'react';

import { getBankHolidayDates } from '@/services/bank-holidays';
import type { LocalDate } from '@/types/journey';

export function useBankHolidayDates() {
  const [dates, setDates] = useState<LocalDate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    getBankHolidayDates()
      .then((result) => {
        if (mounted) setDates(result);
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return { dates, isLoading };
}
