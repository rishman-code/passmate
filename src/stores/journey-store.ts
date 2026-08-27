import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { DVSACategory } from '@/constants/categories';
import { supabase } from '@/lib/supabase';
import type { Certificate, JourneyState, LocalDate, TestResult, UserJourney } from '@/types/journey';

function defaultJourney(): UserJourney {
  return {
    state: 'preparing',
    testDate: null,
    lastResult: null,
    certificate: null,
    selfReportedWeakCategories: [],
    updatedAt: new Date().toISOString(),
  };
}

interface JourneyRow {
  state: JourneyState;
  test_date: LocalDate | null;
  last_result: TestResult | null;
  certificate: Certificate | null;
  self_reported_weak_topics: DVSACategory[] | null;
  updated_at: string;
}

interface JourneyStoreState {
  userId: string | null;
  journey: UserJourney;
  hasSeenPrompt: boolean;
  setUserId: (userId: string | null) => void;
  loadFromSupabase: (userId: string) => Promise<void>;
  updateJourney: (patch: Partial<Omit<UserJourney, 'updatedAt'>>) => void;
  recordTestResult: (result: TestResult) => void;
  markPromptSeen: () => void;
  reset: () => void;
}

export const useJourneyStore = create<JourneyStoreState>()(
  persist(
    (set, get) => ({
      userId: null,
      journey: defaultJourney(),
      hasSeenPrompt: false,

      setUserId: (userId) => set({ userId }),

      loadFromSupabase: async (userId) => {
        set({ userId });

        const { data } = await supabase
          .from('user_journey')
          .select('state, test_date, last_result, certificate, self_reported_weak_topics, updated_at')
          .eq('user_id', userId)
          .maybeSingle<JourneyRow>();

        if (data) {
          set({
            journey: {
              state: data.state,
              testDate: data.test_date,
              lastResult: data.last_result,
              certificate: data.certificate,
              selfReportedWeakCategories: data.self_reported_weak_topics ?? [],
              updatedAt: data.updated_at,
            },
          });
        }
      },

      updateJourney: (patch) => {
        set((store) => {
          const journey: UserJourney = {
            ...store.journey,
            ...patch,
            updatedAt: new Date().toISOString(),
          };

          const { userId } = store;
          if (userId) {
            supabase
              .from('user_journey')
              .upsert({
                user_id: userId,
                state: journey.state,
                test_date: journey.testDate,
                last_result: journey.lastResult,
                certificate: journey.certificate,
                self_reported_weak_topics: journey.selfReportedWeakCategories,
                updated_at: journey.updatedAt,
              })
              .then();
          }

          return { journey };
        });
      },

      recordTestResult: (result) => {
        get().updateJourney({ lastResult: result });
      },

      markPromptSeen: () => set({ hasSeenPrompt: true }),

      reset: () => set({ userId: null, journey: defaultJourney(), hasSeenPrompt: false }),
    }),
    {
      name: 'passmate-journey',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        journey: state.journey,
        hasSeenPrompt: state.hasSeenPrompt,
      }),
    },
  ),
);
