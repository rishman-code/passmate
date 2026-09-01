import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const isSupabaseConfigured =
  supabaseUrl.length > 0 &&
  supabaseAnonKey.length > 0 &&
  !supabaseUrl.includes('placeholder') &&
  !supabaseAnonKey.includes('placeholder');

// AsyncStorage uses window.localStorage on web, which doesn't exist during SSR.
// Use a localStorage wrapper on web with a typeof guard; AsyncStorage on native.
const authStorage =
  Platform.OS === 'web'
    ? {
        getItem: (key: string) =>
          typeof window !== 'undefined' ? window.localStorage.getItem(key) : null,
        setItem: (key: string, value: string) => {
          if (typeof window !== 'undefined') window.localStorage.setItem(key, value);
        },
        removeItem: (key: string) => {
          if (typeof window !== 'undefined') window.localStorage.removeItem(key);
        },
      }
    : AsyncStorage;

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder',
  {
    auth: {
      storage: authStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      // PKCE so the password-reset deep link carries a short-lived `code`
      // query param we exchange manually (see auth/reset-password.tsx) —
      // detectSessionInUrl is off, so nothing does this automatically.
      flowType: 'pkce',
    },
  },
);
