import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { BorderRadius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface NumberStepperProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  testID?: string;
}

export function NumberStepper({ label, value, onChange, min = 0, max = 99, testID }: NumberStepperProps) {
  const theme = useTheme();

  return (
    <View style={styles.row} testID={testID}>
      <ThemedText style={styles.label}>{label}</ThemedText>
      <View style={styles.controls}>
        <Pressable
          onPress={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          hitSlop={8}
          testID={testID ? `${testID}-decrement` : undefined}
          style={[styles.stepButton, { borderColor: theme.borderHard, opacity: value <= min ? 0.35 : 1 }]}>
          <Ionicons name="remove" size={16} color={theme.text} />
        </Pressable>
        <ThemedText style={styles.value} testID={testID ? `${testID}-value` : undefined}>
          {value}
        </ThemedText>
        <Pressable
          onPress={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          hitSlop={8}
          testID={testID ? `${testID}-increment` : undefined}
          style={[styles.stepButton, { borderColor: theme.borderHard, opacity: value >= max ? 0.35 : 1 }]}>
          <Ionicons name="add" size={16} color={theme.text} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.one,
  },
  label: {
    flex: 1,
    fontSize: 15,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  stepButton: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.sm,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    minWidth: 20,
    textAlign: 'center',
    fontSize: 16,
  },
});
