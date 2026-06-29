import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AIExplanation } from '@/components/ai-explanation';
import { Button } from '@/components/button';
import { OptionButton } from '@/components/option-button';
import { QuestionCard } from '@/components/question-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BorderRadius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getAIExplanation } from '@/services/ai-explanations';
import { usePracticeStore } from '@/stores/practice-store';
import { useProgressStore } from '@/stores/progress-store';
import { useSubscriptionStore } from '@/stores/subscription-store';
import type { AnswerOption } from '@/types/database';
import { getOptionText } from '@/utils/practice';

const OPTIONS: AnswerOption[] = ['a', 'b', 'c', 'd'];

export default function PracticeSessionScreen() {
  const theme = useTheme();
  const isPremium = useSubscriptionStore((s) => s.isPremium);
  const recordAnswer = useProgressStore((s) => s.recordAnswer);

  const {
    questions,
    currentIndex,
    selectedAnswer,
    showResult,
    correctCount,
    selectAnswer,
    nextQuestion,
  } = usePracticeStore();

  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const recordedRef = useRef<string | null>(null);

  const question = questions[currentIndex] ?? null;
  const isLastQuestion = currentIndex >= questions.length - 1;
  const isComplete = showResult && isLastQuestion;

  useEffect(() => {
    if (!showResult || !question || !selectedAnswer) {
      setAiExplanation(null);
      return;
    }

    const recordKey = `${question.id}-${currentIndex}`;
    if (recordedRef.current !== recordKey) {
      recordedRef.current = recordKey;
      const isCorrect = selectedAnswer === question.correct_answer;
      recordAnswer(question.id, isCorrect);
    }

    const isCorrect = selectedAnswer === question.correct_answer;
    if (!isCorrect) {
      setAiLoading(true);
      const wrongText = getOptionText(question, selectedAnswer);
      getAIExplanation(question, wrongText)
        .then(setAiExplanation)
        .finally(() => setAiLoading(false));
    } else {
      setAiExplanation(null);
      setAiLoading(false);
    }
  }, [showResult, question, selectedAnswer, currentIndex, recordAnswer]);

  if (!question || questions.length === 0) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText>No questions loaded.</ThemedText>
        <Button title="Go Back" onPress={() => router.back()} />
      </ThemedView>
    );
  }

  const handleFinish = () => {
    usePracticeStore.getState().reset();
    router.back();
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="close" size={28} color={theme.text} />
          </Pressable>
          <ThemedText type="small" themeColor="textSecondary">
            {correctCount}/{currentIndex + (showResult ? 1 : 0)} correct
          </ThemedText>
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
                correct={option === question.correct_answer}
                showResult={showResult}
                disabled={showResult}
                onPress={() => selectAnswer(option)}
              />
            ))}
          </View>

          {showResult && selectedAnswer !== question.correct_answer ? (
            <View style={[styles.dvsaBox, { backgroundColor: theme.backgroundElement }]}>
              <ThemedText style={styles.dvsaTitle}>Official Explanation</ThemedText>
              <ThemedText style={styles.dvsaText}>{question.explanation}</ThemedText>
            </View>
          ) : null}

          {showResult && selectedAnswer !== question.correct_answer ? (
            <AIExplanation
              explanation={aiExplanation}
              isLoading={aiLoading}
              isPremium={isPremium}
              onUnlock={() => router.push('/paywall')}
            />
          ) : null}
        </ScrollView>

        <View style={styles.footer}>
          {isComplete ? (
            <Button title="Finish Session" onPress={handleFinish} fullWidth />
          ) : showResult ? (
            <Button title="Next Question" onPress={nextQuestion} fullWidth />
          ) : null}
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
  scroll: {
    padding: Spacing.four,
    gap: Spacing.four,
    paddingBottom: Spacing.six,
  },
  options: {
    gap: Spacing.two,
  },
  dvsaBox: {
    padding: Spacing.three,
    borderRadius: BorderRadius.lg,
    gap: Spacing.one,
  },
  dvsaTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  dvsaText: {
    fontSize: 15,
    lineHeight: 22,
  },
  footer: {
    padding: Spacing.four,
    paddingTop: Spacing.two,
  },
});
