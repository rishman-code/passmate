import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { BorderRadius, Fonts, Spacing } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import type { Question } from '@/types/database';

interface QuestionCardProps {
  question: Question;
  questionNumber?: number;
  totalQuestions?: number;
}

export function QuestionCard({ question, questionNumber, totalQuestions }: QuestionCardProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.metaRow}>
        {questionNumber !== undefined && totalQuestions !== undefined ? (
          <ThemedText type="code" themeColor="textSecondary">
            {questionNumber} / {totalQuestions}
          </ThemedText>
        ) : null}
        <View style={[styles.categoryChip, { backgroundColor: theme.backgroundSelected }]}>
          <ThemedText type="caption" style={{ color: theme.primary }}>
            {question.category}
          </ThemedText>
        </View>
      </View>
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
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryChip: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  questionText: {
    fontSize: 22,
    fontFamily: Fonts.displaySemiBold,
    lineHeight: 29,
  },
  image: {
    width: '100%',
    height: 180,
    borderRadius: BorderRadius.md,
  },
});
