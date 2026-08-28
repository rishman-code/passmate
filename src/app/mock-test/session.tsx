import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { OptionButton } from '@/components/option-button';
import { QuestionCard } from '@/components/question-card';
import { Timer } from '@/components/timer';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MOCK_TEST_QUESTION_COUNT } from '@/constants/categories';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useMistakeLedgerStore } from '@/stores/mistake-ledger-store';
import { useMockTestStore } from '@/stores/mock-test-store';
import type { AnswerOption } from '@/types/database';
import { getOptionText } from '@/utils/practice';

const OPTIONS: AnswerOption[] = ['a', 'b', 'c', 'd'];

export default function MockTestSessionScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const {
    questions,
    currentIndex,
    selectedAnswer,
    timeRemaining,
    isActive,
    isComplete,
    answers,
    startTest,
    selectAnswer,
    nextQuestion,
    previousQuestion,
    tick,
    finishTest,
  } = useMockTestStore();

  const question = questions[currentIndex] ?? null;
  const toggleFlag = useMistakeLedgerStore((s) => s.toggleFlag);
  const flaggedIds = useMistakeLedgerStore((s) => s.flaggedIds);
  const isFlagged = question ? Boolean(flaggedIds[question.id]) : false;

  useEffect(() => {
    if (!isActive && questions.length > 0) {
      startTest();
    }
  }, [isActive, questions.length, startTest]);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      tick();
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [tick]);

  useEffect(() => {
    if (isComplete) {
      router.replace('/mock-test/results');
    }
  }, [isComplete]);

  const handleSubmit = () => {
    finishTest();
  };

  if (!question) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText>No questions loaded.</ThemedText>
        <Button title="Go Back" onPress={() => router.back()} />
      </ThemedView>
    );
  }

  const answeredCount = answers.length;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <View style={[styles.topBar, { paddingTop: insets.top + Spacing.two }]}>
          <Pressable onPress={previousQuestion} disabled={currentIndex === 0} hitSlop={12}>
            <Ionicons
              name="chevron-back"
              size={28}
              color={currentIndex === 0 ? theme.textSecondary : theme.text}
            />
          </Pressable>
          <Timer seconds={timeRemaining} />
          <View style={styles.topBarRight}>
            <Pressable
              onPress={() => toggleFlag(question.id)}
              hitSlop={12}
              testID="mock-test-session-flag-button">
              <Ionicons
                name={isFlagged ? 'flag' : 'flag-outline'}
                size={22}
                color={isFlagged ? theme.warning : theme.text}
              />
            </Pressable>
            <ThemedText type="small" themeColor="textSecondary">
              {currentIndex + 1}/{questions.length}
            </ThemedText>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <QuestionCard
            question={question}
            questionNumber={currentIndex + 1}
            totalQuestions={questions.length}
          />

          <View style={styles.options}>
            {OPTIONS.map((option) => (
              <OptionButton
                key={option}
                optionKey={option}
                label={getOptionText(question, option)}
                selected={selectedAnswer === option}
                showResult={false}
                disabled={false}
                onPress={() => selectAnswer(option)}
              />
            ))}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <ThemedText type="small" themeColor="textSecondary" style={styles.answered}>
            {answeredCount}/{MOCK_TEST_QUESTION_COUNT} answered
          </ThemedText>
          <View style={styles.footerButtons}>
            <Button
              title="Previous"
              variant="outline"
              onPress={previousQuestion}
              disabled={currentIndex === 0}
              style={styles.footerBtn}
              testID="mock-test-session-previous-button"
            />
            {currentIndex < questions.length - 1 ? (
              <Button title="Next" onPress={nextQuestion} disabled={!selectedAnswer} style={styles.footerBtn} />
            ) : (
              <Button title="Submit Test" onPress={handleSubmit} disabled={!selectedAnswer} style={styles.footerBtn} />
            )}
          </View>
        </View>
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
    gap: Spacing.three,
    padding: Spacing.four,
  },
  safeArea: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  scroll: {
    padding: Spacing.four,
    gap: Spacing.four,
    paddingBottom: Spacing.six,
  },
  options: {
    gap: Spacing.two,
  },
  footer: {
    padding: Spacing.four,
    paddingTop: Spacing.two,
    gap: Spacing.two,
  },
  answered: {
    textAlign: 'center',
  },
  footerButtons: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  footerBtn: {
    flex: 1,
  },
});
