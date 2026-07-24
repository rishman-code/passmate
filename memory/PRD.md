# PassMate — DVSA Theory Test Prep App

## Original ask
User connected an existing GitHub repo and asked to review how much of it is a working app, then show a preview. User chose: "review only, no fixes" and confirmed it's meant to be a mobile-styled web app.

## What this repo actually is
Not the platform's default backend+frontend template. It is a standalone **Expo (React Native + react-native-web) app** at repo root (`/app`), using `expo-router` for file-based routing. No custom backend server — it talks directly to **Supabase** (BaaS) for data, **Anthropic Claude** for AI explanations, and **RevenueCat** for IAP, all optional/client-side.

Tech: Expo ~56, React 19, React Native 0.85, Zustand for state, TypeScript.

## Core features (as built)
- Onboarding carousel (3 slides) → gated by `hasSeenOnboarding` (expo-secure-store / AsyncStorage on web)
- Home tab: stats, quick actions, weak-spot summary
- Practice tab: adaptive practice + practice-by-14-DVSA-category
- Practice session: MCQ with instant feedback, official explanation, optional AI explanation
- Mock Test: 50Q / 57min / pass mark 43 (gated behind Premium paywall)
- Progress tab: accuracy, category breakdown, mock test history
- Profile tab: premium status, restore purchases, paywall
- Graceful fallback: without Supabase/Anthropic/RevenueCat keys, app uses 14 bundled `SAMPLE_QUESTIONS`, static DVSA explanations, and free-tier premium state — so UI is testable with zero config.

## Preview setup notes (infra only, no app code changed)
- Env has Node 20.20.2; `@supabase/supabase-js` requires Node 22 native WebSocket → injected a `ws` polyfill via `NODE_OPTIONS --require` (not committed to repo) to boot the app.
- Ran `npx expo start --web --port 3000` directly (repo has no `/frontend` folder so the platform's default supervisor frontend service doesn't apply here).
- Metro web dev server is memory-heavy; bumped `--max-old-space-size=4096` after one OOM crash.

## Findings from review (reported to user, not fixed — user chose review-only)
1. **Bug**: Home screen "Start Adaptive Practice" quick action (`src/app/(tabs)/index.tsx`) calls `router.push('/practice/session')` directly without loading questions into `usePracticeStore`, unlike the Practice tab's `startAdaptivePractice()` which correctly fetches + sets questions first. Result: "No questions loaded" error screen. The Practice tab's own "Start Adaptive Practice" button works correctly.
2. Only 14 sample questions ship locally vs. the 50-question/14-category mock test design — real DVSA question bank needs Supabase configured to be meaningful at scale.
3. No env keys are configured (Supabase URL/key, Anthropic key, RevenueCat iOS key) — app runs entirely on local fallbacks; premium/AI features aren't live end-to-end without those.
4. Dev bundler (Metro) is heavy on this box; a production `expo export` build would behave differently/lighter than this preview.

## Verified working via screenshots
Onboarding carousel, Home tab (stats/quick actions/weak spots), Practice tab (adaptive + 14 category cards) all render correctly with real sample data and app branding.

## Next Action Items (deferred, pending user direction)
- Fix Home quick-action bug (#1 above) if user wants changes now.
- Ask user whether they want Supabase / Anthropic / RevenueCat keys wired in for real data + AI explanations + IAP.
- Populate full DVSA question bank (schema already defined in `supabase/schema.sql`) if going the Supabase route.
