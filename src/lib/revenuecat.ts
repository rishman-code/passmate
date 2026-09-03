import { Platform } from 'react-native';
import Purchases, { type CustomerInfo, type PurchasesPackage } from 'react-native-purchases';
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';

export const PRO_ENTITLEMENT_ID = 'greenlight_theory_test';
export const MONTHLY_PRODUCT_ID = 'greenlight_monthly';
export const YEARLY_PRODUCT_ID = 'greenlight_yearly';

const iosKey = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ?? '';
const androidKey = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY ?? '';
const apiKey = Platform.OS === 'ios' ? iosKey : androidKey;

export const isRevenueCatConfigured = apiKey.length > 0;

let initialized = false;

export async function initializeRevenueCat(): Promise<void> {
  if (initialized || !isRevenueCatConfigured) {
    return;
  }

  try {
    Purchases.configure({ apiKey });
    initialized = true;
  } catch (error) {
    console.warn('RevenueCat configure failed', error);
  }
}

export async function getCustomerInfo(): Promise<CustomerInfo | null> {
  if (!isRevenueCatConfigured) {
    return null;
  }

  await initializeRevenueCat();

  try {
    return await Purchases.getCustomerInfo();
  } catch (error) {
    console.warn('getCustomerInfo failed', error);
    return null;
  }
}

export function hasProEntitlement(customerInfo: CustomerInfo | null): boolean {
  if (!customerInfo) {
    return false;
  }

  return customerInfo.entitlements.active[PRO_ENTITLEMENT_ID] !== undefined;
}

export interface SubscriptionPackages {
  monthly: PurchasesPackage | null;
  yearly: PurchasesPackage | null;
}

export async function getSubscriptionPackages(): Promise<SubscriptionPackages> {
  if (!isRevenueCatConfigured) {
    return { monthly: null, yearly: null };
  }

  await initializeRevenueCat();

  try {
    const offerings = await Purchases.getOfferings();
    const current = offerings.current;

    if (!current) {
      return { monthly: null, yearly: null };
    }

    const monthly =
      current.availablePackages.find((pkg) => pkg.product.identifier === MONTHLY_PRODUCT_ID) ??
      current.monthly ??
      null;
    // RevenueCat's predefined package-type field for a yearly plan is
    // "annual", not "yearly" -- current.yearly doesn't exist.
    const yearly =
      current.availablePackages.find((pkg) => pkg.product.identifier === YEARLY_PRODUCT_ID) ??
      current.annual ??
      null;

    return { monthly, yearly };
  } catch (error) {
    console.warn('getOfferings failed', error);
    return { monthly: null, yearly: null };
  }
}

export async function purchasePackage(pkg: PurchasesPackage): Promise<CustomerInfo> {
  await initializeRevenueCat();
  const { customerInfo } = await Purchases.purchasePackage(pkg);
  return customerInfo;
}

export async function restorePurchases(): Promise<CustomerInfo> {
  if (!isRevenueCatConfigured) {
    throw new Error('Purchases are not available in this build.');
  }
  await initializeRevenueCat();
  return Purchases.restorePurchases();
}

export async function presentPaywall(): Promise<{ purchased: boolean; customerInfo: CustomerInfo | null }> {
  if (!isRevenueCatConfigured) {
    return { purchased: false, customerInfo: null };
  }

  await initializeRevenueCat();

  try {
    const result = await RevenueCatUI.presentPaywallIfNeeded({
      requiredEntitlementIdentifier: PRO_ENTITLEMENT_ID,
    });

    if (result === PAYWALL_RESULT.PURCHASED || result === PAYWALL_RESULT.RESTORED) {
      const customerInfo = await getCustomerInfo();
      return { purchased: true, customerInfo };
    }

    return { purchased: false, customerInfo: null };
  } catch (error) {
    console.warn('presentPaywall failed', error);
    throw error;
  }
}

export async function presentCustomerCenter(): Promise<void> {
  if (!isRevenueCatConfigured) {
    return;
  }

  await initializeRevenueCat();

  try {
    await RevenueCatUI.presentCustomerCenter();
  } catch (error) {
    console.warn('presentCustomerCenter failed', error);
  }
}
