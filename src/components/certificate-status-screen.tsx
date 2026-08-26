import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BorderRadius, Spacing, tactileShadow } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { LocalDate } from '@/types/journey';
import { formatLocalDateLong, monthsUntil } from '@/utils/journey-dates';

interface CertificateStatusScreenProps {
  expiryDate: LocalDate;
}

function remainingLabel(months: number): string {
  if (months < 1) return 'Less than a month remaining';
  return `${months} ${months === 1 ? 'month' : 'months'} remaining`;
}

export function CertificateStatusScreen({ expiryDate }: CertificateStatusScreenProps) {
  const theme = useTheme();
  const months = monthsUntil(expiryDate);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.content} testID="certificate-status-screen">
          <View
            style={[styles.card, { backgroundColor: theme.card, borderColor: theme.borderHard, ...tactileShadow(theme.borderHard, 4) }]}>
            <View style={[styles.icon, { backgroundColor: theme.successLight }]}>
              <Ionicons name="ribbon-outline" size={22} color={theme.success} />
            </View>
            <ThemedText type="h3">Theory certificate valid until {formatLocalDateLong(expiryDate)}</ThemedText>
            <ThemedText themeColor="textSecondary">{remainingLabel(months)}</ThemedText>
          </View>

          <ThemedText type="small" themeColor="textSecondary" style={styles.footnote}>
            You're all set. We'll let you know here if anything about your certificate needs your
            attention.
          </ThemedText>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: Spacing.four,
    gap: Spacing.four,
    justifyContent: 'center',
  },
  card: {
    padding: Spacing.four,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    gap: Spacing.two,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footnote: {
    textAlign: 'center',
  },
});
