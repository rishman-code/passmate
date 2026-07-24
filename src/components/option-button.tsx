import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet } from 'react-native';

import { BorderRadius, Fonts, Spacing } from '@/constants/theme';
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
  let borderWidth = 1.5;
  let keyBg: string = theme.backgroundElement;
  let keyColor: string = theme.textSecondary;

  if (showResult) {
    if (correct) {
      borderColor = theme.success;
      backgroundColor = theme.successLight;
      borderWidth = 2;
      keyBg = theme.success;
      keyColor = '#FFFFFF';
    } else if (selected) {
      borderColor = theme.error;
      backgroundColor = theme.errorLight;
      borderWidth = 2;
      keyBg = theme.error;
      keyColor = '#FFFFFF';
    }
  } else if (selected) {
    borderColor = theme.primary;
    backgroundColor = theme.backgroundSelected;
    borderWidth = 2;
    keyBg = theme.primary;
    keyColor = '#FFFFFF';
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      testID={`option-button-${optionKey}`}
      style={({ pressed }) => [
        styles.option,
        {
          borderColor,
          backgroundColor,
          borderWidth,
          transform: [{ scale: pressed && !disabled ? 0.98 : 1 }],
        },
      ]}>
      <ThemedText style={[styles.optionKey, { backgroundColor: keyBg, color: keyColor }]}>
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
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: BorderRadius.md,
  },
  optionKey: {
    fontFamily: Fonts.displayBold,
    fontSize: 15,
    width: 28,
    height: 28,
    borderRadius: BorderRadius.sm,
    textAlign: 'center',
    lineHeight: 28,
    overflow: 'hidden',
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
    fontFamily: Fonts.bodyMedium,
  },
});
