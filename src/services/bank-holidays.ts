import AsyncStorage from '@react-native-async-storage/async-storage';

import FALLBACK_BANK_HOLIDAYS from '@/data/bank-holidays-fallback.json';
import type { LocalDate } from '@/types/journey';

const ENDPOINT = 'https://www.gov.uk/bank-holidays.json';
const CACHE_KEY = 'passmate-bank-holidays-cache';
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export type BankHolidayDivision = 'england-and-wales' | 'scotland' | 'northern-ireland';

interface BankHolidayEvent {
  title: string;
  date: LocalDate;
  notes: string;
  bunting: boolean;
}

type BankHolidaysResponse = Record<string, { division: string; events: BankHolidayEvent[] }>;

interface CacheEntry {
  fetchedAt: number;
  data: BankHolidaysResponse;
}

function extractDates(data: BankHolidaysResponse, division: BankHolidayDivision): LocalDate[] {
  return (data[division]?.events ?? []).map((event) => event.date);
}

/**
 * UK bank holidays for the given division, used to compute the DVSA retake
 * date. Tries a short-lived local cache first, then the live gov.uk feed,
 * and falls back to a bundled snapshot so the calculation always works
 * offline. The bundled data was correct as of the day it was fetched and
 * covers several years ahead, but will drift over time — refresh it
 * periodically.
 */
export async function getBankHolidayDates(
  division: BankHolidayDivision = 'england-and-wales',
): Promise<LocalDate[]> {
  try {
    const cachedRaw = await AsyncStorage.getItem(CACHE_KEY);
    if (cachedRaw) {
      const cached: CacheEntry = JSON.parse(cachedRaw);
      if (Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
        return extractDates(cached.data, division);
      }
    }
  } catch {
    // Corrupt or unreadable cache — fall through to the network.
  }

  try {
    const response = await fetch(ENDPOINT);
    if (!response.ok) throw new Error(`bank holidays request failed: ${response.status}`);
    const data: BankHolidaysResponse = await response.json();
    AsyncStorage.setItem(CACHE_KEY, JSON.stringify({ fetchedAt: Date.now(), data } satisfies CacheEntry)).catch(
      () => {},
    );
    return extractDates(data, division);
  } catch {
    return extractDates(FALLBACK_BANK_HOLIDAYS as BankHolidaysResponse, division);
  }
}
