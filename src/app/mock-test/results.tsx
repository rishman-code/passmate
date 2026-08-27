import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as StoreReview from 'expo-store-review';

import { Button } from '@/components/button';
import { RateAppModal } from '@/components/rate-app-modal';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MOCK_TEST_PASS_SCORE, MOCK_TEST_QUESTION_COUNT } from '@/constants/categories';
import { BorderRadius, Fonts, Spacing, tactileShadow } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useMockTestStore } from '@/stores/mock-test-store';
import { useProgressStore } from '@/stores/progress-store';
import { useRateAppStore } from '@/stores/rate-app-store';
import { formatTime } from '@/utils/practice';

export default function MockTestResultsScreen() {
  const theme = useTheme();
  const recordMockTestResult = useProgressStore((s) => s.recordMockTestResult);
  const reset = useMockTestStore((s) => s.reset);
  const recordRateAppChoice = useRateAppStore((s) => s.recordChoice);
  const canPromptRateApp = useRateAppStore((s) => s.canPrompt);
  const [showRatePrompt, setShowRatePrompt] = useState(false);

  const score = useMockTestStore((s) => s.getScore());
  const passed = useMockTestStore((s) => s.getPassed());
  const timeTaken = useMockTestStore((s) => s.getTimeTaken());
  const answers = useMockTestStore((s) => s.answers);

  const hasRecorded = useRef(false);

  useEffect(() => {
    if (!hasRecorded.current) {
      hasRecorded.current = true;
      recordMockTestResult({
        score,
        total_questions: MOCK_TEST_QUESTION_COUNT,
        passed,
        completed_at: new Date().toISOString(),
        time_taken_seconds: timeTaken,
      });

      if (passed && canPromptRateApp()) {
        const timer = setTimeout(() => setShowRatePrompt(true), 1200);
        return () => clearTimeout(timer);
      }
    }
  }, [score, passed, timeTaken, recordMockTestResult, canPromptRateApp]);

  const handleRateAppNever = () => {
    recordRateAppChoice('never');
    setShowRatePrompt(false);
  };

  const handleRateAppLater = () => {
    recordRateAppChoice('later');
    setShowRatePrompt(false);
  };

  const handleRateAppRateNow = async () => {
    recordRateAppChoice('rated');
    setShowRatePrompt(false);

    if (await StoreReview.isAvailableAsync()) {
      await StoreReview.requestReview();
      return;
    }
    const url = StoreReview.storeUrl();
    if (url) Linking.openURL(url);
  };

  const handleDone = () => {
    reset();
    router.replace('/(tabs)');
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: true, title: 'Results' }} />
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <View style={styles.content}>
          <View
            style={[
              styles.resultCircle,
              {
                backgroundColor: passed ? theme.successLight : theme.errorLight,
                borderColor: passed ? theme.success : theme.error,
              },
            ]}>
            <Ionicons
              name={passed ? 'checkmark-circle' : 'close-circle'}
              size={64}
              color={passed ? theme.success : theme.error}
            />
          </View>

          <ThemedText type="title" style={styles.title}>
            {passed ? 'You Passed!' : 'Not Quite'}
          </ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.subtitle}>
            {passed
              ? 'Great work — you met the DVSA pass mark.'
              : `You need ${MOCK_TEST_PASS_SCORE} correct answers to pass.`}
          </ThemedText>

          <View
            style={[
              styles.statsCard,
              { backgroundColor: theme.backgroundElement, borderColor: theme.borderHard, ...tactileShadow(theme.borderHard, 4) },
            ]}>
            <View style={styles.statRow}>
              <ThemedText themeColor="textSecondary">Score</ThemedText>
              <ThemedText style={styles.statValue}>
                {score}/{MOCK_TEST_QUESTION_COUNT}
              </ThemedText>
            </View>
            <View style={styles.statRow}>
              <ThemedText themeColor="textSecondary">Time Taken</ThemedText>
              <ThemedText style={styles.statValue}>{formatTime(timeTaken)}</ThemedText>
            </View>
            <View style={styles.statRow}>
              <ThemedText themeColor="textSecondary">Incorrect</ThemedText>
              <ThemedText style={styles.statValue}>
                {answers.filter((a) => !a.correct).length}
              </ThemedText>
            </View>
          </View>

          <Button title="Back to Home" onPress={handleDone} fullWidth />
          <Button
            title="Try Again"
            variant="outline"
            onPress={() => {
              reset();
              router.replace('/mock-test');
            }}
            fullWidth
          />
        </View>
      </SafeAreaView>

      <RateAppModal
        visible={showRatePrompt}
        onNever={handleRateAppNever}
        onLater={handleRateAppLater}
        onRateNow={handleRateAppRateNow}
      />
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
  resultCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
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
  statsCard: {
    alignSelf: 'stretch',
    padding: Spacing.four,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    gap: Spacing.three,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontFamily: Fonts.displayBold,
  },
});
