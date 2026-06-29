import { StyleSheet, View } from 'react-native';

import { BorderRadius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { formatTime } from '@/utils/practice';

interface TimerProps {
  seconds: number;
  warningThreshold?: number;
}

export function Timer({ seconds, warningThreshold = 300 }: TimerProps) {
  const theme = useTheme();
  const isWarning = seconds <= warningThreshold;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isWarning ? theme.errorLight : theme.backgroundElement,
          borderColor: isWarning ? theme.error : theme.border,
        },
      ]}>
      <ThemedText
        style={[styles.time, { color: isWarning ? theme.error : theme.text }]}>
        {formatTime(seconds)}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  time: {
    fontSize: 18,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
});
