import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { BorderRadius, Spacing } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import type { Question } from '@/types/database';

interface QuestionCardProps {
  question: Question;
  questionNumber?: number;
  totalQuestions?: number;
}

export function QuestionCard({ question, questionNumber, totalQuestions }: QuestionCardProps) {
  return (
    <View style={styles.container}>
      {questionNumber !== undefined && totalQuestions !== undefined ? (
        <ThemedText type="small" themeColor="textSecondary">
          Question {questionNumber} of {totalQuestions}
        </ThemedText>
      ) : null}
      <ThemedText type="small" themeColor="textSecondary">
        {question.category}
      </ThemedText>
      <ThemedText style={styles.questionText}>{question.question_text}</ThemedText>
      {question.image_url ? (
        <Image source={{ uri: question.image_url }} style={styles.image} contentFit="contain" />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
  },
  questionText: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 28,
  },
  image: {
    width: '100%',
    height: 180,
    borderRadius: BorderRadius.md,
  },
});
