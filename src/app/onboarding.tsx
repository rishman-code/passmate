import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { BorderRadius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { markOnboardingComplete } from '@/lib/onboarding';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface Slide {
  icon: IoniconName;
  title: string;
  body: string;
}

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
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} testID="onboarding-screen">
      <View style={styles.skipRow}>
        {!isLast ? (
          <Pressable onPress={finish} hitSlop={12} style={styles.skipPressable} testID="onboarding-skip-button">
            <ThemedText type="small" themeColor="textSecondary">
              Skip
            </ThemedText>
          </Pressable>
        ) : (
          <View style={styles.skipPressable} />
        )}
      </View>

      <View style={styles.slide} testID="onboarding-slide">
        <View style={[styles.iconBadge, { backgroundColor: theme.backgroundElement }]}>
          <Ionicons name={slide.icon} size={72} color={theme.primary} />
        </View>
        <ThemedText style={styles.slideTitle}>{slide.title}</ThemedText>
        <ThemedText style={[styles.slideBody, { color: theme.textSecondary }]}>
          {slide.body}
        </ThemedText>
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
                    width: i === currentIndex ? 24 : 8,
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  skipRow: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    alignItems: 'flex-end',
  },
  skipPressable: {
    padding: Spacing.two,
    minHeight: 36,
    justifyContent: 'center',
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.five,
    gap: Spacing.three,
  },
  iconBadge: {
    width: 152,
    height: 152,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.three,
  },
  slideTitle: {
    fontSize: 30,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 38,
  },
  slideBody: {
    fontSize: 17,
    lineHeight: 26,
    textAlign: 'center',
  },
  footer: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.one,
  },
  dot: {
    height: 8,
    borderRadius: BorderRadius.full,
  },
});
