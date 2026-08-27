import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { CalendarDatePicker } from '@/components/calendar-date-picker';
import { ThemedText } from '@/components/themed-text';
import { CATEGORY_ICONS, DVSA_CATEGORIES, type DVSACategory } from '@/constants/categories';
import { BorderRadius, Fonts, Spacing, tactileShadow } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { markOnboardingComplete } from '@/lib/onboarding';
import { useJourneyStore } from '@/stores/journey-store';
import type { JourneyState, LocalDate } from '@/types/journey';
import { addYears, todayInLondon } from '@/utils/journey-dates';
import { buildPlan } from '@/utils/plan';
import { JOURNEY_OPTIONS } from './journey/setup';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface IntroSlide {
  icon: IoniconName;
  title: string;
  body: string;
}

type Page = { kind: 'intro'; slide: IntroSlide } | { kind: 'journey' } | { kind: 'weak-topics' } | { kind: 'plan' };

const HERO_IMAGE = 'https://images.pexels.com/photos/96106/pexels-photo-96106.jpeg';

const INTRO_SLIDES: IntroSlide[] = [
  {
    icon: 'ribbon-outline',
    title: 'Built For Retakes',
    body: "1.8 million people sit the DVSA theory test every year — fewer than half pass first time. Generic apps don't know where YOU specifically went wrong. PassMate does.",
  },
  {
    icon: 'stats-chart-outline',
    title: 'Target Your Weak Spots',
    body: 'Every answer you give is tracked. PassMate automatically shows you the questions you need most — no wasted revision time.',
  },
  {
    icon: 'bulb-outline',
    title: 'Understand Every Answer',
    body: "Get plain-English explanations when you get something wrong. Know the why, not just the what — and don't repeat the same mistake.",
  },
];

export default function OnboardingScreen() {
  const theme = useTheme();
  const journey = useJourneyStore((s) => s.journey);
  const updateJourney = useJourneyStore((s) => s.updateJourney);
  const markPromptSeen = useJourneyStore((s) => s.markPromptSeen);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedState, setSelectedState] = useState<JourneyState | null>(journey.state ?? null);
  const [pickedDate, setPickedDate] = useState<LocalDate | null>(
    journey.state === 'booked' ? journey.testDate : null,
  );
  const [weakCategories, setWeakCategories] = useState<DVSACategory[]>(journey.selfReportedWeakCategories);

  const today = todayInLondon();
  const maxTestDate = addYears(today, 1);

  const pages = useMemo<Page[]>(() => {
    const intro: Page[] = INTRO_SLIDES.map((slide) => ({ kind: 'intro', slide }));
    if (selectedState === 'retake' || selectedState === 'certified') {
      return [...intro, { kind: 'journey' }];
    }
    return [...intro, { kind: 'journey' }, { kind: 'weak-topics' }, { kind: 'plan' }];
  }, [selectedState]);

  useEffect(() => {
    if (currentIndex > pages.length - 1) {
      setCurrentIndex(pages.length - 1);
    }
  }, [pages.length, currentIndex]);

  const page = pages[currentIndex];
  const isLast = currentIndex === pages.length - 1;
  const isIntro = page.kind === 'intro';

  const plan = useMemo(
    () => buildPlan(selectedState === 'booked' ? pickedDate : null, [], weakCategories, [], 0),
    [selectedState, pickedDate, weakCategories],
  );

  const canProceed =
    page.kind !== 'journey' || (selectedState !== null && (selectedState !== 'booked' || pickedDate !== null));

  const finish = async (state: JourneyState | null, testDate: LocalDate | null, weak: DVSACategory[]) => {
    await markOnboardingComplete();
    markPromptSeen();

    if (state) {
      updateJourney({
        state,
        testDate: state === 'booked' ? testDate : null,
        selfReportedWeakCategories: weak,
      });
    }

    if (state === 'retake') {
      router.replace('/journey/result-letter');
    } else if (state === 'certified') {
      router.replace('/journey/certificate');
    } else {
      router.replace('/(tabs)');
    }
  };

  const handleSkip = () => {
    finish(selectedState, pickedDate, weakCategories);
  };

  const handleNext = () => {
    if (isLast) {
      finish(selectedState, pickedDate, weakCategories);
    } else {
      setCurrentIndex((i) => i + 1);
    }
  };

  const toggleWeakCategory = (category: DVSACategory) => {
    setWeakCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category],
    );
  };

  const nextTitle = isLast ? (selectedState === 'retake' || selectedState === 'certified' ? 'Continue' : 'Get Started') : 'Next';

  return (
    <View style={[styles.container, isIntro ? undefined : { backgroundColor: theme.background }]} testID="onboarding-screen">
      {isIntro ? (
        <>
          <Image source={{ uri: HERO_IMAGE }} style={styles.heroImage} contentFit="cover" />
          <LinearGradient
            colors={['rgba(11,11,13,0.15)', 'rgba(11,11,13,0.75)', theme.background]}
            locations={[0, 0.55, 0.72]}
            style={StyleSheet.absoluteFill}
          />
        </>
      ) : null}

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.skipRow}>
          {!isLast ? (
            <Pressable onPress={handleSkip} hitSlop={12} style={styles.skipPressable} testID="onboarding-skip-button">
              <ThemedText type="smallBold" style={{ color: isIntro ? '#FFFFFF' : theme.text }}>
                Skip
              </ThemedText>
            </Pressable>
          ) : (
            <View style={styles.skipPressable} />
          )}
        </View>

        {page.kind === 'intro' ? (
          <>
            <View style={styles.spacer} />
            <View style={styles.slide} testID="onboarding-slide">
              <View
                style={[
                  styles.iconBadge,
                  { backgroundColor: theme.primary, borderColor: theme.borderHard, ...tactileShadow(theme.borderHard, 4) },
                ]}>
                <Ionicons name={page.slide.icon} size={36} color="#FFFFFF" />
              </View>
              <ThemedText type="title" style={{ color: theme.text }}>
                {page.slide.title}
              </ThemedText>
              <ThemedText style={[styles.slideBody, { color: theme.textSecondary }]}>{page.slide.body}</ThemedText>
            </View>
          </>
        ) : (
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            {page.kind === 'journey' ? (
              <View style={styles.stepContent} testID="onboarding-journey-step">
                <ThemedText type="title">When's your test?</ThemedText>
                <ThemedText themeColor="textSecondary">
                  This decides how many days of practice you've got — and shapes your plan around it.
                </ThemedText>

                <View style={styles.options}>
                  {JOURNEY_OPTIONS.map((option) => {
                    const selected = selectedState === option.state;
                    return (
                      <Pressable
                        key={option.state}
                        onPress={() => {
                          setSelectedState(option.state);
                          if (option.state !== 'booked') setPickedDate(null);
                        }}
                        testID={`onboarding-journey-option-${option.state}`}
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
                    <CalendarDatePicker value={pickedDate} onChange={setPickedDate} minDate={today} maxDate={maxTestDate} />
                  </View>
                ) : null}

                {selectedState === 'retake' ? (
                  <View
                    style={[styles.reassuranceBox, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
                    <ThemedText type="small" themeColor="textSecondary">
                      A retake isn't a bad sign — it's just missing data. Next you'll enter what your result letter
                      said, and we'll build your plan straight from it.
                    </ThemedText>
                  </View>
                ) : null}
              </View>
            ) : null}

            {page.kind === 'weak-topics' ? (
              <View style={styles.stepContent} testID="onboarding-weak-topics-step">
                <ThemedText type="title">Where do you feel weakest?</ThemedText>
                <ThemedText themeColor="textSecondary">
                  Pick as many as apply — we'll weight your plan towards them until your real answers tell us more.
                </ThemedText>

                <View style={styles.chips}>
                  {DVSA_CATEGORIES.map((category) => {
                    const selected = weakCategories.includes(category);
                    return (
                      <Pressable
                        key={category}
                        onPress={() => toggleWeakCategory(category)}
                        testID={`onboarding-weak-topic-${category}`}
                        style={[
                          styles.chip,
                          {
                            backgroundColor: selected ? theme.primary : theme.card,
                            borderColor: selected ? theme.primary : theme.borderHard,
                          },
                        ]}>
                        <Ionicons
                          name={CATEGORY_ICONS[category]}
                          size={16}
                          color={selected ? '#FFFFFF' : theme.textSecondary}
                        />
                        <ThemedText type="small" style={{ color: selected ? '#FFFFFF' : theme.text }}>
                          {category}
                        </ThemedText>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ) : null}

            {page.kind === 'plan' ? (
              <View style={styles.stepContent} testID="onboarding-plan-step">
                <ThemedText type="title">Your plan</ThemedText>
                <ThemedText themeColor="textSecondary">
                  This is what PassMate holds you to — it adjusts automatically as you practise.
                </ThemedText>

                <View
                  style={[styles.planCard, { backgroundColor: theme.card, borderColor: theme.borderHard, ...tactileShadow(theme.borderHard, 4) }]}>
                  <ThemedText type="h3">
                    {plan.phases[0].headline}
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {plan.phases[0].detail}
                  </ThemedText>

                  {plan.weakFocus.length > 0 ? (
                    <>
                      <View style={[styles.divider, { backgroundColor: theme.border }]} />
                      <ThemedText type="caption" themeColor="textSecondary">
                        Focus areas
                      </ThemedText>
                      {plan.weakFocus.map((category) => (
                        <View key={category} style={styles.focusRow}>
                          <Ionicons name={CATEGORY_ICONS[category]} size={16} color={theme.primary} />
                          <ThemedText type="small">{category}</ThemedText>
                        </View>
                      ))}
                    </>
                  ) : null}
                </View>
              </View>
            ) : null}
          </ScrollView>
        )}

        <View style={styles.footer}>
          {isIntro ? (
            <View style={styles.dots}>
              {INTRO_SLIDES.map((_, i) => (
                <Pressable key={i} onPress={() => setCurrentIndex(i)} testID={`onboarding-dot-${i}`}>
                  <View
                    style={[
                      styles.dot,
                      {
                        backgroundColor: i === currentIndex ? theme.primary : theme.border,
                        width: i === currentIndex ? 28 : 8,
                      },
                    ]}
                  />
                </Pressable>
              ))}
            </View>
          ) : null}

          <Button title={nextTitle} onPress={handleNext} disabled={!canProceed} fullWidth testID="onboarding-next-button" />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0B0D' },
  heroImage: { ...StyleSheet.absoluteFill },
  safeArea: { flex: 1 },
  skipRow: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: Spacing.four, paddingTop: Spacing.two },
  skipPressable: { minHeight: 32, justifyContent: 'center' },
  spacer: { flex: 1 },
  slide: { paddingHorizontal: Spacing.five, gap: Spacing.two },
  iconBadge: { width: 68, height: 68, borderRadius: BorderRadius.lg, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.one },
  slideBody: { fontSize: 16, lineHeight: 23, fontFamily: Fonts.bodyRegular },
  scroll: { padding: Spacing.four, paddingBottom: Spacing.six },
  stepContent: { gap: Spacing.three },
  options: { gap: Spacing.three },
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
  optionText: { flex: 1, gap: 2 },
  optionTitle: { fontSize: 16, fontFamily: Fonts.bodyBold },
  pickerSection: { gap: Spacing.two },
  reassuranceBox: {
    padding: Spacing.three,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: BorderRadius.full,
    borderWidth: 2,
  },
  planCard: {
    padding: Spacing.four,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    gap: Spacing.two,
  },
  divider: { height: 1, marginVertical: Spacing.one },
  focusRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  footer: { padding: Spacing.four, paddingTop: Spacing.four, gap: Spacing.three },
  dots: { flexDirection: 'row', gap: Spacing.one, alignItems: 'center' },
  dot: { height: 8, borderRadius: BorderRadius.full },
});
