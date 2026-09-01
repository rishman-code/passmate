import { create } from 'zustand';

import {
  getCustomerInfo,
  getSubscriptionPackages,
  hasProEntitlement,
  initializeRevenueCat,
  isRevenueCatConfigured,
  presentCustomerCenter,
  presentPaywall,
  purchasePackage,
  restorePurchases,
} from '@/lib/revenuecat';

export type SubscriptionPlan = 'monthly' | 'yearly';

interface SubscriptionState {
  isPremium: boolean;
  isLoading: boolean;
  error: string | null;
  initialize: () => Promise<void>;
  purchase: (plan: SubscriptionPlan) => Promise<boolean>;
  restore: () => Promise<boolean>;
  openPaywall: () => Promise<'presented' | 'fallback'>;
  openCustomerCenter: () => Promise<void>;
  setPremium: (value: boolean) => void;
}

export const useSubscriptionStore = create<SubscriptionState>((set) => ({
  isPremium: false,
  isLoading: true,
  error: null,

  initialize: async () => {
    set({ isLoading: true, error: null });

    if (!isRevenueCatConfigured) {
      set({ isPremium: true, isLoading: false });
      return;
    }

    try {
      await initializeRevenueCat();
      const customerInfo = await getCustomerInfo();
      set({ isPremium: hasProEntitlement(customerInfo), isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load subscription status',
      });
    }
  },

  purchase: async (plan) => {
    set({ isLoading: true, error: null });

    try {
      const { monthly, yearly } = await getSubscriptionPackages();
      const pkg = plan === 'monthly' ? monthly : yearly;
      if (!pkg) {
        throw new Error(
          `${plan === 'monthly' ? 'Monthly' : 'Yearly'} plan is not available. Check your RevenueCat offering configuration.`,
        );
      }
      const customerInfo = await purchasePackage(pkg);
      const isPremium = hasProEntitlement(customerInfo);
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
      const isPremium = hasProEntitlement(customerInfo);
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

  // Presents RevenueCat's native paywall when configured (iOS/Android).
  // Returns 'fallback' when RevenueCat isn't available (e.g. web preview / dev)
  // so the caller can show the in-app fallback paywall screen instead.
  openPaywall: async () => {
    if (!isRevenueCatConfigured) {
      return 'fallback';
    }

    try {
      const { purchased, customerInfo } = await presentPaywall();
      if (purchased) {
        set({ isPremium: hasProEntitlement(customerInfo) });
      }
      return 'presented';
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Could not open paywall' });
      return 'fallback';
    }
  },

  openCustomerCenter: async () => {
    if (!isRevenueCatConfigured) {
      return;
    }
    await presentCustomerCenter();
  },

  setPremium: (value) => set({ isPremium: value }),
}));
