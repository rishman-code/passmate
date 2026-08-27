import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const GUEST_MODE_KEY = 'is_guest_mode';

export async function isGuestMode(): Promise<boolean> {
  if (Platform.OS === 'web') {
    return localStorage.getItem(GUEST_MODE_KEY) === 'true';
  }
  const value = await SecureStore.getItemAsync(GUEST_MODE_KEY);
  return value === 'true';
}

export async function setGuestMode(value: boolean): Promise<void> {
  if (Platform.OS === 'web') {
    if (value) {
      localStorage.setItem(GUEST_MODE_KEY, 'true');
    } else {
      localStorage.removeItem(GUEST_MODE_KEY);
    }
    return;
  }
  if (value) {
    await SecureStore.setItemAsync(GUEST_MODE_KEY, 'true');
  } else {
    await SecureStore.deleteItemAsync(GUEST_MODE_KEY);
  }
}
