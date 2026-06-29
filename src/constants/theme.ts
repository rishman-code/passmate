import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#1A1A2E',
    background: '#FFFFFF',
    backgroundElement: '#F4F6F9',
    backgroundSelected: '#E8ECF2',
    textSecondary: '#6B7280',
    primary: '#2563EB',
    primaryDark: '#1D4ED8',
    success: '#16A34A',
    successLight: '#DCFCE7',
    error: '#DC2626',
    errorLight: '#FEE2E2',
    warning: '#D97706',
    warningLight: '#FEF3C7',
    border: '#E5E7EB',
    card: '#FFFFFF',
    tabBar: '#FFFFFF',
  },
  dark: {
    text: '#F9FAFB',
    background: '#0F172A',
    backgroundElement: '#1E293B',
    backgroundSelected: '#334155',
    textSecondary: '#94A3B8',
    primary: '#3B82F6',
    primaryDark: '#2563EB',
    success: '#22C55E',
    successLight: '#14532D',
    error: '#EF4444',
    errorLight: '#7F1D1D',
    warning: '#F59E0B',
    warningLight: '#78350F',
    border: '#334155',
    card: '#1E293B',
    tabBar: '#0F172A',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
