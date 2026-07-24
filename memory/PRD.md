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

## Next Action Items
- Optional: add data-testid/accessibility props across interactive elements.
- Optional: render AI explanation markdown properly.
- Optional: spot-check a larger random sample of the 595 newly generated questions for factual accuracy (currently only manually reviewed a handful per category).
- Ask user if/when they want RevenueCat wired for real IAP.
