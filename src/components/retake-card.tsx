import { router } from 'expo-router';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { BorderRadius, Fonts, Spacing, tactileShadow } from '@/constants/theme';
import { useBankHolidayDates } from '@/hooks/use-bank-holidays';
import { useTheme } from '@/hooks/use-theme';
import type { CategoryScore } from '@/types/database';
import type { TestResult } from '@/types/journey';
import { earliestRetakeDate, formatLocalDateLong } from '@/utils/journey-dates';
import { buildRetakePlan, isHazardPerceptionWeighted } from '@/utils/retake-plan';

const BOOKING_URL = 'https://www.gov.uk/book-theory-test';

interface RetakeCardProps {
  lastResult: TestResult | null;
  categoryScores: CategoryScore[];
  onPracticeTopic: (category: string) => void;
}

export function RetakeCard({ lastResult, categoryScores, onPracticeTopic }: RetakeCardProps) {
  const theme = useTheme();
  const { dates: bankHolidays, isLoading: holidaysLoading } = useBankHolidayDates();
  const cardStyle = [
    styles.card,
    { backgroundColor: theme.card, borderColor: theme.borderHard, ...tactileShadow(theme.borderHard, 4) },
  ];

  if (!lastResult) {
    return (
      <View style={cardStyle} testID="retake-card-log-prompt">
        <ThemedText type="h3">Log your result</ThemedText>
        <ThemedText themeColor="textSecondary">
          Enter what your result letter says so we can build your retake plan.
        </ThemedText>
        <Button
          title="Log Result"
          onPress={() => router.push('/journey/result-letter')}
          fullWidth
          testID="retake-card-log-button"
        />
      </View>
    );
  }

  const plan = buildRetakePlan(lastResult, categoryScores);
  const topPriorities = plan.slice(0, 3);
  const hpWeighted = isHazardPerceptionWeighted(lastResult);
  const retestDate = earliestRetakeDate(lastResult.attemptDate, bankHolidays);

  return (
    <View style={cardStyle} testID="retake-card-plan">
      <ThemedText type="h3" testID="retake-card-countdown">
        {holidaysLoading ? 'Working out your earliest retest date…' : `You can retest from ${formatLocalDateLong(retestDate)}`}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        DVSA requires 3 clear working days after a fail before you can sit the test again. This
        assumes England &amp; Wales bank holidays — testing in Northern Ireland runs on DVA's own
        system, so check your specific rebooking rules there.
      </ThemedText>
      <Pressable onPress={() => Linking.openURL(BOOKING_URL)} testID="retake-card-booking-link">
        <ThemedText type="linkPrimary">Book on GOV.UK</ThemedText>
      </Pressable>

      <View style={[styles.divider, { backgroundColor: theme.border }]} />

      <ThemedText type="h3">Your retake plan</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        Your letter shows the topics, not the exact questions — so we've weighted your plan
        towards those areas.
      </ThemedText>
      {hpWeighted ? (
        <ThemedText type="small" style={{ color: theme.warning }}>
          Your hazard perception score was below the pass mark, so hazard awareness questions are
          prioritised too.
        </ThemedText>
      ) : null}
      <View style={styles.topics}>
        {topPriorities.map((topic) => (
          <View key={topic.category} style={[styles.topicRow, { borderColor: theme.border }]}>
            <ThemedText style={styles.topicLabel}>{topic.category}</ThemedText>
            {topic.errorCount > 0 ? (
              <ThemedText type="small" themeColor="textSecondary">
                {topic.errorCount} on your letter
              </ThemedText>
            ) : null}
          </View>
        ))}
      </View>
      <Button
        title={`Practise ${topPriorities[0].category}`}
        onPress={() => onPracticeTopic(topPriorities[0].category)}
        fullWidth
        testID="retake-card-practice-button"
      />
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
  topics: {
    gap: Spacing.one,
  },
  topicRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.one,
    borderBottomWidth: 1,
  },
  topicLabel: {
    fontSize: 15,
    fontFamily: Fonts.bodyBold,
  },
});
