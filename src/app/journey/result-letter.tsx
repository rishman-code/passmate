import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { NumberStepper } from '@/components/number-stepper';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { DVSA_CATEGORIES, type DVSACategory } from '@/constants/categories';
import { BorderRadius, Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useJourneyStore } from '@/stores/journey-store';
import type { TestResult } from '@/types/journey';
import { todayInLondon } from '@/utils/journey-dates';

const MCQ_PASS_MARK = 43;
const MCQ_MAX = 50;
const HP_PASS_MARK = 44;
const HP_MAX = 75;

function parseScore(text: string, max: number): number | null {
  const digitsOnly = text.replace(/[^0-9]/g, '');
  if (digitsOnly === '') return null;
  return Math.min(max, parseInt(digitsOnly, 10));
}

function parseClipScores(text: string): number[] | null {
  const scores = text
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .map((s) => parseInt(s, 10))
    .filter((n) => Number.isFinite(n));
  return scores.length > 0 ? scores : null;
}

export default function ResultLetterScreen() {
  const theme = useTheme();
  const recordTestResult = useJourneyStore((s) => s.recordTestResult);

  const [mcqText, setMcqText] = useState('');
  const [hpText, setHpText] = useState('');
  const [clipText, setClipText] = useState('');
  const [topicErrors, setTopicErrors] = useState<Partial<Record<DVSACategory, number>>>({});

  const mcqScore = parseScore(mcqText, MCQ_MAX);
  const hpScore = parseScore(hpText, HP_MAX);
  const canSave = mcqScore !== null && hpScore !== null;

  const close = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  const handleSave = () => {
    if (mcqScore === null || hpScore === null) return;

    const result: TestResult = {
      attemptDate: todayInLondon(),
      mcqScore,
      hpScore,
      topicErrors,
      clipScores: parseClipScores(clipText),
      source: 'manual',
      outcome: mcqScore >= MCQ_PASS_MARK && hpScore >= HP_PASS_MARK ? 'pass' : 'fail',
    };

    recordTestResult(result);
    close();
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <ThemedText type="title">Your result letter</ThemedText>
            <Pressable onPress={close} hitSlop={12} testID="result-letter-close-button">
              <Ionicons name="close" size={24} color={theme.text} />
            </Pressable>
          </View>

          <ThemedText themeColor="textSecondary">
            Enter what's on your letter and we'll build a plan around it.
          </ThemedText>

          <View
            style={[styles.honestyBox, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            <ThemedText type="small" themeColor="textSecondary">
              Your letter shows the topics, not the exact questions — so we've weighted your plan
              towards those areas.
            </ThemedText>
          </View>

          <View style={styles.scoreRow}>
            <View style={styles.scoreField}>
              <ThemedText type="caption" themeColor="textSecondary">
                Multiple choice (out of {MCQ_MAX})
              </ThemedText>
              <TextInput
                value={mcqText}
                onChangeText={setMcqText}
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor={theme.textSecondary}
                style={[styles.input, { backgroundColor: theme.card, borderColor: theme.borderHard, color: theme.text }]}
                testID="result-letter-mcq-input"
              />
            </View>
            <View style={styles.scoreField}>
              <ThemedText type="caption" themeColor="textSecondary">
                Hazard perception (out of {HP_MAX})
              </ThemedText>
              <TextInput
                value={hpText}
                onChangeText={setHpText}
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor={theme.textSecondary}
                style={[styles.input, { backgroundColor: theme.card, borderColor: theme.borderHard, color: theme.text }]}
                testID="result-letter-hp-input"
              />
            </View>
          </View>

          <View style={styles.section}>
            <ThemedText type="caption" themeColor="textSecondary">
              Topic errors (from your letter, leave at 0 if none)
            </ThemedText>
            <View style={[styles.topicsCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
              {DVSA_CATEGORIES.map((category) => (
                <NumberStepper
                  key={category}
                  label={category}
                  value={topicErrors[category] ?? 0}
                  onChange={(value) =>
                    setTopicErrors((prev) => ({ ...prev, [category]: value }))
                  }
                  testID={`result-letter-topic-${category}`}
                />
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <ThemedText type="caption" themeColor="textSecondary">
              Per-clip hazard perception scores (optional)
            </ThemedText>
            <TextInput
              value={clipText}
              onChangeText={setClipText}
              placeholder="e.g. 5, 4, 5, 3, 5"
              placeholderTextColor={theme.textSecondary}
              style={[styles.input, { backgroundColor: theme.card, borderColor: theme.borderHard, color: theme.text }]}
              testID="result-letter-clip-input"
            />
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Button
            title="Save"
            onPress={handleSave}
            disabled={!canSave}
            fullWidth
            testID="result-letter-save-button"
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
  scroll: {
    padding: Spacing.four,
    gap: Spacing.four,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  honestyBox: {
    padding: Spacing.three,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
  },
  scoreRow: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  scoreField: {
    flex: 1,
    gap: Spacing.one,
  },
  input: {
    borderWidth: 2,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.three,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: Fonts.bodyRegular,
  },
  section: {
    gap: Spacing.two,
  },
  topicsCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
  },
  footer: {
    padding: Spacing.four,
  },
});
