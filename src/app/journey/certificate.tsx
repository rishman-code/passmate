import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { CalendarDatePicker } from '@/components/calendar-date-picker';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BorderRadius, Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { scheduleCertificateExpiryNotifications } from '@/services/certificate-notifications';
import { useJourneyStore } from '@/stores/journey-store';
import type { LocalDate } from '@/types/journey';
import { addYears, certificateExpiryDate, formatLocalDateLong, todayInLondon } from '@/utils/journey-dates';

export default function CertificateScreen() {
  const theme = useTheme();
  const journey = useJourneyStore((s) => s.journey);
  const updateJourney = useJourneyStore((s) => s.updateJourney);

  const today = todayInLondon();
  const minPassDate = addYears(today, -3);

  const [passDate, setPassDate] = useState<LocalDate | null>(
    journey.state === 'certified' ? (journey.certificate?.passDate ?? null) : null,
  );
  const [certificateNumber, setCertificateNumber] = useState(
    journey.state === 'certified' ? (journey.certificate?.certificateNumber ?? '') : '',
  );
  const [isSaving, setIsSaving] = useState(false);

  const expiryDate = passDate ? certificateExpiryDate(passDate) : null;

  const close = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  const handleSave = async () => {
    if (!passDate || !expiryDate) return;

    setIsSaving(true);
    try {
      updateJourney({
        state: 'certified',
        certificate: {
          passDate,
          expiryDate,
          certificateNumber: certificateNumber.trim() || null,
        },
      });
      await scheduleCertificateExpiryNotifications(expiryDate);
    } finally {
      setIsSaving(false);
    }

    close();
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <ThemedText type="title">Your theory certificate</ThemedText>
            <Pressable onPress={close} hitSlop={12} testID="certificate-close-button">
              <Ionicons name="close" size={24} color={theme.text} />
            </Pressable>
          </View>

          <ThemedText themeColor="textSecondary">
            When did you pass? Your certificate is valid for exactly 2 years from that date.
          </ThemedText>

          <View style={styles.pickerSection}>
            <ThemedText type="caption" themeColor="textSecondary">
              Pass date
            </ThemedText>
            <CalendarDatePicker value={passDate} onChange={setPassDate} minDate={minPassDate} maxDate={today} />
          </View>

          {expiryDate ? (
            <View
              style={[styles.expiryBox, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
              testID="certificate-expiry-preview">
              <ThemedText type="smallBold">Valid until {formatLocalDateLong(expiryDate)}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                No extensions are possible, for any reason — plan your practical test around this date.
              </ThemedText>
            </View>
          ) : null}

          <View style={styles.field}>
            <ThemedText type="caption" themeColor="textSecondary">
              Certificate number (optional)
            </ThemedText>
            <TextInput
              value={certificateNumber}
              onChangeText={setCertificateNumber}
              placeholder="From your pass certificate"
              placeholderTextColor={theme.textSecondary}
              style={[styles.input, { backgroundColor: theme.card, borderColor: theme.borderHard, color: theme.text }]}
              testID="certificate-number-input"
            />
          </View>

          <ThemedText type="small" themeColor="textSecondary">
            We'll ask permission to send you a few reminders as your certificate's expiry gets
            closer, so you don't lose track of it.
          </ThemedText>
        </ScrollView>

        <View style={styles.footer}>
          <Button
            title="Save"
            onPress={handleSave}
            disabled={!passDate}
            loading={isSaving}
            fullWidth
            testID="certificate-save-button"
          />
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
  scroll: {
    padding: Spacing.four,
    gap: Spacing.four,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  pickerSection: {
    gap: Spacing.two,
  },
  expiryBox: {
    padding: Spacing.three,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    gap: Spacing.one,
  },
  field: {
    gap: Spacing.one,
  },
  input: {
    borderWidth: 2,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.three,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: Fonts.bodyRegular,
  },
  footer: {
    padding: Spacing.four,
  },
});
