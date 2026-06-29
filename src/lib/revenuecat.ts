import { Platform } from 'react-native';
import Purchases, { type CustomerInfo, type PurchasesPackage } from 'react-native-purchases';

export const PREMIUM_ENTITLEMENT = 'premium';
export const PRODUCT_ID = 'passmate_premium';

const iosKey = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ?? process.env.REVENUECAT_IOS_KEY ?? '';

export const isRevenueCatConfigured = iosKey.length > 0 && !iosKey.includes('placeholder');

let initialized = false;

export async function initializeRevenueCat(): Promise<void> {
  if (initialized || !isRevenueCatConfigured || Platform.OS !== 'ios') {
    return;
  }

  Purchases.configure({ apiKey: iosKey });
  initialized = true;
}

export async function getCustomerInfo(): Promise<CustomerInfo | null> {
  if (!isRevenueCatConfigured) {
    return null;
  }

  await initializeRevenueCat();
  return Purchases.getCustomerInfo();
}

export function hasPremiumEntitlement(customerInfo: CustomerInfo | null): boolean {
  if (!customerInfo) {
    return false;
  }

  return customerInfo.entitlements.active[PREMIUM_ENTITLEMENT] !== undefined;
}

export async function getOfferings(): Promise<PurchasesPackage | null> {
  if (!isRevenueCatConfigured) {
    return null;
  }

  await initializeRevenueCat();
  const offerings = await Purchases.getOfferings();

  return offerings.current?.availablePackages[0] ?? null;
}

export async function purchasePremium(): Promise<CustomerInfo> {
  await initializeRevenueCat();
  const pkg = await getOfferings();

  if (!pkg) {
    throw new Error('No purchase package available');
  }

  const { customerInfo } = await Purchases.purchasePackage(pkg);
  return customerInfo;
}

export async function restorePurchases(): Promise<CustomerInfo> {
  await initializeRevenueCat();
  return Purchases.restorePurchases();
}
