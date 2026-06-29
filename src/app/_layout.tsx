import { DarkTheme, DefaultTheme, Redirect, Stack, ThemeProvider } from 'expo-router';
import { useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';
import { hasSeenOnboarding } from '@/lib/onboarding';
import { useSubscriptionStore } from '@/stores/subscription-store';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const initialize = useSubscriptionStore((s) => s.initialize);
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    initialize();
    hasSeenOnboarding().then((seen) => {
      setNeedsOnboarding(!seen);
      setOnboardingChecked(true);
    });
  }, [initialize]);

  const theme = colorScheme === 'dark' ? DarkTheme : DefaultTheme;
  const colors = Colors[colorScheme === 'unspecified' ? 'light' : colorScheme];

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
      </Stack>
      {onboardingChecked && needsOnboarding && <Redirect href="/onboarding" />}
    </ThemeProvider>
  );
}
