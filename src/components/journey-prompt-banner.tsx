import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { BorderRadius, Fonts, Spacing, tactileShadow } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useJourneyStore } from '@/stores/journey-store';

export function JourneyPromptBanner() {
  const theme = useTheme();
  const markPromptSeen = useJourneyStore((s) => s.markPromptSeen);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.backgroundSelected, borderColor: theme.borderHard, ...tactileShadow(theme.borderHard, 4) },
      ]}
      testID="journey-prompt-banner">
      <Pressable onPress={() => markPromptSeen()} hitSlop={12} style={styles.close} testID="journey-prompt-banner-dismiss">
        <Ionicons name="close" size={16} color={theme.textSecondary} />
      </Pressable>
      <ThemedText style={styles.title}>When's your test?</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        Tell us where you're at and we'll shape your revision around it.
      </ThemedText>
      <Pressable
        onPress={() => router.push('/journey/setup')}
        testID="journey-prompt-banner-cta"
        style={[styles.cta, { backgroundColor: theme.primary }]}>
        <ThemedText type="smallBold" style={{ color: '#FFFFFF' }}>
          Set it up
        </ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.three,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    gap: Spacing.one,
  },
  close: {
    position: 'absolute',
    top: Spacing.two,
    right: Spacing.two,
  },
  title: {
    fontSize: 16,
    fontFamily: Fonts.bodyBold,
    paddingRight: Spacing.four,
  },
  cta: {
    alignSelf: 'flex-start',
    marginTop: Spacing.one,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: BorderRadius.full,
  },
});
