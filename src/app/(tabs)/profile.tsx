import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { PREMIUM_PRICE } from '@/constants/categories';
import { BorderRadius, Fonts, Spacing, tactileShadow } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { signOut } from '@/lib/auth';
import { useAuthStore } from '@/stores/auth-store';
import { useProgressStore } from '@/stores/progress-store';
import { useSubscriptionStore } from '@/stores/subscription-store';

const FEATURES = [
  { icon: 'sparkles' as const, text: 'AI explanations for wrong answers' },
  { icon: 'timer' as const, text: 'Full mock test simulator' },
  { icon: 'stats-chart' as const, text: 'Detailed weak spot analysis' },
  { icon: 'infinite' as const, text: 'Unlimited practice sessions' },
];

export default function ProfileScreen() {
  const theme = useTheme();
  const { isPremium, isLoading, restore, openPaywall, openCustomerCenter } = useSubscriptionStore();
  const user = useAuthStore((s) => s.user);
  const resetProgress = useProgressStore((s) => s.reset);

  const displayName = (user?.user_metadata?.name as string | undefined) ?? user?.email ?? 'Account';

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
    router.replace('/auth/sign-in');
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
                One-time purchase — {PREMIUM_PRICE}
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
                title={`Unlock for ${PREMIUM_PRICE}`}
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
                You have full access to all PassMate features.
              </ThemedText>
            </View>
          )}

          <View style={styles.section}>
            <ThemedText type="caption" themeColor="textSecondary">
              Account
            </ThemedText>
            {isPremium ? (
              <Button
                title="Manage Subscription"
                variant="outline"
                onPress={openCustomerCenter}
                fullWidth
                testID="profile-manage-subscription-button"
              />
            ) : null}
            <Button
              title="Restore Purchases"
              variant="outline"
              onPress={handleRestore}
              loading={isLoading}
              fullWidth
              testID="profile-restore-button"
            />
            <Button
              title="Sign Out"
              variant="outline"
              onPress={handleSignOut}
              fullWidth
              testID="profile-sign-out-button"
            />
          </View>

          <View style={[styles.info, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            <ThemedText type="small" themeColor="textSecondary">
              PassMate helps you prepare for the official DVSA driving theory test. This app is not
              affiliated with or endorsed by the DVSA.
            </ThemedText>
          </View>
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
  info: {
    padding: Spacing.three,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
  },
});
