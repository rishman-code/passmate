import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ProgressBar } from '@/components/progress-bar';
import { StatCard } from '@/components/stat-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BorderRadius, Fonts, Spacing } from '@/constants/theme';
import { useQuestions } from '@/hooks/use-questions';
import { useTheme } from '@/hooks/use-theme';
import { useProgressStore } from '@/stores/progress-store';

export default function ProgressScreen() {
  const theme = useTheme();
  const { categoryScores, isLoading } = useQuestions();
  const totalAnswered = useProgressStore((s) => s.getTotalAnswered());
  const overallAccuracy = useProgressStore((s) => s.getOverallAccuracy());
  const mockTestResults = useProgressStore((s) => s.mockTestResults);

  if (isLoading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" color={theme.primary} />
      </ThemedView>
    );
  }

  const practisedCategories = categoryScores.filter((s) => s.total_questions > 0);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <ThemedText type="title">Your Progress</ThemedText>

          <View style={styles.statsRow}>
            <StatCard label="Questions" value={String(totalAnswered)} />
            <StatCard
              label="Accuracy"
              value={`${overallAccuracy}%`}
              accentColor={overallAccuracy >= 86 ? theme.success : undefined}
            />
          </View>

          <ThemedText type="h3">Category Breakdown</ThemedText>
          {practisedCategories.length === 0 ? (
            <View style={[styles.empty, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
              <ThemedText themeColor="textSecondary">
                No practice data yet. Complete some questions to see your weak spots.
              </ThemedText>
            </View>
          ) : (
            practisedCategories.map((cat) => (
              <View
                key={cat.category}
                style={[styles.categoryRow, { backgroundColor: theme.card, borderColor: theme.borderHard }]}>
                <View style={styles.categoryHeader}>
                  <ThemedText style={styles.categoryName}>{cat.category}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {cat.correct_answers}/{cat.total_questions}
                  </ThemedText>
                </View>
                <ProgressBar
                  progress={cat.accuracy_percentage}
                  color={
                    cat.accuracy_percentage >= 86
                      ? theme.success
                      : cat.accuracy_percentage >= 70
                        ? theme.warning
                        : theme.error
                  }
                />
              </View>
            ))
          )}

          {mockTestResults.length > 0 ? (
            <>
              <ThemedText type="h3">Mock Test History</ThemedText>
              {mockTestResults.slice(0, 5).map((result) => (
                <View
                  key={result.id}
                  style={[styles.mockResult, { backgroundColor: theme.card, borderColor: theme.borderHard }]}>
                  <ThemedText style={styles.mockScore}>
                    {result.score}/{result.total_questions}
                  </ThemedText>
                  <View>
                    <ThemedText
                      style={[
                        styles.mockStatus,
                        { color: result.passed ? theme.success : theme.error },
                      ]}>
                      {result.passed ? 'Passed' : 'Failed'}
                    </ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {new Date(result.completed_at).toLocaleDateString('en-GB')}
                    </ThemedText>
                  </View>
                </View>
              ))}
            </>
          ) : null}
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
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  empty: {
    padding: Spacing.four,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  categoryRow: {
    padding: Spacing.three,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    gap: Spacing.two,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryName: {
    fontSize: 15,
    fontFamily: Fonts.bodyBold,
    flex: 1,
  },
  mockResult: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
  },
  mockScore: {
    fontSize: 24,
    fontFamily: Fonts.displayBold,
    width: 80,
  },
  mockStatus: {
    fontFamily: Fonts.bodyBold,
    fontSize: 15,
  },
});
