import { StyleSheet, View } from 'react-native';

import { BorderRadius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';

interface ProgressBarProps {
  progress: number;
  label?: string;
  color?: string;
}

export function ProgressBar({ progress, label, color }: ProgressBarProps) {
  const theme = useTheme();
  const clamped = Math.min(100, Math.max(0, progress));
  const fillColor = color ?? theme.primary;

  return (
    <View style={styles.container}>
      {label ? (
        <View style={styles.labelRow}>
          <ThemedText type="small">{label}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {clamped}%
          </ThemedText>
        </View>
      ) : null}
      <View style={[styles.track, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        <View
          style={[
            styles.fill,
            {
              width: `${clamped}%`,
              backgroundColor: fillColor,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  track: {
    height: 10,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: BorderRadius.full,
  },
});
