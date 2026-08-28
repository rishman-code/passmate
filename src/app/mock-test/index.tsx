import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import {
  MOCK_TEST_DURATION_SECONDS,
  MOCK_TEST_PASS_SCORE,
  MOCK_TEST_QUESTION_COUNT,
} from '@/constants/categories';
import { BorderRadius, Fonts, Spacing, tactileShadow } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { fetchAllQuestions, selectMockTestQuestions } from '@/services/questions';
import { useMockTestStore } from '@/stores/mock-test-store';
import { useSubscriptionStore } from '@/stores/subscription-store';
import { formatTime } from '@/utils/practice';

const RULES = [
  `${MOCK_TEST_QUESTION_COUNT} multiple choice questions`,
  `${formatTime(MOCK_TEST_DURATION_SECONDS)} time limit`,
  `Pass mark: ${MOCK_TEST_PASS_SCORE} correct answers`,
  'No explanations until the end',
  'Navigate back to review answers',
];

export default function MockTestIntroScreen() {
  const theme = useTheme();
  const isPremium = useSubscriptionStore((s) => s.isPremium);
  const setQuestions = useMockTestStore((s) => s.setQuestions);
  const reset = useMockTestStore((s) => s.reset);
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    reset();
  }, [reset]);

  const startMockTest = async () => {
    if (!isPremium) {
      router.push('/paywall');
      return;
    }

    setIsStarting(true);
    try {
      const allQuestions = await fetchAllQuestions();
      const mockQuestions = selectMockTestQuestions(allQuestions, MOCK_TEST_QUESTION_COUNT);
      setQuestions(mockQuestions);
      router.push('/mock-test/session');
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: true, title: 'Mock Test' }} />
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <View style={styles.content}>
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: theme.primary, borderColor: theme.borderHard, ...tactileShadow(theme.borderHard, 4) },
            ]}>
            <Ionicons name="timer" size={38} color="#FFFFFF" />
          </View>

          <ThemedText type="title" style={styles.title}>
            DVSA Mock Test
          </ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.subtitle}>
            Simulate the real theory test experience with timed conditions.
          </ThemedText>

          <View
            style={[
              styles.rulesCard,
              { backgroundColor: theme.backgroundElement, borderColor: theme.borderHard },
            ]}>
            {RULES.map((rule) => (
              <View key={rule} style={styles.ruleRow}>
                <View style={[styles.ruleIconBadge, { backgroundColor: theme.backgroundSelected }]}>
                  <Ionicons name="checkmark-circle" size={16} color={theme.primary} />
                </View>
                <ThemedText style={styles.ruleText}>{rule}</ThemedText>
              </View>
            ))}
          </View>

          {!isPremium ? (
            <ThemedText type="small" themeColor="textSecondary" style={styles.premiumNote}>
              Mock tests require GreenLight Premium.
            </ThemedText>
          ) : null}

          <Button
            title={isPremium ? 'Start Mock Test' : 'Unlock to Start'}
            onPress={startMockTest}
            loading={isStarting}
            fullWidth
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
  content: {
    flex: 1,
    padding: Spacing.four,
    gap: Spacing.four,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 84,
    height: 84,
    borderRadius: BorderRadius.xl,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    lineHeight: 22,
    fontFamily: Fonts.bodyRegular,
  },
  rulesCard: {
    alignSelf: 'stretch',
    padding: Spacing.four,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    gap: Spacing.three,
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  ruleIconBadge: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ruleText: {
    fontSize: 15,
    flex: 1,
    fontFamily: Fonts.bodyMedium,
  },
  premiumNote: {
    textAlign: 'center',
  },
});
