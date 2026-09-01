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
import {
  DarkTheme,
  DefaultTheme,
  Redirect,
  Stack,
  ThemeProvider,
  usePathname,
  useRootNavigationState,
} from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, useColorScheme, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { useCertificateExpiryWatch } from '@/hooks/use-certificate-expiry-watch';
import { useReEngagementReminders } from '@/hooks/use-re-engagement-reminders';
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
  // A <Redirect> rendered before the native navigator has finished its first
  // mount can be silently dropped (no-op) instead of queued -- this doesn't
  // reproduce on web, where the browser's own history/URL state backs it up.
  // Gate every redirect below on the root navigation state actually existing.
  const rootNavigationState = useRootNavigationState();
  const navigationReady = rootNavigationState?.key != null;
  // This screen drives its own navigation start to finish -- deep-linked in
  // (cold launch, so hasSeenWelcome is always false) from the reset-password
  // email, then exchanging its one-time code for a session (so `session`
  // below briefly flips from null to set), then its own explicit redirect
  // once the user has actually set a new password. Every blanket redirect
  // below would otherwise hijack it mid-flow -- to welcome the instant it
  // mounts (replacing this route and losing the one-time code before it's
  // even exchanged), then to sign-in (no session yet), then to tabs the
  // instant the exchange succeeds (session now set) -- in every case before
  // the user ever sees the "set a new password" form.
  const isResettingPassword = usePathname() === '/auth/reset-password';
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [guestChecked, setGuestChecked] = useState(false);
  const [isGuest, setIsGuest] = useState(false);

  useCertificateExpiryWatch();
  // Only once the user has actually reached the app -- past onboarding, and
  // either signed in or in guest mode -- so we don't prompt for notification
  // permission before they've even seen it.
  useReEngagementReminders(onboardingChecked && !needsOnboarding && guestChecked && (session != null || isGuest));

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
        <Stack.Screen name="(tabs)" options={{ title: 'Home' }} />
        <Stack.Screen
          name="practice/session"
          options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="mock-test/index"
          options={{ headerShown: true, title: 'Mock Test', headerBackTitle: 'Home' }}
        />
        <Stack.Screen
          name="mock-test/session"
          options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="mock-test/results"
          options={{ headerShown: true, title: 'Results', headerBackTitle: 'Home' }}
        />
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
        <Stack.Screen
          name="mistake-ledger"
          options={{ headerShown: true, title: 'Mistake Ledger', headerBackTitle: 'Progress' }}
        />
      </Stack>
      {navigationReady && !hasSeenWelcome && !isResettingPassword && <Redirect href="/welcome" />}
      {navigationReady && hasSeenWelcome && onboardingChecked && needsOnboarding && !isResettingPassword && (
        <Redirect href="/onboarding" />
      )}
      {navigationReady &&
        hasSeenWelcome &&
        onboardingChecked &&
        !needsOnboarding &&
        !session &&
        guestChecked &&
        !isGuest &&
        !isResettingPassword && <Redirect href="/auth/sign-in" />}
      {navigationReady &&
        hasSeenWelcome &&
        onboardingChecked &&
        !needsOnboarding &&
        guestChecked &&
        (session || isGuest) &&
        !isResettingPassword && <Redirect href="/(tabs)" />}
    </ThemeProvider>
  );
}
