# AI Multi-Studio — Implementation Checklist

---

## Week 1 — Auth & Scaffold

- [x] TASK-01: Configure Appwrite Cloud project (collections, permissions, OAuth provider, storage bucket)
      FR/NFR: NFR-02, NFR-03, FR-AUTH-02
      DEC: DEC-01, DEC-05
      Blocks: TASK-02, TASK-03, TASK-09
      File(s): none (cloud configuration — sets env values for `.env.local`)

- [x] TASK-02: Build email/password register page
      FR/NFR: FR-AUTH-01
      DEC: none
      Blocks: none
      File(s): `src/app/(auth)/register/page.tsx`

- [x] TASK-03: Build login page with email and Google OAuth
      FR/NFR: FR-AUTH-01, FR-AUTH-02
      DEC: none
      Blocks: TASK-04
      File(s): `src/app/(auth)/login/page.tsx`

- [x] TASK-04: Implement edge middleware for dashboard route protection
      FR/NFR: FR-AUTH-03
      DEC: DEC-10, DEC-13
      Blocks: TASK-07
      File(s): `middleware.ts`
      Note: Use fetch() to call Appwrite REST /v1/account endpoint directly — do not import appwrite-server.ts or node-appwrite. See DEC-13.

- [x] TASK-05: Build Sidebar component with logout button
      FR/NFR: FR-AUTH-05
      DEC: none
      Blocks: TASK-07
      File(s): `src/components/layout/Sidebar.tsx`

- [x] TASK-06: Build TopBar component
      FR/NFR: NFR-05
      DEC: none
      Blocks: TASK-07
      File(s): `src/components/layout/TopBar.tsx`

- [x] TASK-07: Build dashboard root layout with profile auto-creation
      FR/NFR: FR-AUTH-04, FR-AUTH-03
      DEC: DEC-04
      Blocks: TASK-16, TASK-21, TASK-26, TASK-32, TASK-33, TASK-37
      File(s): `src/app/dashboard/layout.tsx`, `src/lib/appwrite-server.ts`

---

## Week 2 — Input Pipeline

- [x] TASK-08: Implement POST /api/scrape (Cheerio URL scraper, return title + text)
      FR/NFR: FR-INPUT-02, NFR-02
      DEC: DEC-07
      Blocks: TASK-13
      File(s): `src/app/api/scrape/route.ts`, `src/lib/cheerio.ts`

- [x] TASK-09: Implement POST /api/upload (private Appwrite Storage, return fileId + signed URL)
      FR/NFR: FR-INPUT-04, NFR-02, NFR-07
      DEC: DEC-01
      Blocks: TASK-10
      File(s): `src/app/api/upload/route.ts`, `src/lib/appwrite-server.ts`

- [x] TASK-10: Implement POST /api/transcribe (submit job to AssemblyAI, return transcriptId only)
      FR/NFR: FR-INPUT-04, NFR-02
      DEC: DEC-02
      Blocks: TASK-11
      File(s): `src/app/api/transcribe/route.ts`, `src/lib/assemblyai.ts`

- [x] TASK-11: Implement GET /api/transcribe/[id] (poll AssemblyAI for status and result)
      FR/NFR: FR-INPUT-06, NFR-02
      DEC: DEC-02
      Blocks: TASK-15
      File(s): `src/app/api/transcribe/[id]/route.ts`, `src/lib/assemblyai.ts`

- [x] TASK-12: Build SourceTypeSelector component (URL / Text / Audio tab switcher)
      FR/NFR: FR-INPUT-01
      DEC: none
      Blocks: TASK-16
      File(s): `src/components/input/SourceTypeSelector.tsx`

- [x] TASK-13: Build UrlInput component (calls /api/scrape, handles errors)
      FR/NFR: FR-INPUT-02, FR-INPUT-07
      DEC: DEC-07
      Blocks: TASK-16
      File(s): `src/components/input/UrlInput.tsx`

- [x] TASK-14: Build TextInput component (textarea with live character count)
      FR/NFR: FR-INPUT-03, FR-INPUT-07
      DEC: DEC-07
      Blocks: TASK-16
      File(s): `src/components/input/TextInput.tsx`

- [x] TASK-15: Build AudioUpload component (drag-and-drop, calls /api/upload then polls /api/transcribe/[id])
      FR/NFR: FR-INPUT-04, FR-INPUT-06, FR-INPUT-07, NFR-07
      DEC: DEC-01, DEC-02, DEC-07
      Blocks: TASK-16
      File(s): `src/components/input/AudioUpload.tsx`

- [x] TASK-16: Build new project page (assembles input components, creates project in Appwrite, navigates to processing)
      FR/NFR: FR-INPUT-01, FR-INPUT-05, FR-INPUT-07
      DEC: DEC-07
      Blocks: TASK-19
      File(s): `src/app/dashboard/new/page.tsx`, `src/lib/utils.ts`

---

## Week 3 — Generation Engine

- [x] TASK-18: Update Instagram prompt to return JSON object `{ slides: string[10], caption: string (≤150 chars), hashtags: string[30] }` per AI_LAYER.md instagram.ts
      FR/NFR: FR-GEN-01, section 4.4 (Instagram spec)
      DEC: DEC-06, DEC-18
      Blocks: TASK-25
      File(s): `src/lib/prompts/instagram.ts`

- [x] TASK-19: Implement POST /api/projects/[id]/generate (Promise.all across 3 AI calls, session auth, save outputs)
      FR/NFR: FR-GEN-01, FR-GEN-02, FR-GEN-03, FR-GEN-06, NFR-01, NFR-02
      DEC: DEC-05, DEC-06, DEC-11, DEC-14, DEC-15, DEC-16, DEC-17, DEC-18, DEC-19
      Blocks: TASK-20
      File(s): `src/app/api/projects/[id]/generate/route.ts`, `src/lib/ai.ts`, `src/lib/prompts/facebook.ts`, `src/lib/prompts/tiktok.ts`, `src/lib/prompts/instagram.ts`
      Note: CRITICAL — first line of route file must be `export const maxDuration = 60` before any imports (DEC-19). Instagram call uses response_format: { type: "json_object" } per DEC-18 — no retry needed. Validate slides.length === 10 AND hashtags.length === 30 as application guard. Follow DEC-14 for system/user message structure. Follow DEC-15 for source content truncation. Follow DEC-16 for temperature and max_tokens. Follow DEC-17 for empty response and refusal handling (AIEmptyResponseError, AIRefusalError). Use GROQ_API_KEY env var.

- [x] TASK-20: Implement GET /api/projects/[id]/status (return current project status field)
      FR/NFR: FR-GEN-03, FR-GEN-05
      DEC: DEC-03, DEC-05
      Blocks: TASK-21
      File(s): `src/app/api/projects/[id]/status/route.ts`

- [x] TASK-21: Build processing page (animated steps, polls /api/projects/[id]/status every 3s, redirects on done, errors after 20 attempts)
      FR/NFR: FR-GEN-04, FR-GEN-05
      DEC: DEC-03
      Blocks: TASK-26
      File(s): `src/app/dashboard/projects/[id]/processing/page.tsx`

---

## Week 4 — Preview & Edit

- [x] TASK-22: Build ChannelTabs component (Facebook / TikTok / Instagram tab switcher)
      FR/NFR: FR-PREV-01
      DEC: none
      Blocks: TASK-26
      File(s): `src/components/preview/ChannelTabs.tsx`

- [x] TASK-23: Build FacebookPreview component (post card, character/word count badge)
      FR/NFR: FR-PREV-02, FR-PREV-03
      DEC: none
      Blocks: TASK-26
      File(s): `src/components/preview/FacebookPreview.tsx`

- [x] TASK-24: Build TikTokPreview component (script format with scene labels, count badge)
      FR/NFR: FR-PREV-02, FR-PREV-03
      DEC: none
      Blocks: TASK-26
      File(s): `src/components/preview/TikTokPreview.tsx`

- [x] TASK-25: Build InstagramPreview component (10-slide carousel mockup via JSON.parse, count badge)
      FR/NFR: FR-PREV-02, FR-PREV-03
      DEC: DEC-06
      Blocks: TASK-26
      File(s): `src/components/preview/InstagramPreview.tsx`

- [x] TASK-26: Build preview page (fetches project + outputs, renders ChannelTabs, inline edit, export buttons)
      FR/NFR: FR-PREV-01, FR-PREV-02, FR-PREV-03
      DEC: none
      Blocks: TASK-36
      File(s): `src/app/dashboard/projects/[id]/page.tsx`

- [x] TASK-27: Implement PUT /api/outputs/[id] (inline edit save, session auth)
      FR/NFR: FR-PREV-04, NFR-02
      DEC: DEC-05
      Blocks: none
      File(s): `src/app/api/outputs/[id]/route.ts`

- [x] TASK-17: Create src/lib/ai.ts with generateContent() and streamContent() using @google/generative-ai SDK
      FR/NFR: FR-PREV-05, NFR-02
      DEC: DEC-09, DEC-14, DEC-15, DEC-16, DEC-17, DEC-19
      Blocks: TASK-28
      File(s): `src/lib/ai.ts`
      Note: Follow DEC-14 for system/user message structure. Follow DEC-15 for source content truncation. Follow DEC-16 for temperature and max_tokens (Groq params). Follow DEC-17 for empty response and refusal handling (throw AIEmptyResponseError / AIRefusalError). SDK: groq-sdk. API key: GROQ_API_KEY.

- [x] TASK-28: Implement POST /api/outputs/[id]/regenerate (calls streamContent(), returns ReadableStream)
      FR/NFR: FR-PREV-05, NFR-02
      DEC: DEC-05, DEC-09, DEC-19
      Blocks: none
      File(s): `src/app/api/outputs/[id]/regenerate/route.ts`, `src/lib/ai.ts`
      Note: CRITICAL — first line must be `export const maxDuration = 60` (DEC-19). Implement using TransformStream — pipe chunks to Response AND accumulate for Appwrite DB write after stream closes. Do not await stream before returning Response (breaks streaming UX). Do not skip DB write (breaks inline edit state).

- [x] TASK-29: Build image-prompt system prompt
      FR/NFR: FR-PREV-06
      DEC: DEC-12
      Blocks: TASK-30
      File(s): `src/lib/prompts/image-prompt.ts`

- [x] TASK-30: Implement POST /api/outputs/[id]/image-prompt (calls Claude, saves to imagePrompt field)
      FR/NFR: FR-PREV-06, NFR-02
      DEC: DEC-05, DEC-12
      Blocks: TASK-31
      File(s): `src/app/api/outputs/[id]/image-prompt/route.ts`

- [x] TASK-31: Build ImagePromptButton component (triggers /api/outputs/[id]/image-prompt, displays result)
      FR/NFR: FR-PREV-06
      DEC: DEC-12
      Blocks: none
      File(s): `src/components/preview/ImagePromptButton.tsx`

---

## Week 5 — Brand Voice & Settings

- [x] TASK-32: Build settings page (display name, avatar upload, brand voice selector, keyword tag input)
      FR/NFR: FR-SET-01, FR-SET-02, FR-SET-03, FR-SET-04
      DEC: none
      Blocks: none
      File(s): `src/app/dashboard/settings/page.tsx`

- [x] TASK-33: Build dashboard home page (project grid with status badges, quick stats cards)
      FR/NFR: FR-DASH-01, FR-DASH-02
      DEC: none
      Blocks: TASK-34, TASK-35, TASK-39
      File(s): `src/app/dashboard/page.tsx`

- [x] TASK-34: Add source-type filter and title search to dashboard
      FR/NFR: FR-DASH-03
      DEC: none
      Blocks: none
      File(s): `src/app/dashboard/page.tsx`

- [x] TASK-35: Implement cascade project delete (schedules → outputs → project, confirmation dialog)
      FR/NFR: FR-DASH-04
      DEC: DEC-08
      Blocks: none
      File(s): `src/app/dashboard/page.tsx`

- [x] TASK-39: Build analytics stats cards (total projects, outputs by platform, projects this week)
      FR/NFR: FR-ANAL-01
      DEC: none
      Blocks: TASK-40
      File(s): `src/app/dashboard/page.tsx`

- [x] TASK-40: Build Recharts bar chart (projects created per day, last 7 days)
      FR/NFR: FR-ANAL-02
      DEC: none
      Blocks: none
      File(s): `src/app/dashboard/page.tsx`

---

## Week 6 — Export, Scheduler & Analytics

- [x] TASK-36: Implement export features on preview page (clipboard copy, .txt download per channel, .json download all)
      FR/NFR: FR-EXP-01, FR-EXP-02, FR-EXP-03
      DEC: none
      Blocks: none
      File(s): `src/app/dashboard/projects/[id]/page.tsx`

- [x] TASK-37: Build scheduler page (list all scheduled posts with status badges)
      FR/NFR: FR-SCHED-03, FR-SCHED-04
      DEC: none
      Blocks: TASK-38
      File(s): `src/app/dashboard/scheduler/page.tsx`

- [x] TASK-38: Implement schedule creation (date/time picker on preview page, saves to schedules collection)
      FR/NFR: FR-SCHED-01, FR-SCHED-02, FR-SCHED-04
      DEC: none
      Blocks: none
      File(s): `src/app/dashboard/scheduler/page.tsx`, `src/app/dashboard/projects/[id]/page.tsx`

- [x] TASK-41: Add React error boundaries to all major pages
      FR/NFR: NFR-06
      DEC: none
      Blocks: none
      File(s): `src/app/dashboard/page.tsx`, `src/app/dashboard/new/page.tsx`, `src/app/dashboard/projects/[id]/page.tsx`, `src/app/dashboard/projects/[id]/processing/page.tsx`, `src/app/dashboard/settings/page.tsx`, `src/app/dashboard/scheduler/page.tsx`
      Note: `src/components/ErrorBoundary.tsx` class component created; all 6 pages import and wrap main return with <ErrorBoundary>

- [x] TASK-42: Mobile responsiveness pass (dashboard, preview, new project pages)
      FR/NFR: NFR-05
      DEC: none
      Blocks: none
      File(s): `src/app/dashboard/page.tsx`, `src/app/dashboard/new/page.tsx`, `src/app/dashboard/projects/[id]/page.tsx`
      UI changes:
        - `src/app/layout.tsx` + `src/app/dashboard/layout.tsx`: removed `flex` from body, added `w-full` + `overflow-x-hidden` — fixes right-side viewport gap
        - `src/app/dashboard/projects/[id]/processing/page.tsx`: replaced light-mode colours with dark theme palette
        - `src/app/dashboard/new/page.tsx`: two-column layout (lg:grid-cols-2), contextual right panel, confirm-before-generate flow
        - `src/components/layout/Sidebar.tsx`: w-14 md:w-60, icon-only below md breakpoint, labels hidden md:inline

---

## Deployment

- [~] TASK-43: Deploy to Vercel (Step 14.2)
      Status: Deployed — https://multi-studio.vercel.app (production, 2026-04-26)
      Env vars: All 11 vars set in Vercel Production environment
      Build: ✓ Compiled successfully, 16 pages, 0 errors
      APPWRITE_API_KEY: confirmed server-only, not in any client bundle
      Pending: E2E checklist not yet run
      Before E2E test, complete these manual Appwrite/Google steps:
        1. Appwrite Console → Auth → Settings → Allowed Hostnames → add `multi-studio.vercel.app`
        2. Google Cloud Console → OAuth client → Authorized redirect URIs → add `https://multi-studio.vercel.app/login`
        3. Appwrite Console → Auth → OAuth2 → Google → redirect URI → add `https://multi-studio.vercel.app`
      E2E checklist (run on live URL after above steps):
        [ ] Register with new email → profile auto-created
        [ ] Login with Google OAuth → redirected to dashboard
        [ ] New project via URL scrape → generate → processing page → preview
        [ ] Edit one output inline → save
        [ ] Regenerate one channel → new content streams in
        [ ] Export → download .json → confirm 3 channel keys present
        [ ] Schedule one post → Scheduler page shows it

---

## Week 7 — Platform Completeness (Expansion)

- [x] TASK-44: Add LinkedIn and Twitter to generate route Promise.all (5 channels)
      FR/NFR: FR-LTW-04, NFR-01
      DEC: DEC-20, DEC-19
      Blocks: TASK-45, TASK-46, TASK-47
      File(s): `src/app/api/projects/[id]/generate/route.ts`
      Note: Add linkedin and twitter `generateContent()` calls to the existing `Promise.all([facebook, tiktok, instagram])` array. Route now creates 5 output documents. Verify `maxDuration = 60` is still the first line (DEC-19). Total wall time remains bounded by slowest single call.

- [x] TASK-45: Build LinkedInPreview component (article card + word count badge)
      FR/NFR: FR-LTW-02, FR-PREV-02, FR-PREV-03
      DEC: DEC-20
      Blocks: TASK-47
      File(s): `src/components/preview/LinkedInPreview.tsx`
      Note: Plain-text article card styled to resemble LinkedIn post UI. Word count badge in top-right corner. Inline edit textarea on click (same pattern as FacebookPreview). "Restore Previous Version" button when `previousContent` is non-empty (added in TASK-53).

- [x] TASK-46: Build TwitterPreview component (per-tweet card array + char count badge)
      FR/NFR: FR-LTW-03, FR-PREV-02, FR-PREV-03
      DEC: DEC-20
      Blocks: TASK-47
      File(s): `src/components/preview/TwitterPreview.tsx`
      Note: Parse `N/` format by splitting on line breaks; render each tweet as a separate card. Per-tweet character count badge — turns amber >240 chars, red >280 chars. Inline edit on the full raw text (not per-tweet) to keep edit logic simple.

- [x] TASK-47: Expand ChannelTabs to 5 tabs; wire LinkedIn + Twitter into preview page
      FR/NFR: FR-LTW-01, FR-PREV-01
      DEC: DEC-20
      Blocks: none
      File(s): `src/components/preview/ChannelTabs.tsx`, `src/app/dashboard/projects/[id]/page.tsx`
      Note: Add LinkedIn and Twitter tab buttons. Update the preview page output lookup to find the linkedin and twitter output documents. Pass them to the new preview components. Update the export functions (.txt and .json) to include all 5 channels.

- [x] TASK-48: Build polished marketing landing page
      FR/NFR: none (portfolio quality)
      DEC: none
      Blocks: none
      File(s): `src/app/page.tsx`
      Note: Sections in order — (1) Hero: animated gradient headline "One input → 5 platform-native posts in seconds", two CTA buttons (Try Free → /register, See Features → scroll); (2) Features: 3-column card grid for URL scraping, audio transcription, brand voice, 5 channels, inline edit, export; (3) How it works: 3-step visual flow (Input → Generate → Export); (4) Tech stack badges row; (5) Footer with nav links. Use only Tailwind CSS — no extra animation library.

- [x] TASK-49: Build ProjectCardSkeleton and EmptyDashboard components
      FR/NFR: FR-UI-01, FR-UI-02
      DEC: none
      Blocks: TASK-50
      File(s): `src/components/ui/ProjectCardSkeleton.tsx`, `src/components/ui/EmptyDashboard.tsx`
      Note: ProjectCardSkeleton — Tailwind `animate-pulse` gray rectangles matching the project card shape (title bar, source type badge, status badge, date). Render 6 skeletons while loading. EmptyDashboard — inline SVG illustration + "Start your first project" headline + Link to /dashboard/new.

- [x] TASK-50: Integrate skeletons and empty state into dashboard
      FR/NFR: FR-UI-01, FR-UI-02
      DEC: none
      Blocks: none
      File(s): `src/app/dashboard/page.tsx`
      Note: Add loading boolean state. Show `ProjectCardSkeleton` × 6 while fetching. Show `EmptyDashboard` when `projects.length === 0` and not loading. Also apply skeleton to Recharts bar chart placeholder (a `h-[300px] bg-gray-800 rounded animate-pulse` div) during the analytics data fetch.

- [x] TASK-51: Update analytics to include LinkedIn and Twitter in platform breakdown
      FR/NFR: FR-ANAL-03, FR-LTW-05
      DEC: none
      Blocks: none
      File(s): `src/app/dashboard/page.tsx`
      Note: The "outputs by platform" stat card already groups by channel. Ensure LinkedIn and Twitter are included in the count now that they are generated. No schema change required.

---

## Week 8 — User Experience Polish (Expansion)

- [x] TASK-52: Build PUT /api/projects/[id]/source route (update sourceContent + title)
      FR/NFR: FR-SRC-03, FR-SRC-04, NFR-02
      DEC: DEC-05, DEC-25
      Blocks: TASK-53
      File(s): `src/app/api/projects/[id]/source/route.ts`
      Note: Accepts `{ sourceContent?: string, title?: string, summarisedContent?: string }`. Verifies session ownership (DEC-05). Updates only the provided fields. Returns `{ id, title, sourceContent, updatedAt }`. Do not allow status field changes via this route.

- [x] TASK-53: Build source content preview + edit panel on new project page
      FR/NFR: FR-SRC-01, FR-SRC-02, FR-SRC-03, FR-SRC-04
      DEC: DEC-15, DEC-25
      Blocks: none
      File(s): `src/app/dashboard/new/page.tsx`
      Note: After input completes (URL scraped / text entered / audio transcribed), show an expandable collapsible panel labelled "Source Preview". Contains: (a) editable textarea showing `sourceContent`; (b) live character count — amber at 10,000 chars, red at 12,000 (DEC-15 truncation boundary); (c) inline title field (editable); (d) if `sourceContent.length > 8,000`, show summarisation banner (FR-SUMM-02). On textarea blur, call `PUT /api/projects/[id]/source` to persist changes before the Generate button is clicked.

- [x] TASK-54: Add previousContent field to Appwrite outputs collection
      FR/NFR: FR-HIST-01
      DEC: DEC-22
      Blocks: TASK-55, TASK-56
      File(s): Appwrite Console (add attribute) — no code file
      Note: String attribute, optional, default `""`, size 65535 (same as content field). This is a schema change only; the application reads/writes it via the standard `databases.updateDocument()` call.

- [x] TASK-55: Update PUT /api/outputs/[id] to copy content → previousContent before overwriting
      FR/NFR: FR-HIST-01, FR-HIST-02
      DEC: DEC-22
      Blocks: TASK-56
      File(s): `src/app/api/outputs/[id]/route.ts`
      Note: Before calling `databases.updateDocument({ content: newContent })`, first read the current document to get `existing.content`. Then update with `{ content: newContent, previousContent: existing.content }` in a single `updateDocument` call. This adds one extra Appwrite read per inline edit save — acceptable overhead.

- [x] TASK-56: Update regenerate route to copy content → previousContent before overwriting
      FR/NFR: FR-HIST-01
      DEC: DEC-22
      Blocks: TASK-57
      File(s): `src/app/api/outputs/[id]/regenerate/route.ts`
      Note: After the stream closes and before writing the accumulated content to Appwrite, read the current output document to capture `existing.content`. Write `{ content: accumulated, previousContent: existing.content }` in the `updateDocument` call. The read must happen after the stream closes — do not add latency to the streaming path itself.

- [x] TASK-57: Add "Restore Previous Version" button to all 5 preview components
      FR/NFR: FR-HIST-02, FR-HIST-03
      DEC: DEC-22
      Blocks: none
      File(s): `src/components/preview/FacebookPreview.tsx`, `src/components/preview/TikTokPreview.tsx`, `src/components/preview/InstagramPreview.tsx`, `src/components/preview/LinkedInPreview.tsx`, `src/components/preview/TwitterPreview.tsx`
      Note: Render the button only when `output.previousContent` is non-empty. On click, call `PUT /api/outputs/[id]` with `{ content: output.previousContent }`. The route will copy the current (to-be-replaced) content into `previousContent`, making the swap bidirectional. Show a `toast.success("Restored previous version")`.

- [x] TASK-58: Build POST /api/projects/[id]/duplicate route
      FR/NFR: FR-DUP-02, NFR-02
      DEC: DEC-05, DEC-23
      Blocks: TASK-59
      File(s): `src/app/api/projects/[id]/duplicate/route.ts`
      Note: Reads the source project (verify session ownership per DEC-05). Creates a new `projects` document with: `userId` (from session), `title` (original + " (copy)"), `sourceType`, `sourceContent`, `summarisedContent` (if present), `audioFileId: ""`, `transcription: ""`, `status: "pending"`, `createdAt/updatedAt` set to now. Returns `{ newProjectId }`. Does NOT copy outputs (DEC-23).

- [x] TASK-59: Add "Duplicate" button to dashboard project cards
      FR/NFR: FR-DUP-01, FR-DUP-03
      DEC: DEC-23
      Blocks: none
      File(s): `src/app/dashboard/page.tsx`
      Note: Add a duplicate icon button (copy icon) to each project card alongside the existing delete button. On click, call `POST /api/projects/[id]/duplicate`. On success, navigate to the new project page (`/dashboard/projects/[newProjectId]`) which will show the source content and allow the user to trigger generation. Show a `toast.success("Project duplicated")`.

- [x] TASK-60: Build enhanced analytics charts (platform breakdown + source type + 28-day trend)
      FR/NFR: FR-ANAL-03, FR-ANAL-04, FR-ANAL-05, FR-ANAL-06
      DEC: none
      Blocks: none
      File(s): `src/app/dashboard/page.tsx`
      Note: (1) Platform breakdown — `BarChart` grouping `outputs` by `channel` (all 5 platforms). (2) Source type distribution — `PieChart` or `BarChart` grouping `projects` by `sourceType`. (3) Extend the existing 7-day chart to 28 days using `LineChart` (change filter from `createdAt >= 7DaysAgo` to `createdAt >= 28DaysAgo`). (4) Add two computed stat cards: "Avg outputs/project" and "Most active day". All data comes from existing `projects` and `outputs` Appwrite queries — no new routes needed.

---

## Week 9 — AI Intelligence Layer (Expansion)

- [x] TASK-61: Write quality-score system prompt
      FR/NFR: FR-SCORE-01, FR-SCORE-02, FR-SCORE-06
      DEC: DEC-21
      Blocks: TASK-62, TASK-63
      File(s): `src/lib/prompts/quality-score.ts`
      Note: Build function `buildQualityScorePrompt(channel: string, brandVoice: string): { system: string, user: string }`. System role: instructs the model to evaluate on 4 criteria (hook 0–25, cta 0–25, platformFit 0–25, brandAlignment 0–25) and return ONLY valid JSON `{ total: N, hook: N, cta: N, platformFit: N, brandAlignment: N, tip: "string" }`. User role: `"Evaluate this [channel] post:\n\n[POST_CONTENT]"`. Follow DEC-14 role structure.

- [x] TASK-62: Implement POST /api/outputs/[id]/score route
      FR/NFR: FR-SCORE-01, FR-SCORE-02, NFR-02
      DEC: DEC-05, DEC-21
      Blocks: TASK-63
      File(s): `src/app/api/outputs/[id]/score/route.ts`
      Note: Verify session ownership (DEC-05). Fetch output to get `content` and `channel`. Call `generateContent()` with `buildQualityScorePrompt(channel, profile.brandVoice)` using `temperature: 0.2` and `response_format: { type: "json_object" }`. Validate parsed result has all 5 numeric fields; `total` must equal `hook + cta + platformFit + brandAlignment`. Save raw JSON string to `outputs.qualityScore`. Return `{ qualityScore }` to client. Add `export const maxDuration = 60` as first line (DEC-19).

- [x] TASK-63: Build QualityScoreBadge component
      FR/NFR: FR-SCORE-03, FR-SCORE-04
      DEC: DEC-21
      Blocks: TASK-64
      File(s): `src/components/preview/QualityScoreBadge.tsx`
      Note: SVG circle ring showing `total` out of 100. Ring colour: green (`stroke-green-500`) for ≥80, amber (`stroke-amber-400`) for 60–79, red (`stroke-red-500`) for <60. Score number centred inside ring. Tooltip/popover on click shows the 4 sub-scores (hook, CTA, platform fit, brand alignment) as a small grid, plus the improvement tip. Show "—" placeholder when `qualityScore` is empty or null. Accept `qualityScore` string prop; call `JSON.parse` internally with try/catch.

- [x] TASK-64: Auto-trigger quality score after initial generation and after regeneration
      FR/NFR: FR-SCORE-01, FR-SCORE-05
      DEC: DEC-21
      Blocks: none
      File(s): `src/app/dashboard/projects/[id]/page.tsx`
      Note: After the preview page mounts and outputs are fetched, check each output for an empty `qualityScore` field. For each missing score, call `POST /api/outputs/[id]/score`. Fire these calls in parallel (Promise.all) to avoid sequential delay. After each regeneration stream closes, re-call the score endpoint for that channel only. Update local output state with the returned score so the badge renders without a page reload.

- [x] TASK-65: Write source summarization prompt
      FR/NFR: FR-SUMM-01, FR-SUMM-03
      DEC: DEC-25
      Blocks: TASK-66
      File(s): `src/lib/prompts/summarize.ts`
      Note: Build function `buildSummarizePrompt(): { system: string, user: string }`. System role: "Summarise the following article/transcript for social media content creation. Preserve: key arguments, statistics, quotes, main thesis, any call to action. Remove: filler, repetition, boilerplate, metadata. Target: 2,500–3,000 characters. Output plain text only — no headings, no bullet points, no markdown." User role: `"Summarise the following content:\n\n[SOURCE_CONTENT]"`.

- [x] TASK-66: Implement source summarization in new project page
      FR/NFR: FR-SUMM-01, FR-SUMM-02, FR-SUMM-04
      DEC: DEC-25
      Blocks: none
      File(s): `src/app/dashboard/new/page.tsx`, `src/app/api/projects/[id]/source/route.ts`
      Note: After input completes and `sourceContent.length > 8000`, call a new internal endpoint (or inline within `PUT /api/projects/[id]/source`) that runs `generateContent(buildSummarizePrompt(), sourceContent)` and saves the result to `projects.summarisedContent`. Show a summarisation banner in the source preview panel (TASK-53): "Source summarised: [X chars → Y chars]. Generation will use summarised version." Include a "Show original" toggle that expands to show the full original. Use `temperature: 0.3` for summarisation calls.

- [x] TASK-67: Update generate route to use summarisedContent when present
      FR/NFR: FR-SUMM-03
      DEC: DEC-25, DEC-15
      Blocks: none
      File(s): `src/app/api/projects/[id]/generate/route.ts`
      Note: Change the source content selection from `project.sourceContent` to `project.summarisedContent || project.sourceContent`. The DEC-15 truncation guard (`MAX_SOURCE_CONTENT_LENGTH = 12000`) is kept as the final fallback and should not trigger for summarised content (which targets 2,500–3,000 chars).

- [x] TASK-68: Write hashtag-optimizer prompt
      FR/NFR: FR-HASH-01, FR-HASH-02, FR-HASH-04
      DEC: DEC-26
      Blocks: TASK-69
      File(s): `src/lib/prompts/hashtag-optimizer.ts`
      Note: Build function `buildHashtagOptimizerPrompt(): { system: string, user: string }`. System role instructs the model to analyse the provided carousel slides and return ONLY valid JSON `{ hashtags: [exactly 30 lowercase strings without # prefix] }` using the three-tier strategy (10 broad >1M posts / 10 niche 100K–1M / 10 specific <100K posts). Use `response_format: { type: "json_object" }` and `temperature: 0.4`. User role: `"Optimise hashtags for this Instagram carousel:\n\n[SLIDES_CONTENT]"`.

- [x] TASK-69: Implement POST /api/outputs/[id]/hashtags route
      FR/NFR: FR-HASH-02, FR-HASH-03, NFR-02
      DEC: DEC-05, DEC-26
      Blocks: TASK-70
      File(s): `src/app/api/outputs/[id]/hashtags/route.ts`
      Note: Verify session ownership (DEC-05). Fetch output; verify `channel === "instagram"` (return 400 otherwise). Parse `output.content` JSON to get `{ slides, caption, hashtags }`. Concatenate slides as plain text for the prompt input. Call `generateContent()` with `buildHashtagOptimizerPrompt()`. Parse result, validate `hashtags.length === 30`. Reconstruct: `JSON.stringify({ slides: existing.slides, caption: existing.caption, hashtags: newHashtags })`. Save via `databases.updateDocument({ content: reconstructed })`. Return `{ hashtags: newHashtags }`.

- [x] TASK-70: Add "Refresh Hashtags" button to InstagramPreview
      FR/NFR: FR-HASH-01
      DEC: DEC-26
      Blocks: none
      File(s): `src/components/preview/InstagramPreview.tsx`
      Note: Add a "Refresh Hashtags" button in the hashtag section of `InstagramPreview.tsx`. On click, call `POST /api/outputs/[id]/hashtags`. Show a loading spinner on the button during the call. On success, update the local output state with the returned hashtags (re-parse the full content JSON). Show `toast.success("Hashtags refreshed")`. Keep the existing "Regenerate" button unchanged — hashtag refresh is a targeted sub-operation.

- [x] TASK-71: Build ToneCompareModal component
      FR/NFR: FR-COMP-01, FR-COMP-02, FR-COMP-04, FR-COMP-05
      DEC: DEC-24
      Blocks: TASK-72
      File(s): `src/components/preview/ToneCompareModal.tsx`
      Note: Modal contains: (a) two tone selectors (dropdowns for `energetic | educational | funny | calm`) pre-populated with user's current `brandVoice` and one adjacent tone; (b) "Compare" button that triggers the API call; (c) two-column layout showing generated content side-by-side in read-only text areas labelled "Tone A" and "Tone B"; (d) "Use This Version" button under each column. The modal holds both content strings in local state only — nothing is auto-saved (DEC-24).

- [x] TASK-72: Implement POST /api/projects/[id]/compare route
      FR/NFR: FR-COMP-03, NFR-02
      DEC: DEC-05, DEC-24
      Blocks: none
      File(s): `src/app/api/projects/[id]/compare/route.ts`
      Note: Accepts `{ outputId: string, toneA: BrandVoice, toneB: BrandVoice }`. Verify session ownership on both the project and the output (DEC-05). Fetch project's `summarisedContent || sourceContent` and the output's `channel`. Build the channel prompt twice using `buildBrandVoicePrompt(toneA, keywords)` and `buildBrandVoicePrompt(toneB, keywords)`. Fire both `generateContent()` calls via `Promise.all`. Return `{ contentA: string, contentB: string }`. Nothing is written to DB (DEC-24). Add `export const maxDuration = 60` as first line (DEC-19).

- [x] TASK-73: Wire "Compare Tones" button into preview page
      FR/NFR: FR-COMP-01, FR-COMP-05
      DEC: DEC-24
      Blocks: none
      File(s): `src/app/dashboard/projects/[id]/page.tsx`
      Note: Add "Compare Tones" button in the header of the active channel tab (alongside the existing "Regenerate" button). On click, open `ToneCompareModal` passing `outputId` (the current channel's output ID), the user's `brandVoice`, and the project ID. When "Use This Version" is clicked inside the modal, call `PUT /api/outputs/[id]` with the chosen content string, close the modal, and update local state.

---

## Week 10 — Power Features + Demo Preparation (Expansion)

- [x] TASK-74: Build CalendarWeekView component
      FR/NFR: FR-SCHED-05, FR-SCHED-06, FR-SCHED-07, FR-SCHED-08
      DEC: none
      Blocks: TASK-75
      File(s): `src/components/scheduler/CalendarWeekView.tsx`
      Note: CSS Grid, 8 columns: first column for hour labels (07:00–22:00), 7 columns for Mon–Sun. Each cell is a fixed-height div. Schedules are positioned using `style={{ gridRow: ... }}` based on `scheduledAt` hour. Colour-coded pills: `bg-blue-600` Facebook, `bg-red-500` TikTok, `bg-orange-500` Instagram, `bg-blue-900` LinkedIn, `bg-gray-900` Twitter. Pill shows truncated project title (20 chars max). Accept `schedules: Schedule[]` and `weekStart: Date` as props; filter client-side.

- [x] TASK-75: Integrate CalendarWeekView into scheduler page with view toggle
      FR/NFR: FR-SCHED-05, FR-SCHED-08
      DEC: none
      Blocks: none
      File(s): `src/app/dashboard/scheduler/page.tsx`
      Note: Add a "Calendar / List" toggle button group at the top of the scheduler page. Maintain `viewMode: "calendar" | "list"` in local state. Render `CalendarWeekView` in calendar mode (pass all fetched schedules and current `weekStart` state). Add `weekStart` state (defaults to start of current week, Monday). "← Previous Week" and "Next Week →" buttons decrement/increment `weekStart` by 7 days. All filtering is client-side — no new API routes.

- [x] TASK-76: Add quick-win — one-click hashtag copy to InstagramPreview
      FR/NFR: FR-UI-03
      DEC: none
      Blocks: none
      File(s): `src/components/preview/InstagramPreview.tsx`
      Note: Add "Copy all hashtags" button in the hashtag section. On click, format the `hashtags` array as `#tag1 #tag2 #tag3 ...` and write to clipboard via `navigator.clipboard.writeText()`. Show `toast.success("30 hashtags copied")`. This is separate from the existing "Copy" button that copies the full output content.

- [x] TASK-77: Add quick-win — live character/word count in inline edit mode
      FR/NFR: FR-UI-05
      DEC: none
      Blocks: none
      File(s): `src/components/preview/FacebookPreview.tsx`, `src/components/preview/LinkedInPreview.tsx`, `src/components/preview/TikTokPreview.tsx`, `src/components/preview/TwitterPreview.tsx`
      Note: When the inline edit textarea is active, show a live count badge below the textarea. Platform limits: Facebook ≤600 words (amber >480, red >600); LinkedIn ≤400 words; TikTok ≤160 words; Twitter (per tweet) ≤280 chars. The badge updates on every `onChange` event. Use word count (split on whitespace) for paragraph-format channels, character count for Twitter.

- [x] TASK-78: Run full E2E checklist on live Vercel URL (expansion features)
      FR/NFR: All expansion FRs
      DEC: none
      Blocks: none
      File(s): `src/app/page.tsx` (code fix: added id="features" to features section; changed hero second CTA from "Sign in → /login" to "See features → #features")
      Code fix applied 2026-04-30: hero second CTA now scrolls to #features per TASK-48 spec.
      E2E checklist — expansion features (run on https://multi-studio.vercel.app):
        [x] Generate project → preview shows 5 tabs (Facebook, TikTok, Instagram, LinkedIn, Twitter)
        [x] LinkedIn and Twitter outputs have correct format (article / N/ thread)
        [x] Quality score badge appears on each tab within 10 seconds of page load
        [x] Click score badge → sub-scores and tip visible in tooltip
        [x] Regenerate one channel → score badge updates after regeneration
        [x] Edit output inline → "Restore Previous Version" button appears → click restores content
        [x] New project page shows source preview panel after URL scrape
        [x] Edit source text → confirm updated content used in generation
        [x] Duplicate a project → new project card appears on dashboard → generate works
        [x] Compare Tones modal opens → generates two versions → "Use This Version" saves content
        [x] Instagram preview → "Refresh Hashtags" button → new hashtags replace existing
        [x] Scheduler → toggle Calendar view → current week's scheduled posts appear as pills
        [x] Week navigation (← →) works correctly in calendar view
        [x] Dashboard shows skeleton cards while loading; empty state shows for new user
        [x] Landing page loads correctly; CTA buttons navigate to /register and scroll to features

- [ ] TASK-79: Prepare demo script and record demo video
      FR/NFR: none (portfolio deliverable)
      DEC: none
      Blocks: none
      File(s): none
      Note: Write a 3-minute demo script covering: (1) landing page overview; (2) new project via audio upload; (3) transcription → source preview → edit; (4) generation → processing animation; (5) 5-channel preview tabs; (6) quality score badge + tip; (7) compare two tones; (8) export .json; (9) schedule post → calendar view; (10) dashboard analytics. Record using screen capture. Upload to portfolio.
