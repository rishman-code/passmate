import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { BorderRadius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { LocalDate } from '@/types/journey';
import { addYears, compareLocalDates, todayInLondon } from '@/utils/journey-dates';

const MONTHS_AHEAD = 13;

interface MonthOption {
  label: string;
  year: number;
  month: number;
}

function buildMonthOptions(from: LocalDate, count: number): MonthOption[] {
  const [startYear, startMonth] = from.split('-').map(Number);
  const options: MonthOption[] = [];

  for (let i = 0; i < count; i += 1) {
    const totalMonth = startMonth - 1 + i;
    const year = startYear + Math.floor(totalMonth / 12);
    const month = (totalMonth % 12) + 1;
    const label = new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString('en-GB', {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    });
    options.push({ label, year, month });
  }

  return options;
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function monthKey(date: LocalDate): string {
  return date.slice(0, 7);
}

interface TestDatePickerProps {
  value: LocalDate | null;
  onChange: (date: LocalDate) => void;
}

export function TestDatePicker({ value, onChange }: TestDatePickerProps) {
  const theme = useTheme();
  const today = useMemo(() => todayInLondon(), []);
  const maxDate = useMemo(() => addYears(today, 1), [today]);
  const monthOptions = useMemo(() => buildMonthOptions(today, MONTHS_AHEAD), [today]);

  const [selectedMonthIndex, setSelectedMonthIndex] = useState(() => {
    if (!value) return 0;
    const idx = monthOptions.findIndex((m) => `${m.year}-${String(m.month).padStart(2, '0')}` === monthKey(value));
    return idx >= 0 ? idx : 0;
  });

  const selectedMonth = monthOptions[selectedMonthIndex];
  const dayCells = useMemo(
    () => Array.from({ length: daysInMonth(selectedMonth.year, selectedMonth.month) }, (_, i) => i + 1),
    [selectedMonth],
  );

  const dateFor = (day: number): LocalDate =>
    `${selectedMonth.year}-${String(selectedMonth.month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  return (
    <View style={styles.container} testID="test-date-picker">
      <View style={styles.monthRow}>
        {monthOptions.map((m, idx) => (
          <Pressable
            key={`${m.year}-${m.month}`}
            onPress={() => setSelectedMonthIndex(idx)}
            testID={`test-date-picker-month-${idx}`}
            style={[
              styles.monthChip,
              {
                backgroundColor: idx === selectedMonthIndex ? theme.primary : theme.backgroundElement,
                borderColor: theme.borderHard,
              },
            ]}>
            <ThemedText type="small" style={{ color: idx === selectedMonthIndex ? '#FFFFFF' : theme.text }}>
              {m.label}
            </ThemedText>
          </Pressable>
        ))}
      </View>

      <View style={styles.dayGrid}>
        {dayCells.map((day) => {
          const date = dateFor(day);
          const disabled = compareLocalDates(date, today) < 0 || compareLocalDates(date, maxDate) > 0;
          const selected = value === date;
          return (
            <Pressable
              key={date}
              disabled={disabled}
              onPress={() => onChange(date)}
              testID={`test-date-picker-day-${date}`}
              style={[
                styles.dayCell,
                {
                  backgroundColor: selected ? theme.primary : theme.backgroundElement,
                  borderColor: theme.borderHard,
                  opacity: disabled ? 0.3 : 1,
                },
              ]}>
              <ThemedText type="smallBold" style={{ color: selected ? '#FFFFFF' : theme.text }}>
                {day}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.three,
  },
  monthRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
  },
  monthChip: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
  },
  dayGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
  },
  dayCell: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
