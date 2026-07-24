import Purchases, { type CustomerInfo } from 'react-native-purchases';

export const PRO_ENTITLEMENT_ID = 'PassMate Pro';
export const LIFETIME_PRODUCT_ID = 'lifetime';

const webKey = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ?? '';

// react-native-purchases-ui (paywalls/customer center) has no web support yet,
// so on web we only use the core SDK for read-only entitlement checks and
// fall back to the in-app dev/preview paywall for purchasing.
export const isRevenueCatConfigured = false;

let initialized = false;

export async function initializeRevenueCat(): Promise<void> {
  if (initialized || webKey.length === 0) {
    return;
  }

  try {
    Purchases.configure({ apiKey: webKey });
    initialized = true;
  } catch (error) {
    console.warn('RevenueCat web configure failed', error);
  }
}

export async function getCustomerInfo(): Promise<CustomerInfo | null> {
  return null;
}

export function hasProEntitlement(_customerInfo: CustomerInfo | null): boolean {
  return false;
}

export async function purchaseLifetime(): Promise<CustomerInfo> {
  throw new Error('Purchases are only available on the iOS/Android app.');
}

export async function restorePurchases(): Promise<CustomerInfo> {
  throw new Error('Purchases are only available on the iOS/Android app.');
}

export async function presentPaywall(): Promise<{ purchased: boolean; customerInfo: CustomerInfo | null }> {
  return { purchased: false, customerInfo: null };
}

export async function presentCustomerCenter(): Promise<void> {}
