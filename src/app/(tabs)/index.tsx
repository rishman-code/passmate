import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { ProgressBar } from '@/components/progress-bar';
import { StatCard } from '@/components/stat-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import {
  MOCK_TEST_PASS_SCORE,
  MOCK_TEST_QUESTION_COUNT,
  PREMIUM_PRICE,
} from '@/constants/categories';
import { BorderRadius, Fonts, Spacing, tactileShadow } from '@/constants/theme';
import { useQuestions } from '@/hooks/use-questions';
import { useTheme } from '@/hooks/use-theme';
import { fetchAllQuestions } from '@/services/questions';
import { usePracticeStore } from '@/stores/practice-store';
import { useProgressStore } from '@/stores/progress-store';
import { useSubscriptionStore } from '@/stores/subscription-store';
import { buildAdaptiveQuestionQueue } from '@/utils/practice';

const BANNER_IMAGE = 'https://images.pexels.com/photos/29909543/pexels-photo-29909543.jpeg';

export default function HomeScreen() {
  const theme = useTheme();
  const { isLoading, weakestCategories } = useQuestions();
  const totalAnswered = useProgressStore((s) => s.getTotalAnswered());
  const overallAccuracy = useProgressStore((s) => s.getOverallAccuracy());
  const currentStreak = useProgressStore((s) => s.currentStreak);
  const progress = useProgressStore((s) => s.progress);
  const isPremium = useSubscriptionStore((s) => s.isPremium);
  const openPaywall = useSubscriptionStore((s) => s.openPaywall);
  const setQuestions = usePracticeStore((s) => s.setQuestions);
  const setCategoryFilter = usePracticeStore((s) => s.setCategoryFilter);
  const [isStarting, setIsStarting] = useState(false);

  const startAdaptivePractice = async () => {
    setIsStarting(true);
    try {
      const allQuestions = await fetchAllQuestions();
      const queue = buildAdaptiveQuestionQueue(allQuestions, progress, 10);
      setCategoryFilter(null);
      setQuestions(queue);
      router.push('/practice/session');
    } finally {
      setIsStarting(false);
    }
  };

  const handleUnlockPress = async () => {
    const result = await openPaywall();
    if (result === 'fallback') {
      router.push('/paywall');
    }
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" color={theme.primary} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <ThemedText type="title" style={{ color: theme.text }}>
              PassMate
            </ThemedText>
            <ThemedText themeColor="textSecondary">
              Your AI-powered DVSA theory test companion
            </ThemedText>
          </View>

          {!isPremium ? (
            <Pressable
              onPress={handleUnlockPress}
              testID="home-unlock-banner"
              style={[styles.premiumBanner, { borderColor: theme.borderHard, ...tactileShadow(theme.borderHard, 4) }]}>
              <Image source={{ uri: BANNER_IMAGE }} style={StyleSheet.absoluteFill} contentFit="cover" />
              <LinearGradient
                colors={['rgba(255,69,0,0.35)', 'rgba(11,11,13,0.88)']}
                style={StyleSheet.absoluteFill}
              />
              <Ionicons name="sparkles" size={24} color="#FFFFFF" />
              <View style={styles.premiumText}>
                <ThemedText style={styles.premiumTitle}>Unlock Full Access</ThemedText>
                <ThemedText style={styles.premiumSubtitle}>
                  AI explanations, mock tests & more — {PREMIUM_PRICE}
                </ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
            </Pressable>
          ) : null}

          <View style={styles.statsRow}>
            <StatCard label="Answered" value={String(totalAnswered)} />
            <StatCard
              label="Accuracy"
              value={`${overallAccuracy}%`}
              accentColor={overallAccuracy >= 86 ? theme.success : theme.text}
            />
            <StatCard
              label="Streak"
              value={`${currentStreak}d`}
              accentColor={currentStreak >= 3 ? theme.warning : theme.text}
            />
          </View>

          <View style={styles.section}>
            <ThemedText type="h3">Quick Actions</ThemedText>
            <Button
              title="Start Adaptive Practice"
              onPress={startAdaptivePractice}
              loading={isStarting}
              fullWidth
            />
            <Button
              title="Take Mock Test"
              variant="secondary"
              onPress={() => router.push('/mock-test')}
              fullWidth
            />
          </View>

          <View
            style={[
              styles.mockInfo,
              { backgroundColor: theme.backgroundElement, borderColor: theme.border },
            ]}>
            <Ionicons name="timer-outline" size={20} color={theme.primary} />
            <ThemedText type="small" themeColor="textSecondary">
              Mock test: {MOCK_TEST_QUESTION_COUNT} questions, 57 minutes. Pass mark:{' '}
              {MOCK_TEST_PASS_SCORE}/{MOCK_TEST_QUESTION_COUNT}.
            </ThemedText>
          </View>

          {weakestCategories.length > 0 ? (
            <View style={styles.section}>
              <ThemedText type="h3">Weak Spots</ThemedText>
              {weakestCategories.map((cat) => (
                <View
                  key={cat.category}
                  style={[
                    styles.weakSpot,
                    { backgroundColor: theme.card, borderColor: theme.borderHard },
                  ]}>
                  <View style={styles.weakSpotHeader}>
                    <ThemedText style={styles.weakSpotTitle}>{cat.category}</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {cat.correct_answers}/{cat.total_questions} correct
                    </ThemedText>
                  </View>
                  <ProgressBar
                    progress={cat.accuracy_percentage}
                    color={cat.accuracy_percentage < 70 ? theme.error : theme.warning}
                  />
                </View>
              ))}
            </View>
          ) : (
            <View
              style={[
                styles.emptyWeak,
                { backgroundColor: theme.backgroundElement, borderColor: theme.border },
              ]}>
              <ThemedText themeColor="textSecondary">
                Start practising to identify your weak spots.
              </ThemedText>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  safeArea: {
    flex: 1,
  },
  scroll: {
    padding: Spacing.four,
    gap: Spacing.four,
  },
  header: {
    gap: Spacing.one,
    paddingTop: Spacing.two,
  },
  premiumBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    gap: Spacing.two,
    overflow: 'hidden',
    minHeight: 84,
  },
  premiumText: {
    flex: 1,
    gap: 2,
  },
  premiumTitle: {
    color: '#FFFFFF',
    fontFamily: Fonts.displayBold,
    fontSize: 17,
  },
  premiumSubtitle: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 13,
    fontFamily: Fonts.bodyMedium,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  section: {
    gap: Spacing.three,
  },
  mockInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
  },
  weakSpot: {
    padding: Spacing.three,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    gap: Spacing.two,
  },
  weakSpotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  weakSpotTitle: {
    fontSize: 15,
    fontFamily: Fonts.bodyBold,
    flex: 1,
  },
  emptyWeak: {
    padding: Spacing.four,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    alignItems: 'center',
  },
});
