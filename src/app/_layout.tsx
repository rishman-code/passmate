import {
  JetBrainsMono_600SemiBold,
  useFonts as useMonoFonts,
} from '@expo-google-fonts/jetbrains-mono';
import {
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
  Outfit_800ExtraBold,
  useFonts as useOutfitFonts,
} from '@expo-google-fonts/outfit';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  useFonts as usePlusJakartaFonts,
} from '@expo-google-fonts/plus-jakarta-sans';
import { DarkTheme, DefaultTheme, Redirect, Stack, ThemeProvider } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, useColorScheme, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { useCertificateExpiryWatch } from '@/hooks/use-certificate-expiry-watch';
import { isGuestMode } from '@/lib/guest-mode';
import { hasSeenOnboarding } from '@/lib/onboarding';
import { useAuthStore } from '@/stores/auth-store';
import { useSubscriptionStore } from '@/stores/subscription-store';
import { useWelcomeSessionStore } from '@/stores/welcome-session-store';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const initialize = useSubscriptionStore((s) => s.initialize);
  const initializeAuth = useAuthStore((s) => s.initialize);
  const authLoading = useAuthStore((s) => s.isLoading);
  const session = useAuthStore((s) => s.session);
  const hasSeenWelcome = useWelcomeSessionStore((s) => s.hasSeenWelcome);
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [guestChecked, setGuestChecked] = useState(false);
  const [isGuest, setIsGuest] = useState(false);

  useCertificateExpiryWatch();

  const [outfitLoaded] = useOutfitFonts({
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
    Outfit_800ExtraBold,
  });
  const [jakartaLoaded] = usePlusJakartaFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });
  const [monoLoaded] = useMonoFonts({ JetBrainsMono_600SemiBold });

  useEffect(() => {
    initialize();
    initializeAuth();
    hasSeenOnboarding().then((seen) => {
      setNeedsOnboarding(!seen);
      setOnboardingChecked(true);
    });
    isGuestMode().then((guest) => {
      setIsGuest(guest);
      setGuestChecked(true);
    });
  }, [initialize, initializeAuth]);

  const theme = colorScheme === 'dark' ? DarkTheme : DefaultTheme;
  const colors = Colors[colorScheme === 'unspecified' ? 'light' : colorScheme ?? 'light'];

  if (!outfitLoaded || !jakartaLoaded || !monoLoaded || authLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ThemeProvider
      value={{
        ...theme,
        colors: {
          ...theme.colors,
          primary: colors.primary,
          background: colors.background,
          card: colors.card,
          text: colors.text,
          border: colors.border,
        },
      }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="welcome" options={{ animation: 'none', gestureEnabled: false }} />
        <Stack.Screen name="auth" />
        <Stack.Screen name="onboarding" options={{ animation: 'none', gestureEnabled: false }} />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="practice/session"
          options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }}
        />
        <Stack.Screen name="mock-test/index" options={{ headerShown: true, title: 'Mock Test' }} />
        <Stack.Screen
          name="mock-test/session"
          options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }}
        />
        <Stack.Screen name="mock-test/results" options={{ headerShown: true, title: 'Results' }} />
        <Stack.Screen
          name="paywall"
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="journey/setup"
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="journey/result-letter"
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="journey/certificate"
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
        <Stack.Screen name="mistake-ledger" options={{ headerShown: true, title: 'Mistake Ledger' }} />
      </Stack>
      {!hasSeenWelcome && <Redirect href="/welcome" />}
      {hasSeenWelcome && onboardingChecked && needsOnboarding && <Redirect href="/onboarding" />}
      {hasSeenWelcome && onboardingChecked && !needsOnboarding && !session && guestChecked && !isGuest && (
        <Redirect href="/auth/sign-in" />
      )}
    </ThemeProvider>
  );
}
