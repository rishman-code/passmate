# PassMate — DVSA Theory Test Prep App

## Original ask
User connected an existing GitHub repo and asked to review how much of it is a working app, then show a preview (session 1). Session 2: fix the Home quick-action bug found in review, and decide on the AI-explanation architecture (cost/backend question).

## What this repo actually is
Not the platform's default backend+frontend template. It is a standalone **Expo (React Native + react-native-web) app** at repo root (`/app`), using `expo-router`. Talks to **Supabase** (BaaS, now the user's real project) for question data, and (as of session 2) a new minimal **FastAPI backend** (`/app/backend`) for AI explanations via Claude. RevenueCat for IAP (not configured — dev fallback).

Tech: Expo ~56, React 19, React Native 0.85, Zustand, TypeScript, FastAPI (new).

## Session 2 changes (2026-07-24)
1. **Bug fix**: `src/app/(tabs)/index.tsx` Home "Start Adaptive Practice" quick action now loads questions (fetchAllQuestions + buildAdaptiveQuestionQueue + setQuestions) before navigating, matching the Practice tab's working logic. Previously skipped straight to `/practice/session` with an empty store → "No questions loaded".
2. **Supabase wired in**: root `.env` now has the user's real `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY`. App now pulls the real question bank instead of the 14 bundled samples.
3. **AI explanation architecture decision**: kept AI explanations enabled (Claude), but moved the LLM call server-side instead of client-side `@anthropic-ai/sdk` (which exposed the key in the browser bundle — a real security/billing risk, especially with a shared Emergent Universal Key). New `POST /api/ai-explanation` FastAPI endpoint (`backend/server.py`) uses `emergentintegrations` + `EMERGENT_LLM_KEY` + `claude-sonnet-4-6`. Client (`src/lib/anthropic.ts`) now just does a `fetch` to this endpoint. Removed `@anthropic-ai/sdk` dependency.
   - Existing Supabase `ai_explanation_cache` table + in-memory cache (`src/services/ai-explanations.ts`) already caches by `(question_id, wrong_answer)` — Claude is only ever called once per unique combo across all users, keeping costs low. This was already scaffolded in the codebase; no changes needed there.
4. **Second bug found & fixed**: `EXPO_PUBLIC_REVENUECAT_IOS_KEY` placeholder value (`your_revenuecat_ios_key`) didn't contain the literal substring `"placeholder"`, so `isRevenueCatConfigured` was wrongly `true`, causing a RevenueCat SDK crash ("no singleton instance") on the paywall screen on web. Fixed by setting the env var to empty string (RevenueCat isn't set up yet).
5. Hardened the new backend per testing-agent review: unique `session_id` (uuid4) per request instead of a shared one, try/except around the LLM call returning HTTP 502 on failure, `max_length` limits on all request fields.

## Preview/infra notes (env quirks, not app bugs)
- Env has Node 20.20.2; `@supabase/supabase-js` needs Node 22 native WebSocket → `ws` polyfill injected via `NODE_OPTIONS --require /tmp/ws-polyfill.js` when starting `npx expo start --web --port 3000` manually (repo has no `/frontend` dir so platform's default supervisor frontend service doesn't apply).
- Backend now runs normally via supervisor (`/app/backend` exists, autostart works).
- Metro web dev server is memory-heavy; run with `--max-old-space-size=4096`.

## Verified working (testing_agent, 100% pass both frontend/backend)
Onboarding → Home (bug-fixed quick action, real Supabase questions) → Practice tab + 14 category cards → answer flow (color feedback + official explanation) → paywall (no more RevenueCat error) → dev premium unlock → live Claude AI explanation via new backend → Progress/Profile tabs → `/api/health` + `/api/ai-explanation` (incl. 422 validation).

## Known minor items (not blocking, deferred)
- No `data-testid`/`accessibilityRole` on RN Pressable elements (options, quick actions, tab bar) — would help future automated testing/screen readers.
- Only 14 local sample questions remain as offline fallback if Supabase is ever unreachable (by design).
- AI explanation text isn't markdown-rendered (shows literal `##`/`**`) — cosmetic, not raised by user yet.
- Mock Test (50Q) full flow only smoke-tested, not deeply verified.

## Session 3 changes (2026-07-24) — question bank expansion
- User asked for a comparison of question bank size vs competitors: found DB had only **119 unique questions** (8-10 per category) vs the official DVSA revision bank (~700-750+) and market leaders like Theory Test Pro (960). Recommended generating more.
- Built `/app/backend/scripts/generate_questions.py`: fetches existing questions per category from Supabase (to avoid duplicates), prompts Claude for N new factually-accurate DVSA-style questions in strict JSON, inserts into Supabase via REST (anon key has insert rights on `questions` table — no RLS configured).
- Generated a 42-question sample for "Alertness" first for approval, user approved, then scaled to all 14 categories.
- **Mid-run the EMERGENT_LLM_KEY hit its budget cap** (5 categories done via Emergent key). User provided their own Anthropic API key (`sk-ant-api03-...`) to continue. Switched both `backend/server.py` (`/api/ai-explanation`) and `generate_questions.py` to use the user's own key directly via the `anthropic` Python SDK when `ANTHROPIC_API_KEY` is set in `backend/.env`, falling back to `emergentintegrations` + `EMERGENT_LLM_KEY` only if that var is absent.
- Final result: **714 total questions, 51 per category across all 14 DVSA categories** — now in line with competitor apps.
- `backend/.env` now has both `EMERGENT_LLM_KEY` and `ANTHROPIC_API_KEY` (the latter takes priority in code).

## Session 4 (2026-07-24) — onboarding "Next" button bug fix
- User reported: clicking "Next" on the onboarding carousel didn't advance to the next slide.
- Root cause: `src/app/onboarding.tsx` used a horizontal-paging `FlatList` + `scrollToOffset()` + `onMomentumScrollEnd` to track slide index. On react-native-web, `onMomentumScrollEnd` doesn't reliably fire for programmatic `scrollToOffset` calls, so `currentIndex` state desynced from the visible slide.
- Fix: removed FlatList entirely, replaced with plain state-driven rendering (`SLIDES[currentIndex]`), `Next` just calls `setCurrentIndex(i => i+1)`. Added testIDs (`onboarding-next-button`, `onboarding-skip-button`, `onboarding-dot-0/1/2`, etc.) and made dots directly tappable (bonus UX).
- Verified by testing_agent: 100% pass — Next advances all 3 slides correctly, label switches to "Get Started" on slide 3, navigates to Home, Skip still works and persists across reload.

## Session 5 (2026-07-24) — RevenueCat SDK integration (iOS + Android)
- User initially asked for native SwiftUI/Swift Package Manager RevenueCat integration — corrected: PassMate is an Expo/React Native managed app (no `ios/` native folder), so integration goes through `react-native-purchases` + `react-native-purchases-ui` (RN bridge to the same RevenueCat backend), not Swift.
- Installed `react-native-purchases-ui` (react-native-purchases was already present). Configured with user's key `test_bYzKZfKoVYWguBSCNwynsbyDGDk` for BOTH `EXPO_PUBLIC_REVENUECAT_IOS_KEY` and `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY` in root `.env` (user only supplied one key — should get a separate Android public key from the RevenueCat dashboard when ready and I'll swap it in).
- Entitlement ID: `PassMate Pro`. Product ID: `lifetime` (one-time non-consumable).
- Added `android.package: "com.passmate.app"` to `app.json` (was missing, required for Android builds/RevenueCat Android SDK).
- Architecture: platform-split `src/lib/revenuecat.ts` (native iOS/Android impl using `react-native-purchases` + `react-native-purchases-ui`: configure, getCustomerInfo, hasProEntitlement, getLifetimePackage, purchaseLifetime, restorePurchases, presentPaywall via `RevenueCatUI.presentPaywallIfNeeded`, presentCustomerCenter via `RevenueCatUI.presentCustomerCenter`) vs `src/lib/revenuecat.web.ts` (web stub — Metro auto-resolves this on web via the `.web.ts` convention, never imports `react-native-purchases-ui` since it has no web support, `isRevenueCatConfigured` hardcoded false so calling code always falls back to the custom `/paywall` screen on web).
- `src/stores/subscription-store.ts`: added `openPaywall()` (native paywall if configured, else `'fallback'` signal) and `openCustomerCenter()`.
- `src/app/(tabs)/index.tsx` + `src/app/(tabs)/profile.tsx`: unlock buttons now call `openPaywall()` first, falling back to the existing custom `/paywall` route on web/dev. Profile gained a "Manage Subscription" button (Customer Center) shown only when premium.
- **Not testable in this environment**: actual native purchase flow (`presentPaywall`, `presentCustomerCenter`, real App Store/Play Store purchases) requires an EAS development build on a physical device — this preview environment has no native iOS/Android runtime. Verified via testing_agent (100% pass) that: web bundling has no regressions from the new native packages, and the dev/web fallback paywall flow works end-to-end.
- Minor cleanup applied post-test: removed dead `react-native-purchases` import from `revenuecat.web.ts`.

## Next Action Items (updated)
- User needs to finish RevenueCat dashboard setup: create the `PassMate Pro` entitlement, a `lifetime` one-time product, an Offering containing it, and (ideally) a separate Android public API key.
- Real purchase flow must be tested via `eas build --profile development --platform ios` (and `android`) on a physical device with RevenueCat sandbox testers — cannot be done in this web preview.
- Optional: add data-testid/accessibility props across remaining interactive elements (options, quick actions, tab bar).
- Optional: render AI explanation markdown properly.
- Optional: spot-check a larger random sample of the 595 newly generated questions for factual accuracy (currently only manually reviewed a handful per category).
- Consider adding a "flag this question" reporting feature (suggested, not yet built).

## Session 6 (2026-07-24) — Full UI redesign
- User: "it looks a bit boring... redesign the UI so it's more in line with successful apps on the app store." Called design_agent → produced a Neo-Brutalist tactile design system: orange `#FF4500` primary, hard 2px black borders, offset drop shadows (no blur), Outfit (display/headings) + Plus Jakarta Sans (body) + JetBrains Mono (numbers/timer) fonts, pill-shaped buttons, indigo accent for premium/AI features. Full guidelines in `/app/design_guidelines.json`.
- Installed `@expo-google-fonts/outfit`, `@expo-google-fonts/plus-jakarta-sans`, `@expo-google-fonts/jetbrains-mono`. Fonts loaded via `useFonts` in `src/app/_layout.tsx` (shows spinner until ready, avoiding flash-of-unstyled-text).
- Rewrote `src/constants/theme.ts` (new Colors light+dark, Fonts, `tactileShadow()` helper) and every shared component (`themed-text`, `button`, `stat-card`, `progress-bar`, `category-card`, `option-button`, `question-card`, `ai-explanation`, `timer`) plus every screen (onboarding, tabs `_layout`, Home, Practice, Progress, Profile, paywall, mock-test intro/results, practice/session) — visual-only changes, no logic/business-flow changes.
- Added hero/banner photography (Pexels: scenic road for onboarding + paywall hero, steering wheel close-up for Home premium banner) with `expo-linear-gradient` overlays for legibility.
- Updated `app.json` splash screen background to match new primary orange.
- Verified via testing_agent: **100% pass**, zero regressions — all previously-fixed flows (onboarding Next, adaptive practice loading, RevenueCat fallback paywall, AI explanations) still work correctly under the new visual design. Fonts confirmed loading correctly (not falling back to system fonts).

## Next Action Items (updated)
- RevenueCat dashboard setup (entitlement, product, offering, Android key) + real device testing — still pending from Session 5.
- Optional: add data-testid/accessibility props across remaining interactive elements.
- Optional: render AI explanation markdown properly (still shows literal `##`/`**`).
- Optional: spot-check a larger random sample of the 595 newly generated questions for factual accuracy.
- Consider adding a "flag this question" reporting feature.
- Optional: extend dark-mode theme testing (redesign focused on light theme, dark theme adapted but not deeply tested).
