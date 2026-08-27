import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type RateAppDecision = 'never' | 'rated';
type RateAppChoice = 'never' | 'later' | 'rated';

const LATER_COOLDOWN_DAYS = 30;

interface RateAppState {
  decision: RateAppDecision | null;
  remindAfter: string | null;
  recordChoice: (choice: RateAppChoice) => void;
  canPrompt: () => boolean;
}

/** "Never" and "Rated" suppress the prompt permanently; "Later" snoozes it. */
export const useRateAppStore = create<RateAppState>()(
  persist(
    (set, get) => ({
      decision: null,
      remindAfter: null,

      recordChoice: (choice) => {
        if (choice === 'later') {
          const remindAfter = new Date(Date.now() + LATER_COOLDOWN_DAYS * 86_400_000).toISOString();
          set({ remindAfter });
        } else {
          set({ decision: choice, remindAfter: null });
        }
      },

      canPrompt: () => {
        const { decision, remindAfter } = get();
        if (decision) return false;
        if (remindAfter && new Date(remindAfter) > new Date()) return false;
        return true;
      },
    }),
    {
      name: 'passmate-rate-app',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
