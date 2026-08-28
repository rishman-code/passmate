# GreenLight — Claude Code Project Brief

This file is the single source of truth for Claude Code working on GreenLight.
Read this fully before making any changes to any file.

---

## What GreenLight Is

GreenLight is an AI-powered UK driving theory test revision app for iOS, built with
React Native and Expo. It helps learners pass their DVSA driving theory test through:

- Adaptive practice questions (weak categories shown more often)
- AI explanations after every answer (via Anthropic API, server-side Edge Function)
- Weak spot identification by category
- Mock test simulator (50 questions, 57-minute timer, 43/50 pass mark)
- Daily streak tracking to encourage consistent revision
- User accounts with progress synced to Supabase
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
- Supabase (@supabase/supabase-js) — database, auth, and Edge Functions
- Zustand (with AsyncStorage persist middleware) — state management
- RevenueCat (react-native-purchases) — payments
- React Native StyleSheet — styling (no NativeWind, no Tailwind)
- @expo/vector-icons (Ionicons) — icons

**Anthropic SDK is server-side only** — it runs inside a Supabase Edge Function
(Deno), NOT in the React Native client. Do not add `@anthropic-ai/sdk` to the
client app or expose the API key via `EXPO_PUBLIC_` prefixed variables.

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
EXPO_PUBLIC_REVENUECAT_IOS_KEY=placeholder (not yet configured)
```

The Anthropic API key is a **server-side Supabase secret** — it is NOT in `.env`
and must never be prefixed with `EXPO_PUBLIC_`. It is stored via:
```bash
npx supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
```

When RevenueCat key is a placeholder, the app automatically unlocks
premium features in dev mode. Do not break this behaviour.

---

## Project File Structure (as built)

```
src/
├── app/
│   ├── _layout.tsx              # Root stack + auth gate + onboarding redirect
│   ├── (tabs)/
│   │   ├── _layout.tsx          # Bottom tabs (Ionicons)
│   │   ├── index.tsx            # Home dashboard (stats, streaks, weak spots)
│   │   ├── practice.tsx         # Category + adaptive practice
│   │   ├── progress.tsx         # Weak spots and mock test history
│   │   └── profile.tsx          # Account info, premium status, sign out
│   ├── auth/
│   │   ├── _layout.tsx          # Auth stack (no header, fade animation)
│   │   ├── sign-in.tsx          # Email + password sign-in
│   │   └── sign-up.tsx          # Name + email + password sign-up
│   ├── onboarding/
│   │   └── index.tsx            # 3-slide onboarding (shown on first launch only)
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
│   ├── option-button.tsx        # A/B/C/D answer buttons (testID: option-button-a etc.)
│   ├── timer.tsx                # Mock test countdown timer
│   ├── progress-bar.tsx         # Session progress indicator
│   ├── stat-card.tsx            # Dashboard stat display (label + value)
│   ├── themed-text.tsx          # Theme-aware text component
│   ├── themed-view.tsx          # Theme-aware view component
│   └── ai-explanation.tsx       # AI explanation display with loading state
├── constants/
│   ├── theme.ts                 # BorderRadius, Spacing, tactileShadow constants
│   ├── colors.ts                # Full colour palette (light + dark)
│   ├── typography.ts            # Text style constants (Outfit + Plus Jakarta Sans)
│   └── categories.ts            # All 14 DVSA category names, PREMIUM_PRICE
├── hooks/
│   ├── use-questions.ts         # Question fetching + weak category computation
│   └── use-theme.ts             # Theme hook (light/dark aware)
├── lib/
│   ├── supabase.ts              # Supabase client (SSR-safe auth storage)
│   └── auth.ts                  # signUp / signIn / signOut / friendlyAuthError
├── services/
│   ├── questions.ts             # fetchAllQuestions, fetchQuestionsByCategory, selectMockTestQuestions
│   ├── ai-explanations.ts       # getAIExplanation — calls Edge Function, in-memory cache
│   └── revenuecat.ts            # RevenueCat purchase service
├── stores/
│   ├── auth-store.ts            # Supabase session + user (Zustand)
│   ├── subscription-store.ts    # Premium status (Zustand, RevenueCat)
│   ├── progress-store.ts        # Progress, mock results, streaks (Zustand + AsyncStorage persist)
│   ├── practice-store.ts        # Current practice session (Zustand)
│   └── mock-test-store.ts       # Current mock test session (Zustand)
├── types/
│   └── database.ts              # TypeScript interfaces for all DB types
└── utils/
    └── practice.ts              # buildAdaptiveQuestionQueue function
supabase/
├── functions/
│   └── ai-explanation/
│       └── index.ts             # Deno Edge Function — auth check + Anthropic call + cache
├── schema.sql                   # Full database schema (already applied)
├── migration-add-auth.sql       # Adds user_id to progress tables, enables RLS (already run)
└── migration-cache-rls.sql      # Enables RLS on ai_explanation_cache (already run)
```

---

## Database (Supabase)

The Supabase project is live and configured. Project ref: `rngbdevqxvzyuwgezgce`.
All migrations have been run. The questions table has **717 questions**.

### Tables

**questions** — RLS OFF (public read-only data)
```typescript
interface Question {
  id: string;
  category: string;          // one of 14 DVSA categories
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: 'a' | 'b' | 'c' | 'd';
  explanation: string;       // DVSA official explanation
  image_url?: string;
}
```

**user_progress** — RLS ON (users see only their own rows)
```typescript
interface UserProgress {
  user_id: string;           // uuid, references auth.users
  question_id: string;
  answered_correctly: boolean;
  answered_at: string;
  attempt_count: number;
}
```

**ai_explanation_cache** — RLS ON (authenticated read; writes via Edge Function service role)
```typescript
interface AIExplanationCache {
  question_id: string;
  ai_explanation: string;
  created_at: string;
}
```

**mock_test_results** — RLS ON (users see only their own rows)
```typescript
interface MockTestResult {
  id: string;
  user_id: string;           // uuid, references auth.users
  score: number;
  total_questions: number;
  passed: boolean;
  completed_at: string;
  time_taken_seconds: number;
}
```

### RLS Summary
| Table | RLS | Notes |
|---|---|---|
| questions | OFF | Public read-only |
| user_progress | ON | Policy: `auth.uid() = user_id` |
| mock_test_results | ON | Policy: `auth.uid() = user_id` |
| ai_explanation_cache | ON | Authenticated SELECT; INSERT/UPDATE via service role only |

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

Primary brand colour is `#FF4500` (orange), not blue. The theme uses a
neo-brutalist design system with `tactileShadow` and `borderHard` tokens.
Full palette is in `src/constants/colors.ts` with light/dark variants.

---

## Feature Behaviour

### Authentication
- Supabase Auth with email + password, plus Sign in with Apple (iOS only)
- Display name stored in `user_metadata.name`
- Sessions persisted via localStorage on web, AsyncStorage on native
- `src/lib/supabase.ts` uses an SSR-safe storage wrapper (guards on `typeof window`)
- On sign-in: `loadFromSupabase(user.id)` syncs progress from Supabase
- On sign-out: `reset()` clears local Zustand state
- Root `_layout.tsx` redirects unauthenticated users to `/auth/sign-in`, unless
  guest mode is active (see below)

**Sign in with Apple** (`signInWithApple()` in `src/lib/auth.ts`): native
`expo-apple-authentication` button (only renders on `Platform.OS === 'ios'`),
SHA256 nonce round-trip, then `supabase.auth.signInWithIdToken({ provider: 'apple', ... })`.
**Needs setup that only a human with dashboard access can do** before it will
actually authenticate — see "What is blocked" below.

**Guest mode** (`src/lib/guest-mode.ts`): tapping "Not now — continue without
an account" on sign-in sets a persisted flag that lets the root layout gate
pass without a session. Progress/journey/mistake-ledger stores already work
local-only when there's no `userId` set, so guest data just isn't synced to
Supabase — it stays on-device until the user signs in for real (which clears
the flag and starts syncing going forward; existing local guest data is not
retroactively uploaded). Profile screen shows a "Guest" state with a Sign In
CTA instead of account info + Sign Out.

### Adaptive Practice
Questions are weighted by performance:
- Unanswered → weight 3
- Answered wrong → weight 5 + attempt_count
- Answered correctly multiple times → weight 2

The `buildAdaptiveQuestionQueue` function in `src/utils/practice.ts`
handles this weighting. Do not rewrite this function — it is correct.

### Question Fetching
`src/services/questions.ts`:
- `fetchAllQuestions()` — paginates with `.range()` to load all 717 questions
- `fetchQuestionsByCategory(category)` — queries Supabase with `.eq()` filter
- `selectMockTestQuestions()` — stratified: ~3-4 questions per category, 50 total

### AI Explanations
Shown after every answer for premium users. Free users see the DVSA explanation only.

Flow:
1. `session.tsx` calls `getAIExplanation(question)` from `src/services/ai-explanations.ts`
2. Service checks in-memory cache first
3. If not cached: calls `supabase.functions.invoke('ai-explanation', { body: { question_id } })`
4. Edge Function (`supabase/functions/ai-explanation/index.ts`):
   - Verifies caller's JWT (returns 401 if not authenticated)
   - Checks `ai_explanation_cache` table (service role key)
   - If cached: returns immediately
   - If not cached: calls Anthropic API (key from Supabase secret), saves to cache, returns
5. Client caches result in memory; strips markdown from response
6. Fallback: if Edge Function fails for any reason, returns `question.explanation` (DVSA text)

The Anthropic key is **never** in the client bundle. It lives only as a Supabase secret.

### Daily Streaks
Tracked in `progress-store.ts`:
- `currentStreak` — consecutive days with at least one answer
- `longestStreak` — all-time best
- `lastActiveDate` — local date string (YYYY-MM-DD, device timezone)
- Increments on first answer of a new consecutive day; resets after a gap
- Persisted to AsyncStorage; survives app restarts
- Displayed on home screen as a third stat card (turns orange at 3+ days)

### Mock Test
- 50 questions, 57-minute timer
- Pass mark: 43 out of 50
- Stratified selection across all 14 categories
- Premium feature (gated behind RevenueCat)

### Paywall
- Trigger: when free user attempts question 21+ in a day
- Daily count resets at midnight
- Product ID: `greenlight_lifetime`
- Entitlement ID: `premium`
- Price: £5.99 one-time purchase
- When RevenueCat key is placeholder: auto-unlock premium (dev mode)

---

## Current Status

### What is working
- App runs in browser via `npx expo start --web`
- Sign-up / sign-in / sign-out with Supabase Auth
- Onboarding (3 slides, shown once per device)
- All 14 DVSA categories displayed; 717 questions in Supabase
- Adaptive practice with weighted question queue
- Progress persisted locally (AsyncStorage) and synced to Supabase per user
- Daily streak tracking with home screen display
- AI explanations via Supabase Edge Function (Anthropic key server-side)
- Mock test timer and flow
- RevenueCat dev mode unlocks premium
- TypeScript: zero errors (`npx tsc --noEmit` is clean)
- App Store assets: icon, screenshots, store listing copy, privacy policy

### What is blocked
- **RevenueCat real purchase flow** — needs Apple Developer account ($99/year)
- **Testing on physical iPhone** — needs Apple Developer account
- **App Store submission** — needs Apple Developer account
- **Push notifications delivery** — needs Apple Developer / APNs certificates
- **Sign in with Apple actually authenticating** — the code path is built
  (`src/lib/auth.ts` `signInWithApple()`, button on the sign-in screen), but
  needs two pieces of external config that only a human can do:
  1. Enable the "Sign in with Apple" capability for the app's bundle ID in
     the Apple Developer portal.
  2. Add Apple as an OAuth provider in the Supabase dashboard
     (Authentication → Providers → Apple), which needs a Services ID,
     Team ID, Key ID, and private key from Apple.
  Until both are done, tapping the button will fail (Supabase will reject
  the `signInWithIdToken` call with a "provider not enabled" style error).

### What could be built next
1. `expo-secure-store` for auth tokens (medium security improvement — store in Keychain on native)
2. Push notifications infrastructure (Expo Notifications — infra now, delivery when Apple account ready)
3. Leaderboard or social features
4. More questions (717 is good; DVSA bank has 900+)

---

## Coding Standards

- TypeScript strict mode — zero `any` types allowed
- All screens must use SafeAreaView with `edges={['top', 'bottom']}`
- Every screen must handle loading state (ActivityIndicator)
- Every screen must handle empty state (friendly message)
- Use StyleSheet.create() for all styles — no inline style objects
- No @react-navigation imports — Expo Router only
- No `EXPO_PUBLIC_ANTHROPIC_API_KEY` — Anthropic is server-side only
- Supabase Edge Functions are Deno TypeScript — exclude `supabase/functions/` from tsconfig
- When in doubt, ask before changing working code

---

## How to Run the App

```bash
# In browser (primary development method)
npx expo start --web

# TypeScript check (must be clean before merging anything)
npx tsc --noEmit

# Deploy Edge Function (requires Supabase CLI + project linked)
npx supabase functions deploy ai-explanation

# Set/update Anthropic secret
npx supabase secrets set ANTHROPIC_API_KEY=sk-ant-...

# Link project (one-time per machine, needs SUPABASE_ACCESS_TOKEN env var)
npx supabase link --project-ref rngbdevqxvzyuwgezgce
```

Note: on this machine, SSL verification must be bypassed:
```bash
NODE_TLS_REJECT_UNAUTHORIZED=0 npx expo start --web
```

---

## First Thing to Do in Every Claude Code Session

1. Read this file fully
2. Run `npx tsc --noEmit` to confirm zero TypeScript errors
3. Do not add new features until the TypeScript check is clean
