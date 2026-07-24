import { Platform } from 'react-native';
import Purchases, { type CustomerInfo, type PurchasesPackage } from 'react-native-purchases';
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';

export const PRO_ENTITLEMENT_ID = 'PassMate Pro';
export const LIFETIME_PRODUCT_ID = 'lifetime';

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

export async function getLifetimePackage(): Promise<PurchasesPackage | null> {
  if (!isRevenueCatConfigured) {
    return null;
  }

  await initializeRevenueCat();

  try {
    const offerings = await Purchases.getOfferings();
    const current = offerings.current;

    if (!current) {
      return null;
    }

    return (
      current.availablePackages.find((pkg) => pkg.product.identifier === LIFETIME_PRODUCT_ID) ??
      current.lifetime ??
      current.availablePackages[0] ??
      null
    );
  } catch (error) {
    console.warn('getOfferings failed', error);
    return null;
  }
}

export async function purchaseLifetime(): Promise<CustomerInfo> {
  await initializeRevenueCat();
  const pkg = await getLifetimePackage();

  if (!pkg) {
    throw new Error('Lifetime package is not available. Check your RevenueCat offering configuration.');
  }

  const { customerInfo } = await Purchases.purchasePackage(pkg);
  return customerInfo;
}

export async function restorePurchases(): Promise<CustomerInfo> {
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
