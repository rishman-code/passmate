import { StyleSheet, View } from 'react-native';

import { BorderRadius, Fonts, Spacing, tactileShadow } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';

interface StatCardProps {
  label: string;
  value: string;
  subtitle?: string;
  accentColor?: string;
}

export function StatCard({ label, value, subtitle, accentColor }: StatCardProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.card,
          borderColor: theme.borderHard,
          ...tactileShadow(theme.borderHard, 3),
        },
      ]}>
      <ThemedText type="caption" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText style={[styles.value, { color: accentColor ?? theme.text }]}>{value}</ThemedText>
      {subtitle ? (
        <ThemedText type="small" themeColor="textSecondary">
          {subtitle}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    padding: Spacing.three,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    gap: Spacing.one,
  },
  value: {
    fontSize: 30,
    lineHeight: 36,
    fontFamily: Fonts.displayBold,
    letterSpacing: -0.5,
  },
});
