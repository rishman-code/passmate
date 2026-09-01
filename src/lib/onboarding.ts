import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const ONBOARDING_KEY = 'has_seen_onboarding';

export async function hasSeenOnboarding(): Promise<boolean> {
  if (Platform.OS === 'web') {
    return localStorage.getItem(ONBOARDING_KEY) === 'true';
  }
  const value = await SecureStore.getItemAsync(ONBOARDING_KEY);
  return value === 'true';
}

export async function markOnboardingComplete(): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    return;
  }
  await SecureStore.setItemAsync(ONBOARDING_KEY, 'true');
}

export async function resetOnboardingSeen(): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.removeItem(ONBOARDING_KEY);
    return;
  }
  await SecureStore.deleteItemAsync(ONBOARDING_KEY);
}
