import { create } from 'zustand';

import { hasSeenOnboarding, markOnboardingComplete, resetOnboardingSeen } from '@/lib/onboarding';

// Mirrors the persisted onboarding flag (SecureStore/localStorage) as
// reactive state, so the root layout's redirect logic sees a completion or
// reset the instant it happens -- not just on the next cold start. Without
// this, markOnboardingComplete()/resetOnboardingSeen() only ever update
// storage; a screen that calls one and then navigates away can get bounced
// right back by a redirect still reading the stale value.
interface OnboardingState {
  checked: boolean;
  needsOnboarding: boolean;
  initialize: () => Promise<void>;
  markComplete: () => Promise<void>;
  reset: () => Promise<void>;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  checked: false,
  needsOnboarding: false,

  initialize: async () => {
    const seen = await hasSeenOnboarding();
    set({ needsOnboarding: !seen, checked: true });
  },

  markComplete: async () => {
    await markOnboardingComplete();
    set({ needsOnboarding: false });
  },

  reset: async () => {
    await resetOnboardingSeen();
    set({ needsOnboarding: true });
  },
}));
