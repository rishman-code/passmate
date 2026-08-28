import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BorderRadius, Fonts, Spacing, tactileShadow } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { markOnboardingComplete } from '@/lib/onboarding';
import { useWelcomeSessionStore } from '@/stores/welcome-session-store';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface WelcomeFeature {
  icon: IoniconName;
  text: string;
}

const WELCOME_FEATURES: WelcomeFeature[] = [
  { icon: 'checkmark-circle-outline', text: 'THE app you use to pass THIS time around' },
  { icon: 'locate-outline', text: 'Learns your weak spots and only drills those, nothing else' },
  { icon: 'gift-outline', text: 'Free trial unlocks everything, no limited version' },
];

export default function WelcomeScreen() {
  const theme = useTheme();
  const markWelcomeSeen = useWelcomeSessionStore((s) => s.markWelcomeSeen);

  const handleNext = () => {
    // Let the root layout's redirect logic decide what comes next
    // (onboarding if it hasn't been completed yet, otherwise sign-in/dashboard).
    markWelcomeSeen();
  };

  const handleHaveAccount = async () => {
    await markOnboardingComplete();
    markWelcomeSeen();
    router.replace('/auth/sign-in');
  };

  return (
    <ThemedView style={styles.container} testID="welcome-screen">
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.avatarRow}>
            <View
              style={[
                styles.avatar,
                { backgroundColor: theme.primary, borderColor: theme.borderHard, ...tactileShadow(theme.borderHard, 4) },
              ]}>
              <Ionicons name="school-outline" size={44} color="#FFFFFF" />
            </View>
          </View>

          <ThemedText type="title" style={styles.title}>
            Welcome to GreenLight
          </ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.subtitle}>
            Your theory test coach
          </ThemedText>

          <View style={styles.features}>
            {WELCOME_FEATURES.map((feature) => (
              <View
                key={feature.text}
                style={[
                  styles.featureCard,
                  { backgroundColor: theme.card, borderColor: theme.borderHard, ...tactileShadow(theme.borderHard, 3) },
                ]}>
                <View style={[styles.featureIcon, { backgroundColor: theme.backgroundElement }]}>
                  <Ionicons name={feature.icon} size={20} color={theme.primary} />
                </View>
                <ThemedText style={styles.featureText}>{feature.text}</ThemedText>
              </View>
            ))}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Button title="Next" onPress={handleNext} fullWidth testID="welcome-next-button" />

          <Pressable
            onPress={handleHaveAccount}
            hitSlop={12}
            style={styles.haveAccountPressable}
            testID="welcome-have-account-link">
            <ThemedText type="small" style={styles.haveAccountText}>
              I have an account
            </ThemedText>
          </Pressable>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  scroll: { padding: Spacing.four, paddingTop: Spacing.six, gap: Spacing.three, alignItems: 'center' },
  avatarRow: { alignItems: 'center', marginBottom: Spacing.one },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: BorderRadius.full,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { textAlign: 'center' },
  subtitle: { textAlign: 'center', marginBottom: Spacing.two },
  features: { width: '100%', gap: Spacing.three },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
  },
  featureIcon: {
    width: 42,
    height: 42,
    minWidth: 42,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: { flex: 1, fontSize: 14.5, lineHeight: 20, fontFamily: Fonts.bodyBold },
  footer: { padding: Spacing.four, paddingTop: Spacing.two, gap: Spacing.three },
  haveAccountPressable: { alignItems: 'center' },
  haveAccountText: { textDecorationLine: 'underline' },
});
