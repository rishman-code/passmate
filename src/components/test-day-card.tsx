import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MOCK_TEST_PASS_SCORE, MOCK_TEST_QUESTION_COUNT } from '@/constants/categories';
import { BorderRadius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const HP_PASS_MARK = 44;
const HP_MAX = 75;

const BRING_ITEMS = ['Your photocard driving licence', 'Your test confirmation'];

export function TestDayScreen() {
  const theme = useTheme();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.content} testID="test-day-screen">
          <ThemedText type="title">Today's the day</ThemedText>
          <ThemedText themeColor="textSecondary">Here's what you need to know.</ThemedText>

          <View style={styles.section}>
            <ThemedText type="caption" themeColor="textSecondary">
              Bring with you
            </ThemedText>
            {BRING_ITEMS.map((item) => (
              <View key={item} style={styles.itemRow}>
                <Ionicons name="checkmark-circle-outline" size={20} color={theme.text} />
                <ThemedText>{item}</ThemedText>
              </View>
            ))}
          </View>

          <View
            style={[
              styles.passMarksCard,
              { backgroundColor: theme.backgroundElement, borderColor: theme.border },
            ]}>
            <ThemedText type="caption" themeColor="textSecondary">
              Pass marks — both must be passed
            </ThemedText>
            <View style={styles.row}>
              <ThemedText style={styles.passMarkLabel}>Multiple choice</ThemedText>
              <ThemedText type="smallBold">
                {MOCK_TEST_PASS_SCORE}/{MOCK_TEST_QUESTION_COUNT}
              </ThemedText>
            </View>
            <View style={styles.row}>
              <ThemedText style={styles.passMarkLabel}>Hazard perception</ThemedText>
              <ThemedText type="smallBold">
                {HP_PASS_MARK}/{HP_MAX}
              </ThemedText>
            </View>
          </View>

          <ThemedText type="small" themeColor="textSecondary">
            Good luck.
          </ThemedText>
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
  content: {
    flex: 1,
    padding: Spacing.four,
    gap: Spacing.four,
  },
  section: {
    gap: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  passMarksCard: {
    padding: Spacing.three,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    gap: Spacing.two,
  },
  passMarkLabel: {
    fontSize: 15,
  },
});
