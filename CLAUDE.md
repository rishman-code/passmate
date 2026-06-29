# PassMate — Claude Code Project Brief

This file is the single source of truth for Claude Code working on PassMate.
Read this fully before making any changes to any file.

---

## What PassMate Is

PassMate is an AI-powered UK driving theory test revision app for iOS, built with
React Native and Expo. It helps learners pass their DVSA driving theory test through:

- Adaptive practice questions (weak categories shown more often)
- AI explanations for wrong answers (via Anthropic API)
- Weak spot identification by category
- Mock test simulator (50 questions, 57-minute timer, 43/50 pass mark)
- £5.99 one-time purchase via RevenueCat

The app runs in a browser during development via `npx expo start --web`.
The target platform is iOS App Store.

---

## Tech Stack (exact versions — do not deviate)

- Expo SDK 56
- React Native 0.85
- React 19.2
- TypeScript (strict mode — no `any` types)
- Expo Router v3 (file-based routing)
- Supabase (@supabase/supabase-js) — database and backend
- Zustand — state management
- RevenueCat (react-native-purchases) — payments
- Anthropic SDK (@anthropic-ai/sdk) — AI explanations
- React Native StyleSheet — styling (no NativeWind, no Tailwind)
- @expo/vector-icons (Ionicons) — icons

### CRITICAL: Expo Router v3 rule
Never import from @react-navigation packages directly.
Expo Router v3 has forked from React Navigation.
All navigation must use expo-router imports only.

---

## Environment Variables

Located in `.env` at project root. Current state:

```
EXPO_PUBLIC_SUPABASE_URL=configured (real value in place)
EXPO_PUBLIC_SUPABASE_ANON_KEY=configured (real value in place)
EXPO_PUBLIC_ANTHROPIC_API_KEY=placeholder (not yet configured)
EXPO_PUBLIC_REVENUECAT_IOS_KEY=placeholder (not yet configured)
```

When RevenueCat key is a placeholder, the app automatically unlocks
premium features in dev mode. Do not break this behaviour.

---

## Project File Structure (as built)

```
src/
├── app/
│   ├── _layout.tsx              # Root stack + providers
│   ├── (tabs)/
│   │   ├── _layout.tsx          # Bottom tabs (Ionicons)
│   │   ├── index.tsx            # Home dashboard
│   │   ├── practice.tsx         # Category + adaptive practice
│   │   ├── progress.tsx         # Weak spots and mock test history
│   │   └── profile.tsx          # Premium status and settings
│   ├── practice/
│   │   └── session.tsx          # Adaptive practice flow (modal)
│   ├── mock-test/
│   │   ├── index.tsx            # Mock test intro and rules
│   │   ├── session.tsx          # 50 questions / 57 min timer (modal)
│   │   └── results.tsx          # Pass/fail results screen
│   └── paywall.tsx              # £5.99 purchase modal
├── components/
│   ├── app-tabs.web.tsx         # Web-specific tab navigation
│   ├── button.tsx               # Shared button component
│   ├── question-card.tsx        # Question display component
│   ├── answer-options.tsx       # A/B/C/D answer buttons
│   ├── timer.tsx                # Mock test countdown timer
│   ├── progress-bar.tsx         # Session progress indicator
│   └── ai-explanation.tsx       # AI explanation display with loading state
├── constants/
│   ├── theme.ts                 # BorderRadius, Spacing constants
│   ├── colors.ts                # Full colour palette
│   ├── typography.ts            # Text style constants
│   └── categories.ts            # All 14 DVSA category names
├── data/
│   └── sample-questions.ts      # 14 fallback questions (1 per category)
├── hooks/
│   ├── use-questions.ts         # Question fetching hook
│   └── use-theme.ts             # Theme hook
├── services/
│   ├── supabase.ts              # Supabase client initialisation
│   ├── questions.ts             # Question fetching service (fixed)
│   ├── anthropic.ts             # AI explanation service (mock mode)
│   └── revenuecat.ts            # RevenueCat purchase service
├── store/
│   ├── use-subscription-store.ts  # Premium status (Zustand)
│   ├── use-progress-store.ts      # User progress and history (Zustand)
│   ├── use-practice-store.ts      # Current practice session (Zustand)
│   └── use-mock-test-store.ts     # Current mock test session (Zustand)
├── types/
│   └── database.ts              # TypeScript interfaces for all DB types
└── utils/
    └── practice.ts              # buildAdaptiveQuestionQueue function
supabase/
└── schema.sql                   # Database schema (already run in Supabase)
```

---

## Database (Supabase)

The Supabase project is live and configured.
The schema has been applied. The questions table has 119 questions.

### Tables

**questions**
```typescript
interface Question {
  id: string;           // uuid
  category: string;     // one of 14 DVSA categories
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: 'a' | 'b' | 'c' | 'd';
  explanation: string;  // DVSA official explanation
  image_url?: string;
}
```

**user_progress**
```typescript
interface UserProgress {
  question_id: string;
  answered_correctly: boolean;
  answered_at: string;
  attempt_count: number;
}
```

**ai_explanations** (cache table)
```typescript
interface AIExplanationCache {
  question_id: string;
  wrong_answer: string;
  ai_explanation: string;
  created_at: string;
}
```

**mock_test_results**
```typescript
interface MockTestResult {
  id: string;
  score: number;
  total_questions: number;
  passed: boolean;
  completed_at: string;
  time_taken_seconds: number;
}
```

### RLS Status
RLS is currently OFF on all tables. Do not enable it.
This is intentional for the development phase.

---

## The 14 DVSA Categories

```
1. Alertness
2. Attitude
3. Safety and Your Vehicle
4. Safety Margins
5. Hazard Awareness
6. Vulnerable Road Users
7. Other Types of Vehicle
8. Vehicle Handling
9. Motorway Rules
10. Rules of the Road
11. Road and Traffic Signs
12. Documents
13. Accidents
14. Vehicle Loading
```

---

## Colour Palette

```typescript
export const Colors = {
  primary: '#1B4FD8',
  primaryLight: '#EEF2FF',
  success: '#16A34A',
  successLight: '#DCFCE7',
  danger: '#DC2626',
  dangerLight: '#FEE2E2',
  warning: '#D97706',
  warningLight: '#FEF3C7',
  background: '#F8FAFC',
  card: '#FFFFFF',
  text: '#0F172A',
  textSecondary: '#64748B',
  border: '#E2E8F0',
  disabled: '#94A3B8',
};
```

---

## Feature Behaviour

### Adaptive Practice
Questions are weighted by performance:
- Unanswered → weight 3
- Answered wrong → weight 5 + attempt_count
- Answered correctly multiple times → weight 2

The `buildAdaptiveQuestionQueue` function in `src/utils/practice.ts`
handles this weighting. Do not rewrite this function — it is correct.

### Question Fetching (already fixed)
`src/services/questions.ts` was updated to:
- `fetchAllQuestions()` — paginates with .range() to load all 119 questions
- `fetchQuestionsByCategory(category)` — queries Supabase with .eq() filter
- `selectMockTestQuestions()` — stratified: ~3-4 questions per category, 50 total

### AI Explanations
When a user answers wrong:
1. Check `ai_explanations` cache table in Supabase first
2. If cached — return cached explanation immediately
3. If not cached — call Anthropic API, save to cache, return result
4. If Anthropic key is placeholder — fall back to the DVSA explanation field
5. Show shimmer/skeleton loading state while API call is in flight
Premium users only. Free users see DVSA official explanation only.

### Mock Test
- 50 questions, 57-minute timer
- Pass mark: 43 out of 50
- Stratified selection across all 14 categories
- Premium feature (gated behind RevenueCat)

### Paywall
- Trigger: when free user attempts question 21+ in a day
- Daily count resets at midnight
- Product ID: passmate_lifetime
- Entitlement ID: premium
- Price: £5.99 one-time purchase
- When key is placeholder: auto-unlock premium (dev mode)

---

## Current Status

### What is working
- App runs in browser via `npx expo start --web`
- All 14 DVSA categories display on home screen
- 119 questions load from Supabase
- Navigation between all tabs works
- Adaptive weighting logic is in place
- Mock test timer and flow is built
- RevenueCat dev mode unlocks premium

### Known TypeScript errors to fix first

**Error 1: src/components/app-tabs.web.tsx line 27**
```
Type '"/explore"' is not assignable to type RelativePathString...
```
There is a reference to a route called `/explore` that does not exist.
Valid tab routes are: `/(tabs)/`, `/(tabs)/practice`,
`/(tabs)/progress`, `/(tabs)/profile`
Replace `/explore` with `/(tabs)/practice` or remove it entirely.

**Error 2: src/components/button.tsx line 54**
```
Argument of type '{ pressed: boolean; }' is not assignable to
parameter of type 'PressableStateCallbackType'.
Property 'hovered' is missing.
```
Fix the Pressable style callback to use the correct type.
Solution: change the callback parameter type to include hovered,
or use `({ pressed }: { pressed: boolean; hovered?: boolean })`.

After fixing both errors, run `npx tsc --noEmit` to confirm
zero TypeScript errors before doing anything else.

---

## What Needs Building Next (in priority order)

1. **Fix the two TypeScript errors above** — do this first
2. **Verify multiple questions load per category** — not just 1
3. **Anthropic AI explanation** — wire up real API call when key is provided
4. **Onboarding screen** — 3 slides shown on first launch only
5. **Phone connection** — app currently only runs in browser, not on phone via Expo Go
6. **RevenueCat** — wire up real purchase flow when Apple Developer account is ready
7. **App Store assets** — icon, screenshots, description (later)

---

## Coding Standards

- TypeScript strict mode — zero `any` types allowed
- All screens must use SafeAreaView
- Every screen must handle loading state (ActivityIndicator)
- Every screen must handle empty state (friendly message)
- Use StyleSheet.create() for all styles — no inline style objects
- No @react-navigation imports — Expo Router only
- When in doubt, ask before changing working code

---

## How to Run the App

```bash
# In browser (works now)
npx expo start --web

# On phone via local network (requires phone and PC on same WiFi)
npx expo start

# TypeScript check
npx tsc --noEmit
```

---

## First Thing to Do in Every Claude Code Session

1. Read this file fully
2. Run `npx tsc --noEmit` to see current error state
3. Fix any TypeScript errors before adding new features
4. Confirm app still runs with `npx expo start --web` after changes
