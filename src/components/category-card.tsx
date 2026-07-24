import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { BorderRadius, Fonts, Spacing, tactileShadow } from '@/constants/theme';
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
      testID={`category-card-${category}`}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: theme.card,
          borderColor: theme.borderHard,
          transform: [{ translateY: pressed ? 2 : 0 }],
          ...(pressed ? {} : tactileShadow(theme.borderHard, 3)),
        },
      ]}>
      <View style={[styles.iconBadge, { backgroundColor: theme.backgroundSelected }]}>
        <Ionicons name={iconName} size={20} color={theme.primary} />
      </View>
      <ThemedText style={styles.title} numberOfLines={2}>
        {category}
      </ThemedText>
      {questionsAnswered > 0 ? (
        <ProgressBar progress={accuracy} />
      ) : (
        <ThemedText type="caption" themeColor="textSecondary">
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
    borderWidth: 2,
    gap: Spacing.two,
    flex: 1,
    minWidth: '45%',
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 14,
    fontFamily: Fonts.bodyBold,
    minHeight: 36,
  },
});
