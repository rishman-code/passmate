import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { BorderRadius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { LocalDate } from '@/types/journey';
import { compareLocalDates, todayInLondon } from '@/utils/journey-dates';

interface MonthOption {
  label: string;
  year: number;
  month: number;
}

function buildMonthOptions(minDate: LocalDate, maxDate: LocalDate): MonthOption[] {
  const [startYear, startMonth] = minDate.split('-').map(Number);
  const [endYear, endMonth] = maxDate.split('-').map(Number);
  const totalSpan = (endYear - startYear) * 12 + (endMonth - startMonth);
  const options: MonthOption[] = [];

  for (let i = 0; i <= totalSpan; i += 1) {
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

interface CalendarDatePickerProps {
  value: LocalDate | null;
  onChange: (date: LocalDate) => void;
  minDate: LocalDate;
  maxDate: LocalDate;
}

export function CalendarDatePicker({ value, onChange, minDate, maxDate }: CalendarDatePickerProps) {
  const theme = useTheme();
  const monthOptions = useMemo(() => buildMonthOptions(minDate, maxDate), [minDate, maxDate]);

  const [selectedMonthIndex, setSelectedMonthIndex] = useState(() => {
    const target = value ?? todayInLondon();
    const idx = monthOptions.findIndex((m) => `${m.year}-${String(m.month).padStart(2, '0')}` === monthKey(target));
    if (idx >= 0) return idx;
    // Target month is outside the range — clamp to whichever end is closer.
    return compareLocalDates(target, minDate) < 0 ? 0 : monthOptions.length - 1;
  });

  const selectedMonth = monthOptions[selectedMonthIndex];
  const dayCells = useMemo(
    () => Array.from({ length: daysInMonth(selectedMonth.year, selectedMonth.month) }, (_, i) => i + 1),
    [selectedMonth],
  );

  const dateFor = (day: number): LocalDate =>
    `${selectedMonth.year}-${String(selectedMonth.month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  return (
    <View style={styles.container} testID="calendar-date-picker">
      <View style={styles.monthRow}>
        {monthOptions.map((m, idx) => (
          <Pressable
            key={`${m.year}-${m.month}`}
            onPress={() => setSelectedMonthIndex(idx)}
            testID={`calendar-date-picker-month-${idx}`}
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
          const disabled = compareLocalDates(date, minDate) < 0 || compareLocalDates(date, maxDate) > 0;
          const selected = value === date;
          return (
            <Pressable
              key={date}
              disabled={disabled}
              onPress={() => onChange(date)}
              testID={`calendar-date-picker-day-${date}`}
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
