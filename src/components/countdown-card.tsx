import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { BorderRadius, Fonts, Spacing, tactileShadow } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { MockTestResult } from '@/types/database';
import type { JourneyState, LocalDate } from '@/types/journey';
import { daysUntil } from '@/utils/journey-dates';
import { computeReadiness, type ReadinessVerdict } from '@/utils/readiness';
import { sessionShapeForDaysRemaining } from '@/utils/session-shape';

interface CountdownCardProps {
  state: Extract<JourneyState, 'preparing' | 'booked'>;
  testDate: LocalDate | null;
  mockTestResults: Pick<MockTestResult, 'score'>[];
  overallAccuracy: number;
  weakestCategory: string | null;
}

const VERDICT_COLOR_KEY: Record<ReadinessVerdict, 'success' | 'warning' | 'error'> = {
  ready: 'success',
  close: 'warning',
  'not-ready': 'error',
};

export function CountdownCard({
  state,
  testDate,
  mockTestResults,
  overallAccuracy,
  weakestCategory,
}: CountdownCardProps) {
  const theme = useTheme();
  const daysRemaining = testDate ? daysUntil(testDate) : null;
  const sessionShape = sessionShapeForDaysRemaining(daysRemaining);
  const readiness = computeReadiness(mockTestResults, overallAccuracy, weakestCategory);
  const verdictColor = theme[VERDICT_COLOR_KEY[readiness.verdict]];

  const showBookPrompt = state === 'preparing' && readiness.verdict === 'ready';
  const showRescheduleNudge = state === 'booked' && daysRemaining !== null && daysRemaining < 7 && readiness.verdict === 'not-ready';

  return (
    <View
      style={[styles.card, { backgroundColor: theme.card, borderColor: theme.borderHard, ...tactileShadow(theme.borderHard, 4) }]}
      testID="countdown-card">
      <ThemedText type="h3">
        {daysRemaining === null
          ? 'No test booked yet'
          : `${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'} until your test`}
      </ThemedText>
      <ThemedText themeColor="textSecondary">{sessionShape.headline}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {sessionShape.detail}
      </ThemedText>

      <View style={[styles.divider, { backgroundColor: theme.border }]} />

      <ThemedText type="caption" themeColor="textSecondary">
        Readiness
      </ThemedText>
      <ThemedText style={[styles.readinessMessage, { color: verdictColor }]} testID="countdown-card-readiness-message">
        {readiness.message}
      </ThemedText>

      {showBookPrompt ? (
        <Button
          title="Book your test"
          onPress={() => router.push('/journey/setup')}
          fullWidth
          testID="countdown-card-book-button"
        />
      ) : null}

      {showRescheduleNudge ? (
        <>
          <ThemedText type="small" themeColor="textSecondary">
            Moving your test is an option if you'd rather have more time.
          </ThemedText>
          <Button
            title="Change your test date"
            variant="outline"
            onPress={() => router.push('/journey/setup')}
            fullWidth
            testID="countdown-card-reschedule-button"
          />
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.four,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    gap: Spacing.two,
  },
  divider: {
    height: 1,
    marginVertical: Spacing.one,
  },
  readinessMessage: {
    fontSize: 15,
    fontFamily: Fonts.bodyBold,
    lineHeight: 21,
  },
});
