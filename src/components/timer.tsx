import { StyleSheet, View } from 'react-native';

import { BorderRadius, Fonts, Spacing } from '@/constants/theme';
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
      testID="mock-test-timer"
      style={[
        styles.container,
        {
          backgroundColor: isWarning ? theme.errorLight : theme.backgroundElement,
          borderColor: isWarning ? theme.error : theme.borderHard,
        },
      ]}>
      <ThemedText type="code" style={[styles.time, { color: isWarning ? theme.error : theme.text }]}>
        {formatTime(seconds)}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: BorderRadius.full,
    borderWidth: 2,
  },
  time: {
    fontSize: 18,
    fontFamily: Fonts.mono,
    fontVariant: ['tabular-nums'],
  },
});
