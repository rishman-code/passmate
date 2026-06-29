import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
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
  const { width } = useWindowDimensions();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList<Slide>>(null);

  const isLast = currentIndex === SLIDES.length - 1;

  const finish = async () => {
    await markOnboardingComplete();
    router.replace('/(tabs)');
  };

  const handleNext = () => {
    if (isLast) {
      finish();
    } else {
      flatListRef.current?.scrollToOffset({
        offset: (currentIndex + 1) * width,
        animated: true,
      });
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.skipRow}>
        {!isLast ? (
          <Pressable onPress={finish} hitSlop={12} style={styles.skipPressable}>
            <ThemedText type="small" themeColor="textSecondary">
              Skip
            </ThemedText>
          </Pressable>
        ) : (
          <View style={styles.skipPressable} />
        )}
      </View>

      <FlatList
        ref={flatListRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        scrollEventThrottle={16}
        keyExtractor={(_, i) => String(i)}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <View style={[styles.iconBadge, { backgroundColor: theme.backgroundElement }]}>
              <Ionicons name={item.icon} size={72} color={theme.primary} />
            </View>
            <ThemedText style={styles.slideTitle}>{item.title}</ThemedText>
            <ThemedText style={[styles.slideBody, { color: theme.textSecondary }]}>
              {item.body}
            </ThemedText>
          </View>
        )}
      />

      <View style={styles.footer}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor: i === currentIndex ? theme.primary : theme.border,
                  width: i === currentIndex ? 24 : 8,
                },
              ]}
            />
          ))}
        </View>

        <Button title={isLast ? 'Get Started' : 'Next'} onPress={handleNext} fullWidth />
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
