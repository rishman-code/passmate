import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { PREMIUM_PRICE } from '@/constants/categories';
import { BorderRadius, Spacing } from '@/constants/theme';
import { isRevenueCatConfigured } from '@/lib/revenuecat';
import { useTheme } from '@/hooks/use-theme';
import { useSubscriptionStore } from '@/stores/subscription-store';

const FEATURES = [
  'AI-powered explanations for every wrong answer',
  'Full 50-question mock test with 57-minute timer',
  'Detailed weak spot analysis across all 14 DVSA categories',
  'Unlimited adaptive practice sessions',
  'One-time purchase — no subscription',
];

export default function PaywallScreen() {
  const theme = useTheme();
  const { isLoading, error, purchase, restore, setPremium } = useSubscriptionStore();

  const handlePurchase = async () => {
    if (!isRevenueCatConfigured) {
      setPremium(true);
      router.back();
      return;
    }

    const success = await purchase();
    if (success) {
      router.back();
    }
  };

  const handleRestore = async () => {
    const success = await restore();
    if (success) {
      router.back();
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12} testID="paywall-close-button">
            <Ionicons name="close" size={28} color={theme.text} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={[styles.hero, { backgroundColor: theme.primary }]}>
            <Ionicons name="sparkles" size={48} color="#FFFFFF" />
            <ThemedText style={styles.heroTitle}>PassMate Premium</ThemedText>
            <ThemedText style={styles.heroPrice}>{PREMIUM_PRICE} one-time</ThemedText>
          </View>

          <View style={styles.features}>
            {FEATURES.map((feature) => (
              <View key={feature} style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={22} color={theme.success} />
                <ThemedText style={styles.featureText}>{feature}</ThemedText>
              </View>
            ))}
          </View>

          {error ? (
            <ThemedText style={[styles.error, { color: theme.error }]}>{error}</ThemedText>
          ) : null}

          {!isRevenueCatConfigured ? (
            <ThemedText type="small" themeColor="textSecondary" style={styles.devNote}>
              RevenueCat not configured — tap below to enable premium in development.
            </ThemedText>
          ) : null}
        </ScrollView>

        <View style={styles.footer}>
          <Button
            title={`Get Premium — ${PREMIUM_PRICE}`}
            onPress={handlePurchase}
            loading={isLoading}
            fullWidth
            testID="paywall-purchase-button"
          />
          <Button
            title="Restore Purchases"
            variant="outline"
            onPress={handleRestore}
            fullWidth
            testID="paywall-restore-button"
          />
        </View>
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
  header: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    alignItems: 'flex-end',
  },
  scroll: {
    padding: Spacing.four,
    gap: Spacing.four,
  },
  hero: {
    alignItems: 'center',
    padding: Spacing.five,
    borderRadius: BorderRadius.xl,
    gap: Spacing.two,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
  },
  heroPrice: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 18,
    fontWeight: '600',
  },
  features: {
    gap: Spacing.three,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  featureText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
  },
  error: {
    textAlign: 'center',
    fontSize: 14,
  },
  devNote: {
    textAlign: 'center',
  },
  footer: {
    padding: Spacing.four,
    gap: Spacing.two,
  },
});
