import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MONTHLY_PRICE, YEARLY_PRICE } from '@/constants/categories';
import { BorderRadius, Fonts, Spacing, tactileShadow } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { deleteAccount, signOut } from '@/lib/auth';
import { setGuestMode } from '@/lib/guest-mode';
import { resetOnboardingSeen } from '@/lib/onboarding';
import { isRevenueCatConfigured } from '@/lib/revenuecat';
import { useAuthStore } from '@/stores/auth-store';
import { useJourneyStore } from '@/stores/journey-store';
import { useMistakeLedgerStore } from '@/stores/mistake-ledger-store';
import { useProgressStore } from '@/stores/progress-store';
import { useSubscriptionStore } from '@/stores/subscription-store';
import { useWelcomeSessionStore } from '@/stores/welcome-session-store';
import type { JourneyState } from '@/types/journey';
import { formatLocalDateLong } from '@/utils/journey-dates';

const FEATURES = [
  { icon: 'sparkles' as const, text: 'AI explanations for wrong answers' },
  { icon: 'timer' as const, text: 'Full mock test simulator' },
  { icon: 'stats-chart' as const, text: 'Detailed weak spot analysis' },
  { icon: 'infinite' as const, text: 'Unlimited practice sessions' },
];

const JOURNEY_STATE_LABELS: Record<JourneyState, string> = {
  preparing: 'Preparing',
  booked: 'Booked',
  retake: 'Retaking',
  certified: 'Certified',
};

export default function ProfileScreen() {
  const theme = useTheme();
  const { isPremium, isLoading, restore, openPaywall, openCustomerCenter } = useSubscriptionStore();
  const user = useAuthStore((s) => s.user);
  const resetProgress = useProgressStore((s) => s.reset);
  const journey = useJourneyStore((s) => s.journey);
  const resetJourney = useJourneyStore((s) => s.reset);
  const resetMistakeLedger = useMistakeLedgerStore((s) => s.reset);
  const resetWelcomeSeen = useWelcomeSessionStore((s) => s.resetWelcomeSeen);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const displayName = user ? ((user.user_metadata?.name as string | undefined) ?? user.email ?? 'Account') : 'Guest';

  const handleRestore = async () => {
    const restored = await restore();
    if (restored) {
      // Premium restored
    }
  };

  const handleUnlockPress = async () => {
    const result = await openPaywall();
    if (result === 'fallback') {
      router.push('/paywall');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    resetProgress();
    resetJourney();
    resetMistakeLedger();
    router.replace('/auth/sign-in');
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete account?',
      'This permanently deletes your account and all your progress. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsDeletingAccount(true);
            try {
              await deleteAccount();
            } catch {
              setIsDeletingAccount(false);
              Alert.alert('Something went wrong', 'Could not delete your account. Please try again.');
              return;
            }
            await signOut();
            resetProgress();
            resetJourney();
            resetMistakeLedger();
            router.replace('/auth/sign-in');
          },
        },
      ],
    );
  };

  // Hidden test-only escape hatch (long-press the footer disclaimer) to replay
  // the first-time welcome/onboarding flow without uninstalling the app --
  // onboarding-seen and guest mode are both persisted per-device, so once
  // either is set they otherwise never reset on their own.
  const handleResetOnboarding = () => {
    Alert.alert(
      'Reset onboarding?',
      'This signs you out and shows the welcome and onboarding screens again next time, as if this were a fresh install.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            await setGuestMode(false);
            await resetOnboardingSeen();
            resetProgress();
            resetJourney();
            resetMistakeLedger();
            resetWelcomeSeen();
            router.replace('/welcome');
          },
        },
      ],
    );
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View
              style={[
                styles.avatar,
                { backgroundColor: theme.primary, borderColor: theme.borderHard, ...tactileShadow(theme.borderHard, 4) },
              ]}>
              <Ionicons name="person" size={34} color="#FFFFFF" />
            </View>
            <ThemedText type="title">{displayName}</ThemedText>
            {user?.email ? (
              <ThemedText type="small" themeColor="textSecondary">{user.email}</ThemedText>
            ) : null}
            <View
              style={[
                styles.badge,
                {
                  backgroundColor: isPremium ? theme.successLight : theme.backgroundElement,
                  borderColor: isPremium ? theme.success : theme.border,
                },
              ]}>
              <ThemedText
                type="caption"
                style={{ color: isPremium ? theme.success : theme.textSecondary }}>
                {isPremium ? 'Premium' : 'Free'}
              </ThemedText>
            </View>
          </View>

          {!isPremium ? (
            <View
              style={[
                styles.upgradeCard,
                { backgroundColor: theme.backgroundElement, borderColor: theme.borderHard, ...tactileShadow(theme.borderHard, 4) },
              ]}>
              <ThemedText type="h3">Upgrade to Premium</ThemedText>
              <ThemedText themeColor="textSecondary">
                {MONTHLY_PRICE}/month or {YEARLY_PRICE}/year
              </ThemedText>
              {FEATURES.map((feature) => (
                <View key={feature.text} style={styles.featureRow}>
                  <View style={[styles.featureIconBadge, { backgroundColor: theme.backgroundSelected }]}>
                    <Ionicons name={feature.icon} size={16} color={theme.primary} />
                  </View>
                  <ThemedText style={styles.featureText}>{feature.text}</ThemedText>
                </View>
              ))}
              <Button
                title="View Plans"
                onPress={handleUnlockPress}
                fullWidth
                testID="profile-unlock-button"
              />
            </View>
          ) : (
            <View
              style={[
                styles.premiumCard,
                { backgroundColor: theme.successLight, borderColor: theme.success },
              ]}>
              <Ionicons name="checkmark-circle" size={24} color={theme.success} />
              <ThemedText style={[styles.premiumText, { color: theme.success }]}>
                You have full access to all GreenLight features.
              </ThemedText>
            </View>
          )}

          <View style={styles.section}>
            <ThemedText type="caption" themeColor="textSecondary">
              Test Journey
            </ThemedText>
            <View
              style={[
                styles.journeyCard,
                { backgroundColor: theme.backgroundElement, borderColor: theme.border },
              ]}>
              <View style={styles.journeyText}>
                <ThemedText style={styles.journeyState}>
                  {JOURNEY_STATE_LABELS[journey.state]}
                </ThemedText>
                {journey.state === 'booked' && journey.testDate ? (
                  <ThemedText type="small" themeColor="textSecondary">
                    Test on {formatLocalDateLong(journey.testDate)}
                  </ThemedText>
                ) : null}
              </View>
              <Button
                title="Edit"
                variant="outline"
                surfaceColor={theme.backgroundElement}
                onPress={() => router.push('/journey/setup')}
                testID="profile-edit-journey-button"
              />
            </View>
          </View>

          <View style={styles.section}>
            <ThemedText type="caption" themeColor="textSecondary">
              Account
            </ThemedText>
            {!user ? (
              <View
                style={[styles.guestNotice, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
                <ThemedText type="small" themeColor="textSecondary">
                  You're browsing as a guest. Sign in to sync your progress across devices.
                </ThemedText>
              </View>
            ) : null}
            {isRevenueCatConfigured && isPremium ? (
              <Button
                title="Manage Subscription"
                variant="outline"
                onPress={openCustomerCenter}
                fullWidth
                testID="profile-manage-subscription-button"
              />
            ) : null}
            {isRevenueCatConfigured ? (
              <Button
                title="Restore Purchases"
                variant="outline"
                onPress={handleRestore}
                loading={isLoading}
                fullWidth
                testID="profile-restore-button"
              />
            ) : null}
            {user ? (
              <>
                <Button
                  title="Sign Out"
                  variant="outline"
                  onPress={handleSignOut}
                  fullWidth
                  testID="profile-sign-out-button"
                />
                <Button
                  title="Delete Account"
                  variant="danger"
                  onPress={handleDeleteAccount}
                  loading={isDeletingAccount}
                  fullWidth
                  testID="profile-delete-account-button"
                />
              </>
            ) : (
              <Button
                title="Sign In"
                onPress={() => router.push('/auth/sign-in')}
                fullWidth
                testID="profile-sign-in-button"
              />
            )}
          </View>

          <Pressable
            onLongPress={handleResetOnboarding}
            delayLongPress={2000}
            style={[styles.info, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
            testID="profile-footer-reset-onboarding">
            <ThemedText type="small" themeColor="textSecondary">
              GreenLight helps you prepare for the official DVSA driving theory test. This app is not
              affiliated with or endorsed by the DVSA.
            </ThemedText>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scroll: {
    padding: Spacing.four,
    gap: Spacing.four,
  },
  header: {
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.three,
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: BorderRadius.xl,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
  },
  upgradeCard: {
    padding: Spacing.four,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    gap: Spacing.three,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  featureIconBadge: {
    width: 30,
    height: 30,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    fontSize: 15,
    flex: 1,
    fontFamily: Fonts.bodyMedium,
  },
  premiumCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.four,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
  },
  premiumText: {
    flex: 1,
    fontFamily: Fonts.bodyBold,
  },
  section: {
    gap: Spacing.two,
  },
  journeyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.three,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    gap: Spacing.three,
  },
  journeyText: {
    flex: 1,
    gap: 2,
  },
  journeyState: {
    fontSize: 16,
    fontFamily: Fonts.bodyBold,
  },
  info: {
    padding: Spacing.three,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
  },
  guestNotice: {
    padding: Spacing.three,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
  },
});
