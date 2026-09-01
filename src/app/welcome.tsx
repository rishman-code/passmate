import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

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

// A winding road behind the feature-card stack, drawn in a 0-100 percentage
// coordinate space that stretches to fill the road section. Cards lay out
// normally (a fixed gap, not pinned coordinates), so long text can never
// make a card overlap its neighbour -- the curve just needs to visually pass
// behind the left/right/left zigzag of card1 -> card2 -> card3, not hit
// exact coordinates.
const ROAD_PATH = 'M 20 6 C 85 16, 88 34, 55 44 C 20 54, 10 74, 20 94';

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
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Image
              source={require('@/assets/images/welcome-mascot.png')}
              style={[styles.avatar, tactileShadow(theme.borderHard, 4)]}
              contentFit="contain"
            />
            <ThemedText type="title" style={styles.title}>
              Welcome to GreenLight
            </ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.subtitle}>
              Your theory test coach
            </ThemedText>
          </View>

          <View style={styles.roadSection} testID="welcome-road-section">
            <Svg style={StyleSheet.absoluteFill} viewBox="0 0 100 100" preserveAspectRatio="none">
              <Path
                d={ROAD_PATH}
                stroke={theme.borderHard}
                strokeWidth={5}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Path
                d={ROAD_PATH}
                stroke="#FFFFFF"
                strokeWidth={0.9}
                strokeDasharray="3.2,3.2"
                fill="none"
                strokeLinecap="round"
              />
            </Svg>

            <View style={styles.cardStack}>
              {WELCOME_FEATURES.map((feature, index) => (
                <View
                  key={feature.text}
                  style={[
                    styles.featureCard,
                    index % 2 === 0 ? styles.cardLeft : styles.cardRight,
                    {
                      backgroundColor: theme.card,
                      borderColor: theme.borderHard,
                      ...tactileShadow(theme.borderHard, 4),
                    },
                  ]}
                  testID={`welcome-feature-${feature.icon}`}>
                  <View style={[styles.featureIcon, { backgroundColor: theme.backgroundElement }]}>
                    <Ionicons name={feature.icon} size={26} color={theme.primary} />
                  </View>
                  <ThemedText style={styles.featureText}>{feature.text}</ThemedText>
                </View>
              ))}
            </View>
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
  scrollView: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.four,
  },
  header: { alignItems: 'center', gap: Spacing.one, marginBottom: Spacing.three },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.one,
  },
  title: { textAlign: 'center', fontSize: 36, lineHeight: 40 },
  subtitle: { textAlign: 'center', fontSize: 18, lineHeight: 24, fontFamily: Fonts.bodyMedium },
  roadSection: { position: 'relative' },
  cardStack: { gap: Spacing.three },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
    borderRadius: BorderRadius.xl,
    borderWidth: 2,
    width: '86%',
  },
  cardLeft: { alignSelf: 'flex-start' },
  cardRight: { alignSelf: 'flex-end' },
  featureIcon: {
    width: 52,
    height: 52,
    minWidth: 52,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: { flex: 1, fontSize: 16, lineHeight: 20, fontFamily: Fonts.bodyBold },
  footer: { padding: Spacing.four, paddingTop: Spacing.two, gap: Spacing.three },
  haveAccountPressable: { alignItems: 'center' },
  haveAccountText: { textDecorationLine: 'underline' },
});
