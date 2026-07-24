import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#0A0A0B',
    background: '#F3F4F6',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#FFF1EA',
    textSecondary: '#54545E',
    primary: '#FF4500',
    primaryDark: '#D93C00',
    success: '#00A85E',
    successLight: '#E1F8ED',
    error: '#E31B54',
    errorLight: '#FFE9EF',
    warning: '#D97706',
    warningLight: '#FEF3C7',
    premium: '#5B5BD6',
    premiumLight: '#EEEEFC',
    border: '#E3E4E8',
    borderHard: '#0A0A0B',
    card: '#FFFFFF',
    tabBar: '#FFFFFF',
  },
  dark: {
    text: '#F4F4F6',
    background: '#0B0B0D',
    backgroundElement: '#191A1D',
    backgroundSelected: '#3A2211',
    textSecondary: '#A2A2AC',
    primary: '#FF6A33',
    primaryDark: '#FF4500',
    success: '#2FE393',
    successLight: '#0F3D2A',
    error: '#FF5C85',
    errorLight: '#3D0F1E',
    warning: '#FBBF24',
    warningLight: '#3D2E0A',
    premium: '#8B8CFF',
    premiumLight: '#211F3D',
    border: '#2A2B30',
    borderHard: '#F4F4F6',
    card: '#161618',
    tabBar: '#0B0B0D',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = {
  displayBlack: 'Outfit_800ExtraBold',
  displayBold: 'Outfit_700Bold',
  displaySemiBold: 'Outfit_600SemiBold',
  displayMedium: 'Outfit_500Medium',
  bodyBold: 'PlusJakartaSans_700Bold',
  bodySemiBold: 'PlusJakartaSans_600SemiBold',
  bodyMedium: 'PlusJakartaSans_500Medium',
  bodyRegular: 'PlusJakartaSans_400Regular',
  mono: 'JetBrainsMono_600SemiBold',
} as const;

export function tactileShadow(color: string, offset: number = 4) {
  return Platform.select({
    web: {
      boxShadow: `${offset}px ${offset}px 0px 0px ${color}`,
    },
    default: {
      shadowColor: color,
      shadowOffset: { width: offset, height: offset },
      shadowOpacity: 1,
      shadowRadius: 0,
      elevation: offset,
    },
  });
}

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
