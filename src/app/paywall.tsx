import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { PREMIUM_PRICE } from '@/constants/categories';
import { BorderRadius, Fonts, Spacing, tactileShadow } from '@/constants/theme';
import { isRevenueCatConfigured } from '@/lib/revenuecat';
import { useTheme } from '@/hooks/use-theme';
import { useSubscriptionStore } from '@/stores/subscription-store';

const HERO_IMAGE = 'https://images.pexels.com/photos/96106/pexels-photo-96106.jpeg';

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
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View
            style={[styles.hero, { borderColor: theme.borderHard, ...tactileShadow(theme.borderHard, 4) }]}>
            <Image source={{ uri: HERO_IMAGE }} style={StyleSheet.absoluteFill} contentFit="cover" />
            <LinearGradient
              colors={['rgba(255,69,0,0.25)', 'rgba(11,11,13,0.85)']}
              style={StyleSheet.absoluteFill}
            />
            <Pressable onPress={() => router.back()} hitSlop={12} style={styles.closeButton} testID="paywall-close-button">
              <Ionicons name="close" size={22} color="#0A0A0B" />
            </Pressable>
            <Ionicons name="sparkles" size={40} color="#FFFFFF" />
            <ThemedText style={styles.heroTitle}>GreenLight Pro</ThemedText>
            <ThemedText style={styles.heroPrice}>{PREMIUM_PRICE} — lifetime access</ThemedText>
          </View>

          <View style={styles.features}>
            {FEATURES.map((feature) => (
              <View key={feature} style={styles.featureRow}>
                <View style={[styles.checkBadge, { backgroundColor: theme.successLight, borderColor: theme.success }]}>
                  <Ionicons name="checkmark" size={14} color={theme.success} />
                </View>
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
  scroll: {
    padding: Spacing.four,
    gap: Spacing.four,
  },
  hero: {
    alignItems: 'center',
    padding: Spacing.five,
    paddingTop: Spacing.six,
    borderRadius: BorderRadius.xl,
    borderWidth: 2,
    gap: Spacing.two,
    overflow: 'hidden',
    minHeight: 220,
    justifyContent: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: Spacing.three,
    right: Spacing.three,
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 30,
    fontFamily: Fonts.displayBold,
  },
  heroPrice: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 17,
    fontFamily: Fonts.bodySemiBold,
  },
  features: {
    gap: Spacing.three,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  checkBadge: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  featureText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
    fontFamily: Fonts.bodyMedium,
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
