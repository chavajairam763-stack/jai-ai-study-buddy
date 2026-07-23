
## Vision

Rebuild JAI.AI as a premium, focused AI product. Black + graphite + gold glass theme (no purple). Seven tools. Real data everywhere — no dummy stats, no placeholder features. Native-feel PWA polish.

Tagline everywhere: **"One AI. Endless Possibilities."**

## The 7 Tools (sidebar after login)

1. **AI Chat Pro** — streaming markdown chat, saved per-conversation in Supabase, history sidebar
2. **AI Workspace** — upload PDFs/docs, extract text (PDF.js), ask questions, save generated notes
3. **AI Developer** — coding assistant with syntax-highlighted code blocks, language presets, copy/run-hints
4. **AI Research** — long-form research with structured sections and citations-style formatting
5. **AI Smart Calculator** — natural-language math → step-by-step LaTeX-rendered solution
6. **AI Automation** — describe a workflow → get a step-by-step plan + snippets (e.g. shell, cron, zapier-style)
7. **Market Insight (Educational)** — analyze a topic/company/sector with educational disclaimer, structured breakdown

Each tool = its own route, its own system prompt, its own UI shell — but shares one streaming chat engine.

## Design System (rewrite `src/styles.css`)

- Background: pure black `oklch(0.08 0 0)` with subtle graphite radial gradients
- Surface: graphite `oklch(0.16 0.005 260)` glass with 1px hairline borders
- Primary: warm gold `oklch(0.82 0.14 85)` (champagne, not yellow)
- Accent glow: soft gold at 20-30% opacity, no purple anywhere
- Typography: Space Grotesk display, Inter body, JetBrains Mono for code
- Rounded 2xl cards, refined shadows, `backdrop-filter: blur(24px)`
- Motion: 150-250ms cubic-bezier ease, spring on primary CTAs

## Data Model (Supabase migrations)

New/updated tables — all with RLS + GRANTs:

- `conversations` (id, user_id, tool, title, created_at, updated_at) — one row per chat thread across all 7 tools
- `chat_messages` — extend with `conversation_id` FK, keep existing role/content
- `notes` (id, user_id, title, content, source, created_at, updated_at)
- `bookmarks` (id, user_id, kind, ref_id, title, url, created_at)
- `profiles` — keep, drop unused fake fields (`study_streak`, `study_hours` stay but sourced from real activity)

## Dashboard (real data only)

Replace fake streak/goal cards with:

- Greeting with real user name
- **Real counters**: total conversations, messages this week, notes saved, bookmarks — all from Supabase
- **Recent conversations** list (from `conversations` table, links back into the tool)
- **Quick launch** grid of the 7 tools
- Empty states: warm "Start your first chat" cards — never fake numbers

## AI Chat Engine (shared)

- `src/routes/api/chat.ts` accepts `{ tool, messages, conversationId? }`
- Server picks system prompt from tool registry
- Streams via existing Lovable AI Gateway (`google/gemini-3.6-flash`)
- Client: persists user + assistant messages to Supabase (creates conversation on first message, auto-titles from first user turn)
- Streams tokens to UI, saves full assistant message on completion
- Markdown renderer already handles headings/tables/code/KaTeX — keep it

## Auth Speed Fix

- Remove `getUser()` roundtrip on protected `beforeLoad` — use cached `getSession()` (already partially done)
- Google OAuth: keep `lovable.auth.signInWithOAuth` but drop unnecessary pre-navigation session probe on `/auth` mount (currently blocks first paint)
- Preload `/dashboard` route on hover of login button

## Landing Page

Trim to: hero (tagline "One AI. Endless Possibilities."), 7-tool grid, single CTA. Remove pricing (no fake ₹199 tier), remove fake "10,000+ students" testimonial.

## Files touched

- New: `src/lib/tools.ts` (tool registry), `src/routes/_authenticated/workspace.tsx`, `developer.tsx`, `research.tsx`, `calculator.tsx`, `automation.tsx`, `market.tsx`
- Rewrite: `styles.css`, `app-sidebar.tsx`, `index.tsx`, `dashboard.tsx`, `chat.tsx`, `api/chat.ts`, `auth.tsx`
- Delete/redirect: old routes `pdf.tsx`, `notes.tsx`, `papers.tsx`, `exam.tsx`, `assignments.tsx`, `flashcards.tsx`, `planner.tsx`, `bookmarks.tsx` (bookmarks folds into workspace)
- New migration: `conversations`, `notes`, `bookmarks` tables + policies + grants

## Out of scope (would inflate this pass)

- Real payment/pricing
- Voice output (TTS) — voice input stays
- Live market data (Market Insight is educational analysis, not real quotes)

Approve and I'll execute in one pass.
