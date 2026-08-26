import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { DVSA_CATEGORIES, type DVSACategory } from '@/constants/categories';
import { BorderRadius, Fonts, Spacing, tactileShadow } from '@/constants/theme';
import { useQuestions } from '@/hooks/use-questions';
import { useTheme } from '@/hooks/use-theme';
import { useMistakeLedgerStore } from '@/stores/mistake-ledger-store';
import { usePracticeStore } from '@/stores/practice-store';
import { useProgressStore } from '@/stores/progress-store';
import { buildMistakeLedger, type MistakeReason } from '@/utils/mistake-ledger';

const REASON_LABELS: Record<MistakeReason, string> = {
  wrong: 'Wrong',
  flagged: 'Flagged',
  both: 'Wrong & flagged',
};

export default function MistakeLedgerScreen() {
  const theme = useTheme();
  const { questions, isLoading } = useQuestions();
  const progress = useProgressStore((s) => s.progress);
  const flaggedIds = useMistakeLedgerStore((s) => s.flaggedIds);
  const setQuestions = usePracticeStore((s) => s.setQuestions);
  const setCategoryFilter = usePracticeStore((s) => s.setCategoryFilter);
  const [categoryFilter, setLocalCategoryFilter] = useState<DVSACategory | null>(null);

  const entries = useMemo(
    () => buildMistakeLedger(questions, progress, flaggedIds, categoryFilter),
    [questions, progress, flaggedIds, categoryFilter],
  );

  const categoriesWithEntries = useMemo(() => {
    const all = buildMistakeLedger(questions, progress, flaggedIds);
    return new Set(all.map((entry) => entry.question.category));
  }, [questions, progress, flaggedIds]);

  const handlePracticeThese = () => {
    setCategoryFilter(categoryFilter);
    setQuestions(entries.map((entry) => entry.question));
    router.push('/practice/session');
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
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
          testID="mistake-ledger-filter-row">
          <Pressable
            onPress={() => setLocalCategoryFilter(null)}
            testID="mistake-ledger-filter-all"
            style={[
              styles.filterChip,
              {
                backgroundColor: categoryFilter === null ? theme.primary : theme.backgroundElement,
                borderColor: theme.borderHard,
              },
            ]}>
            <ThemedText type="small" style={{ color: categoryFilter === null ? '#FFFFFF' : theme.text }}>
              All
            </ThemedText>
          </Pressable>
          {DVSA_CATEGORIES.filter((category) => categoriesWithEntries.has(category)).map((category) => (
            <Pressable
              key={category}
              onPress={() => setLocalCategoryFilter(category)}
              testID={`mistake-ledger-filter-${category}`}
              style={[
                styles.filterChip,
                {
                  backgroundColor: categoryFilter === category ? theme.primary : theme.backgroundElement,
                  borderColor: theme.borderHard,
                },
              ]}>
              <ThemedText type="small" style={{ color: categoryFilter === category ? '#FFFFFF' : theme.text }}>
                {category}
              </ThemedText>
            </Pressable>
          ))}
        </ScrollView>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {entries.length === 0 ? (
            <View
              style={[styles.empty, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
              testID="mistake-ledger-empty">
              <ThemedText themeColor="textSecondary">
                No mistakes yet. Answer some questions and we'll help you review them here.
              </ThemedText>
            </View>
          ) : (
            entries.map((entry) => (
              <View
                key={entry.question.id}
                style={[styles.entry, { backgroundColor: theme.card, borderColor: theme.borderHard, ...tactileShadow(theme.borderHard, 3) }]}
                testID={`mistake-ledger-entry-${entry.question.id}`}>
                <View style={styles.entryHeader}>
                  <View style={[styles.categoryChip, { backgroundColor: theme.backgroundSelected }]}>
                    <ThemedText type="caption" style={{ color: theme.primary }}>
                      {entry.question.category}
                    </ThemedText>
                  </View>
                  <View
                    style={[
                      styles.reasonChip,
                      { backgroundColor: entry.reason === 'wrong' ? theme.errorLight : theme.warningLight },
                    ]}>
                    <ThemedText
                      type="caption"
                      style={{ color: entry.reason === 'wrong' ? theme.error : theme.warning }}>
                      {REASON_LABELS[entry.reason]}
                    </ThemedText>
                  </View>
                </View>
                <ThemedText style={styles.questionText}>{entry.question.question_text}</ThemedText>
                <View
                  style={[styles.explanationBox, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
                  <ThemedText type="small" themeColor="textSecondary">
                    {entry.question.explanation}
                  </ThemedText>
                </View>
              </View>
            ))
          )}
        </ScrollView>

        {entries.length > 0 ? (
          <View style={styles.footer}>
            <Button
              title="Practise these"
              onPress={handlePracticeThese}
              fullWidth
              testID="mistake-ledger-practice-button"
            />
          </View>
        ) : null}
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
  filterRow: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    gap: Spacing.one,
  },
  filterChip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
  },
  scroll: {
    padding: Spacing.four,
    paddingTop: 0,
    gap: Spacing.three,
  },
  empty: {
    padding: Spacing.four,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  entry: {
    padding: Spacing.three,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    gap: Spacing.two,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryChip: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  reasonChip: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  questionText: {
    fontSize: 16,
    lineHeight: 22,
    fontFamily: Fonts.bodyBold,
  },
  explanationBox: {
    padding: Spacing.two,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  footer: {
    padding: Spacing.four,
    paddingTop: Spacing.two,
  },
});
