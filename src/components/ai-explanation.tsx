import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { BorderRadius, Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';

interface AIExplanationProps {
  explanation: string | null;
  isLoading: boolean;
  isPremium: boolean;
  onUnlock?: () => void;
}

export function AIExplanation({
  explanation,
  isLoading,
  isPremium,
  onUnlock,
}: AIExplanationProps) {
  const theme = useTheme();

  if (!isPremium) {
    return (
      <View
        style={[styles.container, { backgroundColor: theme.premiumLight, borderColor: theme.premium }]}
        testID="ai-explanation-locked">
        <Ionicons name="sparkles" size={20} color={theme.premium} />
        <View style={styles.content}>
          <ThemedText style={[styles.title, { color: theme.premium }]}>AI Explanation</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Unlock premium for personalised explanations when you get a question wrong.
          </ThemedText>
          {onUnlock ? (
            <ThemedText type="linkPrimary" style={{ color: theme.premium }} onPress={onUnlock}>
              Unlock for £5.99
            </ThemedText>
          ) : null}
        </View>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View
        style={[styles.container, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
        testID="ai-explanation-loading">
        <ActivityIndicator color={theme.premium} />
        <ThemedText type="small" themeColor="textSecondary">
          Generating AI explanation...
        </ThemedText>
      </View>
    );
  }

  if (!explanation) {
    return null;
  }

  return (
    <View
      style={[styles.container, { backgroundColor: theme.premiumLight, borderColor: theme.premium }]}
      testID="ai-explanation-content">
      <Ionicons name="sparkles" size={20} color={theme.premium} />
      <View style={styles.content}>
        <ThemedText style={[styles.title, { color: theme.premium }]}>AI Explanation</ThemedText>
        <ThemedText style={styles.body}>{explanation}</ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderLeftWidth: 5,
    alignItems: 'flex-start',
  },
  content: {
    flex: 1,
    gap: Spacing.one,
  },
  title: {
    fontSize: 14,
    fontFamily: Fonts.bodyBold,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: Fonts.bodyRegular,
  },
});
