import { create } from 'zustand';

import {
  getCustomerInfo,
  hasPremiumEntitlement,
  initializeRevenueCat,
  purchasePremium,
  restorePurchases,
} from '@/lib/revenuecat';

interface SubscriptionState {
  isPremium: boolean;
  isLoading: boolean;
  error: string | null;
  initialize: () => Promise<void>;
  purchase: () => Promise<boolean>;
  restore: () => Promise<boolean>;
  setPremium: (value: boolean) => void;
}

export const useSubscriptionStore = create<SubscriptionState>((set) => ({
  isPremium: false,
  isLoading: true,
  error: null,

  initialize: async () => {
    set({ isLoading: true, error: null });

    try {
      await initializeRevenueCat();
      const customerInfo = await getCustomerInfo();
      set({ isPremium: hasPremiumEntitlement(customerInfo), isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load subscription status',
      });
    }
  },

  purchase: async () => {
    set({ isLoading: true, error: null });

    try {
      const customerInfo = await purchasePremium();
      const isPremium = hasPremiumEntitlement(customerInfo);
      set({ isPremium, isLoading: false });
      return isPremium;
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Purchase failed',
      });
      return false;
    }
  },

  restore: async () => {
    set({ isLoading: true, error: null });

    try {
      const customerInfo = await restorePurchases();
      const isPremium = hasPremiumEntitlement(customerInfo);
      set({ isPremium, isLoading: false });
      return isPremium;
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Restore failed',
      });
      return false;
    }
  },

  setPremium: (value) => set({ isPremium: value }),
}));
