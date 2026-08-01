import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { BorderRadius, Fonts, Spacing, tactileShadow } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { markOnboardingComplete } from '@/lib/onboarding';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface Slide {
  icon: IoniconName;
  title: string;
  body: string;
}

const HERO_IMAGE = 'https://images.pexels.com/photos/96106/pexels-photo-96106.jpeg';

const SLIDES: Slide[] = [
  {
    icon: 'school-outline',
    title: 'Pass First Time',
    body: 'Master all 14 topics tested by the DVSA. PassMate helps you study smarter so you walk into the test room ready.',
  },
  {
    icon: 'stats-chart-outline',
    title: 'Target Your Weak Spots',
    body: 'Every answer you give is tracked. PassMate automatically shows you the questions you need most — no wasted revision time.',
  },
  {
    icon: 'bulb-outline',
    title: 'Understand Every Answer',
    body: "Get plain-English explanations when you get something wrong. Know the why, not just the what — and don't repeat the same mistake.",
  },
];

export default function OnboardingScreen() {
  const theme = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);

  const isLast = currentIndex === SLIDES.length - 1;
  const slide = SLIDES[currentIndex];

  const finish = async () => {
    await markOnboardingComplete();
    router.replace('/(tabs)');
  };

  const handleNext = () => {
    if (isLast) {
      finish();
    } else {
      setCurrentIndex((i) => i + 1);
    }
  };

  return (
    <View style={styles.container} testID="onboarding-screen">
      <Image source={{ uri: HERO_IMAGE }} style={styles.heroImage} contentFit="cover" />
      <LinearGradient
        colors={['rgba(11,11,13,0.15)', 'rgba(11,11,13,0.75)', theme.background]}
        locations={[0, 0.55, 0.72]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.skipRow}>
          {!isLast ? (
            <Pressable onPress={finish} hitSlop={12} style={styles.skipPressable} testID="onboarding-skip-button">
              <ThemedText type="smallBold" style={{ color: '#FFFFFF' }}>
                Skip
              </ThemedText>
            </Pressable>
          ) : (
            <View style={styles.skipPressable} />
          )}
        </View>

        <View style={styles.spacer} />

        <View style={styles.slide} testID="onboarding-slide">
          <View
            style={[
              styles.iconBadge,
              { backgroundColor: theme.primary, borderColor: theme.borderHard, ...tactileShadow(theme.borderHard, 4) },
            ]}>
            <Ionicons name={slide.icon} size={36} color="#FFFFFF" />
          </View>
          <ThemedText type="title" style={{ color: theme.text }}>
            {slide.title}
          </ThemedText>
          <ThemedText style={[styles.slideBody, { color: theme.textSecondary }]}>{slide.body}</ThemedText>
        </View>

        <View style={styles.footer}>
          <View style={styles.dots}>
            {SLIDES.map((_, i) => (
              <Pressable key={i} onPress={() => setCurrentIndex(i)} testID={`onboarding-dot-${i}`}>
                <View
                  style={[
                    styles.dot,
                    {
                      backgroundColor: i === currentIndex ? theme.primary : theme.border,
                      width: i === currentIndex ? 28 : 8,
                    },
                  ]}
                />
              </Pressable>
            ))}
          </View>

          <Button
            title={isLast ? 'Get Started' : 'Next'}
            onPress={handleNext}
            fullWidth
            testID="onboarding-next-button"
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0B0D',
  },
  heroImage: {
    ...StyleSheet.absoluteFill,
  },
  safeArea: {
    flex: 1,
  },
  skipRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
  },
  skipPressable: {
    minHeight: 32,
    justifyContent: 'center',
  },
  spacer: {
    flex: 1,
  },
  slide: {
    paddingHorizontal: Spacing.five,
    gap: Spacing.two,
  },
  iconBadge: {
    width: 68,
    height: 68,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.one,
  },
  slideBody: {
    fontSize: 16,
    lineHeight: 23,
    fontFamily: Fonts.bodyRegular,
  },
  footer: {
    padding: Spacing.four,
    paddingTop: Spacing.four,
    gap: Spacing.three,
  },
  dots: {
    flexDirection: 'row',
    gap: Spacing.one,
    alignItems: 'center',
  },
  dot: {
    height: 8,
    borderRadius: BorderRadius.full,
  },
});
