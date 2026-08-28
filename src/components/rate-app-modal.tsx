import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { BorderRadius, Spacing, tactileShadow } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface RateAppModalProps {
  visible: boolean;
  onNever: () => void;
  onLater: () => void;
  onRateNow: () => void;
}

export function RateAppModal({ visible, onNever, onLater, onRateNow }: RateAppModalProps) {
  const theme = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onLater}>
      <View style={styles.backdrop}>
        <View
          style={[
            styles.card,
            { backgroundColor: theme.card, borderColor: theme.borderHard, ...tactileShadow(theme.borderHard, 4) },
          ]}
          testID="rate-app-modal">
          <ThemedText type="h3" style={styles.title}>
            Enjoying GreenLight?
          </ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.body}>
            If GreenLight's helping you get ready for your theory test, a quick rating helps other
            learners find it. It won't take a minute.
          </ThemedText>

          <Button title="Rate Now" onPress={onRateNow} fullWidth testID="rate-app-rate-now" />

          <View style={styles.secondaryActions}>
            <Pressable onPress={onNever} hitSlop={12} testID="rate-app-never">
              <ThemedText type="small" style={{ color: theme.error }}>
                Never
              </ThemedText>
            </Pressable>
            <Pressable onPress={onLater} hitSlop={12} testID="rate-app-later">
              <ThemedText type="small" themeColor="textSecondary">
                Later
              </ThemedText>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.five,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    padding: Spacing.four,
    borderRadius: BorderRadius.xl,
    borderWidth: 2,
    gap: Spacing.three,
    alignItems: 'stretch',
  },
  title: {
    textAlign: 'center',
  },
  body: {
    textAlign: 'center',
    lineHeight: 22,
  },
  secondaryActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.two,
  },
});
