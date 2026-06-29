import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet } from 'react-native';

import { BorderRadius, Spacing } from '@/constants/theme';
import { CATEGORY_ICONS } from '@/constants/categories';
import type { DVSACategory } from '@/constants/categories';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { ProgressBar } from '@/components/progress-bar';

interface CategoryCardProps {
  category: DVSACategory;
  accuracy?: number;
  questionsAnswered?: number;
  onPress?: () => void;
}

export function CategoryCard({
  category,
  accuracy = 0,
  questionsAnswered = 0,
  onPress,
}: CategoryCardProps) {
  const theme = useTheme();
  const iconName = CATEGORY_ICONS[category];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: theme.card,
          borderColor: theme.border,
          opacity: pressed ? 0.9 : 1,
        },
      ]}>
      <Ionicons name={iconName} size={24} color={theme.primary} />
      <ThemedText style={styles.title} numberOfLines={2}>
        {category}
      </ThemedText>
      {questionsAnswered > 0 ? (
        <ProgressBar progress={accuracy} />
      ) : (
        <ThemedText type="small" themeColor="textSecondary">
          Not started
        </ThemedText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.three,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.two,
    flex: 1,
    minWidth: '45%',
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    minHeight: 40,
  },
});
