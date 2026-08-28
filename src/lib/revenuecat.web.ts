import type { CustomerInfo } from 'react-native-purchases';

export const PRO_ENTITLEMENT_ID = 'GreenLight Pro';
export const LIFETIME_PRODUCT_ID = 'lifetime';

// react-native-purchases-ui (paywalls/customer center) has no web support yet,
// so on web we skip RevenueCat entirely and fall back to the in-app dev/preview paywall.
export const isRevenueCatConfigured = false;

export async function initializeRevenueCat(): Promise<void> {}

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
