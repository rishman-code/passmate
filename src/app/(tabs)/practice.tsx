import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { CategoryCard } from '@/components/category-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { DVSA_CATEGORIES } from '@/constants/categories';
import { Spacing } from '@/constants/theme';
import { useQuestions } from '@/hooks/use-questions';
import { useTheme } from '@/hooks/use-theme';
import { fetchAllQuestions, fetchQuestionsByCategory } from '@/services/questions';
import { useProgressStore } from '@/stores/progress-store';
import { usePracticeStore } from '@/stores/practice-store';
import type { DVSACategory } from '@/constants/categories';
import { buildAdaptiveQuestionQueue } from '@/utils/practice';

export default function PracticeScreen() {
  const theme = useTheme();
  const { questions, isLoading, categoryScores } = useQuestions();
  const progress = useProgressStore((s) => s.progress);
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

  const startCategoryPractice = async (category: DVSACategory) => {
    setIsStarting(true);
    try {
      const categoryQuestions = await fetchQuestionsByCategory(category);
      const queue = buildAdaptiveQuestionQueue(
        categoryQuestions,
        progress,
        categoryQuestions.length,
      );
      setCategoryFilter(category);
      setQuestions(queue);
      router.push('/practice/session');
    } finally {
      setIsStarting(false);
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
            <ThemedText type="title">Practice</ThemedText>
            <ThemedText themeColor="textSecondary">
              Adaptive mode focuses on questions you struggle with.
            </ThemedText>
          </View>

          <Button
            title="Start Adaptive Practice"
            onPress={startAdaptivePractice}
            loading={isStarting}
            fullWidth
          />

          <ThemedText type="h3">Practice by Category</ThemedText>
          <View style={styles.grid}>
            {DVSA_CATEGORIES.map((category) => {
              const score = categoryScores.find((s) => s.category === category);
              return (
                <CategoryCard
                  key={category}
                  category={category}
                  accuracy={score?.accuracy_percentage ?? 0}
                  questionsAnswered={score?.total_questions ?? 0}
                  onPress={() => startCategoryPractice(category)}
                />
              );
            })}
          </View>
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
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
});
