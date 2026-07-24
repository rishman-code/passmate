import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { PREMIUM_PRICE } from '@/constants/categories';
import { BorderRadius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
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

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
              <Ionicons name="car" size={32} color="#FFFFFF" />
            </View>
            <ThemedText style={styles.title}>PassMate</ThemedText>
            <View
              style={[
                styles.badge,
                {
                  backgroundColor: isPremium ? theme.successLight : theme.backgroundElement,
                },
              ]}>
              <ThemedText
                style={[
                  styles.badgeText,
                  { color: isPremium ? theme.success : theme.textSecondary },
                ]}>
                {isPremium ? 'Premium' : 'Free'}
              </ThemedText>
            </View>
          </View>

          {!isPremium ? (
            <View style={[styles.upgradeCard, { backgroundColor: theme.backgroundElement }]}>
              <ThemedText style={styles.upgradeTitle}>Upgrade to Premium</ThemedText>
              <ThemedText themeColor="textSecondary">
                One-time purchase — {PREMIUM_PRICE}
              </ThemedText>
              {FEATURES.map((feature) => (
                <View key={feature.text} style={styles.featureRow}>
                  <Ionicons name={feature.icon} size={18} color={theme.primary} />
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
            <View style={[styles.premiumCard, { backgroundColor: theme.successLight }]}>
              <Ionicons name="checkmark-circle" size={24} color={theme.success} />
              <ThemedText style={[styles.premiumText, { color: theme.success }]}>
                You have full access to all PassMate features.
              </ThemedText>
            </View>
          )}

          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Account</ThemedText>
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
          </View>

          <View style={[styles.info, { backgroundColor: theme.backgroundElement }]}>
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
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  badge: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: BorderRadius.full,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  upgradeCard: {
    padding: Spacing.four,
    borderRadius: BorderRadius.lg,
    gap: Spacing.three,
  },
  upgradeTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  featureText: {
    fontSize: 15,
    flex: 1,
  },
  premiumCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.four,
    borderRadius: BorderRadius.lg,
  },
  premiumText: {
    flex: 1,
    fontWeight: '600',
  },
  section: {
    gap: Spacing.two,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  info: {
    padding: Spacing.three,
    borderRadius: BorderRadius.md,
  },
});
