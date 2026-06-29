import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet } from 'react-native';

import { BorderRadius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import type { AnswerOption } from '@/types/database';

interface OptionButtonProps {
  label: string;
  optionKey: AnswerOption;
  selected: boolean;
  correct?: boolean;
  showResult: boolean;
  disabled: boolean;
  onPress: () => void;
}

export function OptionButton({
  label,
  optionKey,
  selected,
  correct,
  showResult,
  disabled,
  onPress,
}: OptionButtonProps) {
  const theme = useTheme();

  let borderColor: string = theme.border;
  let backgroundColor: string = theme.card;

  if (showResult) {
    if (correct) {
      borderColor = theme.success;
      backgroundColor = theme.successLight;
    } else if (selected) {
      borderColor = theme.error;
      backgroundColor = theme.errorLight;
    }
  } else if (selected) {
    borderColor = theme.primary;
    backgroundColor = theme.backgroundElement;
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.option,
        {
          borderColor,
          backgroundColor,
          opacity: pressed && !disabled ? 0.9 : 1,
        },
      ]}>
      <ThemedText style={[styles.optionKey, { color: theme.primary }]}>
        {optionKey.toUpperCase()}
      </ThemedText>
      <ThemedText style={styles.optionText}>{label}</ThemedText>
      {showResult && correct ? (
        <Ionicons name="checkmark-circle" size={22} color={theme.success} />
      ) : null}
      {showResult && selected && !correct ? (
        <Ionicons name="close-circle" size={22} color={theme.error} />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
  },
  optionKey: {
    fontWeight: '700',
    fontSize: 16,
    width: 24,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
  },
});
