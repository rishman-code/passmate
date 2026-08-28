import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface MistakeLedgerState {
  flaggedIds: Record<string, true>;
  toggleFlag: (questionId: string) => void;
  isFlagged: (questionId: string) => boolean;
  reset: () => void;
}

/**
 * Flags are local-only (no Supabase table) and never auto-clear — only an
 * explicit sign-out resets them, same as progress-store and journey-store.
 */
export const useMistakeLedgerStore = create<MistakeLedgerState>()(
  persist(
    (set, get) => ({
      flaggedIds: {},

      toggleFlag: (questionId) =>
        set((state) => {
          const next = { ...state.flaggedIds };
          if (next[questionId]) {
            delete next[questionId];
          } else {
            next[questionId] = true;
          }
          return { flaggedIds: next };
        }),

      isFlagged: (questionId) => Boolean(get().flaggedIds[questionId]),

      reset: () => set({ flaggedIds: {} }),
    }),
    {
      name: 'greenlight-mistake-ledger',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
