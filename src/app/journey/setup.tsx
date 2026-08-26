import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { TestDatePicker } from '@/components/test-date-picker';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BorderRadius, Fonts, Spacing, tactileShadow } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useJourneyStore } from '@/stores/journey-store';
import type { JourneyState, LocalDate } from '@/types/journey';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface JourneyOption {
  state: JourneyState;
  icon: IoniconName;
  title: string;
  body: string;
}

const OPTIONS: JourneyOption[] = [
  {
    state: 'booked',
    icon: 'calendar-outline',
    title: "I've booked a date",
    body: 'Pick your test date and we\'ll shape your revision around it.',
  },
  {
    state: 'preparing',
    icon: 'time-outline',
    title: "I haven't booked yet",
    body: 'Steady, well-rounded practice across every topic.',
  },
  {
    state: 'retake',
    icon: 'refresh-outline',
    title: "I failed and I'm retaking",
    body: "We'll build a plan from what your result letter says.",
  },
  {
    state: 'certified',
    icon: 'ribbon-outline',
    title: "I've already passed theory",
    body: "We'll just keep an eye on your certificate's expiry.",
  },
];

export default function JourneySetupScreen() {
  const theme = useTheme();
  const journey = useJourneyStore((s) => s.journey);
  const updateJourney = useJourneyStore((s) => s.updateJourney);
  const markPromptSeen = useJourneyStore((s) => s.markPromptSeen);

  const [selectedState, setSelectedState] = useState<JourneyState | null>(journey.state);
  const [pickedDate, setPickedDate] = useState<LocalDate | null>(
    journey.state === 'booked' ? journey.testDate : null,
  );

  const canSave = selectedState !== null && (selectedState !== 'booked' || pickedDate !== null);

  const close = () => {
    markPromptSeen();
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  const handleSave = () => {
    if (!selectedState) return;

    updateJourney({
      state: selectedState,
      testDate: selectedState === 'booked' ? pickedDate : null,
    });
    close();
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <ThemedText type="title">When's your test?</ThemedText>
            <Pressable onPress={close} hitSlop={12} testID="journey-setup-close-button">
              <Ionicons name="close" size={24} color={theme.text} />
            </Pressable>
          </View>

          <View style={styles.options}>
            {OPTIONS.map((option) => {
              const selected = selectedState === option.state;
              return (
                <Pressable
                  key={option.state}
                  onPress={() => {
                    setSelectedState(option.state);
                    if (option.state !== 'booked') {
                      setPickedDate(null);
                    }
                  }}
                  testID={`journey-setup-option-${option.state}`}
                  style={[
                    styles.optionCard,
                    {
                      backgroundColor: selected ? theme.backgroundSelected : theme.card,
                      borderColor: selected ? theme.primary : theme.borderHard,
                      ...tactileShadow(theme.borderHard, selected ? 2 : 4),
                    },
                  ]}>
                  <View
                    style={[
                      styles.optionIcon,
                      { backgroundColor: selected ? theme.primary : theme.backgroundElement },
                    ]}>
                    <Ionicons name={option.icon} size={20} color={selected ? '#FFFFFF' : theme.text} />
                  </View>
                  <View style={styles.optionText}>
                    <ThemedText style={styles.optionTitle}>{option.title}</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {option.body}
                    </ThemedText>
                  </View>
                </Pressable>
              );
            })}
          </View>

          {selectedState === 'booked' ? (
            <View style={styles.pickerSection}>
              <ThemedText type="caption" themeColor="textSecondary">
                Test date
              </ThemedText>
              <TestDatePicker value={pickedDate} onChange={setPickedDate} />
            </View>
          ) : null}
        </ScrollView>

        <View style={styles.footer}>
          <Button
            title="Save"
            onPress={handleSave}
            disabled={!canSave}
            fullWidth
            testID="journey-setup-save-button"
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
  options: {
    gap: Spacing.three,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: {
    flex: 1,
    gap: 2,
  },
  optionTitle: {
    fontSize: 16,
    fontFamily: Fonts.bodyBold,
  },
  pickerSection: {
    gap: Spacing.two,
  },
  footer: {
    padding: Spacing.four,
  },
});
