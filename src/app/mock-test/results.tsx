import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MOCK_TEST_PASS_SCORE, MOCK_TEST_QUESTION_COUNT } from '@/constants/categories';
import { BorderRadius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useMockTestStore } from '@/stores/mock-test-store';
import { useProgressStore } from '@/stores/progress-store';
import { formatTime } from '@/utils/practice';

export default function MockTestResultsScreen() {
  const theme = useTheme();
  const recordMockTestResult = useProgressStore((s) => s.recordMockTestResult);
  const reset = useMockTestStore((s) => s.reset);

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
    }
  }, [score, passed, timeTaken, recordMockTestResult]);

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
              { backgroundColor: passed ? theme.successLight : theme.errorLight },
            ]}>
            <Ionicons
              name={passed ? 'checkmark-circle' : 'close-circle'}
              size={64}
              color={passed ? theme.success : theme.error}
            />
          </View>

          <ThemedText style={styles.title}>{passed ? 'You Passed!' : 'Not Quite'}</ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.subtitle}>
            {passed
              ? 'Great work — you met the DVSA pass mark.'
              : `You need ${MOCK_TEST_PASS_SCORE} correct answers to pass.`}
          </ThemedText>

          <View style={[styles.statsCard, { backgroundColor: theme.backgroundElement }]}>
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    lineHeight: 22,
  },
  statsCard: {
    alignSelf: 'stretch',
    padding: Spacing.four,
    borderRadius: BorderRadius.lg,
    gap: Spacing.three,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
  },
});
