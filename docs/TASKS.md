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

- [ ] TASK-19: Implement POST /api/projects/[id]/generate (Promise.all across 3 AI calls, session auth, save outputs)
      FR/NFR: FR-GEN-01, FR-GEN-02, FR-GEN-03, FR-GEN-06, NFR-01, NFR-02
      DEC: DEC-05, DEC-06, DEC-11, DEC-14, DEC-15, DEC-16, DEC-17, DEC-18, DEC-19
      Blocks: TASK-20
      File(s): `src/app/api/projects/[id]/generate/route.ts`, `src/lib/ai.ts`, `src/lib/prompts/facebook.ts`, `src/lib/prompts/tiktok.ts`, `src/lib/prompts/instagram.ts`
      Note: CRITICAL — first line of route file must be `export const maxDuration = 60` before any imports (DEC-19). Instagram call uses responseMimeType: "application/json" per DEC-18 — no retry needed. Validate slides.length === 10 AND hashtags.length === 30 as application guard. Follow DEC-14 for system/user message structure. Follow DEC-15 for source content truncation. Follow DEC-16 for temperature and maxOutputTokens. Follow DEC-17 for empty response and refusal handling (AIEmptyResponseError, AIRefusalError). Use GOOGLE_AI_API_KEY env var.

- [ ] TASK-20: Implement GET /api/projects/[id]/status (return current project status field)
      FR/NFR: FR-GEN-03, FR-GEN-05
      DEC: DEC-03, DEC-05
      Blocks: TASK-21
      File(s): `src/app/api/projects/[id]/status/route.ts`

- [ ] TASK-21: Build processing page (animated steps, polls /api/projects/[id]/status every 3s, redirects on done, errors after 20 attempts)
      FR/NFR: FR-GEN-04, FR-GEN-05
      DEC: DEC-03
      Blocks: TASK-26
      File(s): `src/app/dashboard/projects/[id]/processing/page.tsx`

---

## Week 4 — Preview & Edit

- [ ] TASK-22: Build ChannelTabs component (Facebook / TikTok / Instagram tab switcher)
      FR/NFR: FR-PREV-01
      DEC: none
      Blocks: TASK-26
      File(s): `src/components/preview/ChannelTabs.tsx`

- [ ] TASK-23: Build FacebookPreview component (post card, character/word count badge)
      FR/NFR: FR-PREV-02, FR-PREV-03
      DEC: none
      Blocks: TASK-26
      File(s): `src/components/preview/FacebookPreview.tsx`

- [ ] TASK-24: Build TikTokPreview component (script format with scene labels, count badge)
      FR/NFR: FR-PREV-02, FR-PREV-03
      DEC: none
      Blocks: TASK-26
      File(s): `src/components/preview/TikTokPreview.tsx`

- [ ] TASK-25: Build InstagramPreview component (10-slide carousel mockup via JSON.parse, count badge)
      FR/NFR: FR-PREV-02, FR-PREV-03
      DEC: DEC-06
      Blocks: TASK-26
      File(s): `src/components/preview/InstagramPreview.tsx`

- [ ] TASK-26: Build preview page (fetches project + outputs, renders ChannelTabs, inline edit, export buttons)
      FR/NFR: FR-PREV-01, FR-PREV-02, FR-PREV-03
      DEC: none
      Blocks: TASK-36
      File(s): `src/app/dashboard/projects/[id]/page.tsx`

- [ ] TASK-27: Implement PUT /api/outputs/[id] (inline edit save, session auth)
      FR/NFR: FR-PREV-04, NFR-02
      DEC: DEC-05
      Blocks: none
      File(s): `src/app/api/outputs/[id]/route.ts`

- [ ] TASK-17: Create src/lib/ai.ts with generateContent() and streamContent() using @google/generative-ai SDK
      FR/NFR: FR-PREV-05, NFR-02
      DEC: DEC-09, DEC-14, DEC-15, DEC-16, DEC-17, DEC-19
      Blocks: TASK-28
      File(s): `src/lib/ai.ts`
      Note: Follow DEC-14 for system/user message structure. Follow DEC-15 for source content truncation. Follow DEC-16 for temperature and maxOutputTokens (Gemini params). Follow DEC-17 for empty response and refusal handling (throw AIEmptyResponseError / AIRefusalError). SDK: @google/generative-ai. API key: GOOGLE_AI_API_KEY.

- [ ] TASK-28: Implement POST /api/outputs/[id]/regenerate (calls streamContent(), returns ReadableStream)
      FR/NFR: FR-PREV-05, NFR-02
      DEC: DEC-05, DEC-09, DEC-19
      Blocks: none
      File(s): `src/app/api/outputs/[id]/regenerate/route.ts`, `src/lib/ai.ts`
      Note: CRITICAL — first line must be `export const maxDuration = 60` (DEC-19). Implement using TransformStream — pipe chunks to Response AND accumulate for Appwrite DB write after stream closes. Do not await stream before returning Response (breaks streaming UX). Do not skip DB write (breaks inline edit state).

- [ ] TASK-29: Build image-prompt system prompt
      FR/NFR: FR-PREV-06
      DEC: DEC-12
      Blocks: TASK-30
      File(s): `src/lib/prompts/image-prompt.ts`

- [ ] TASK-30: Implement POST /api/outputs/[id]/image-prompt (calls Claude, saves to imagePrompt field)
      FR/NFR: FR-PREV-06, NFR-02
      DEC: DEC-05, DEC-12
      Blocks: TASK-31
      File(s): `src/app/api/outputs/[id]/image-prompt/route.ts`

- [ ] TASK-31: Build ImagePromptButton component (triggers /api/outputs/[id]/image-prompt, displays result)
      FR/NFR: FR-PREV-06
      DEC: DEC-12
      Blocks: none
      File(s): `src/components/preview/ImagePromptButton.tsx`

---

## Week 5 — Brand Voice & Settings

- [ ] TASK-32: Build settings page (display name, avatar upload, brand voice selector, keyword tag input)
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

- [ ] TASK-36: Implement export features on preview page (clipboard copy, .txt download per channel, .json download all)
      FR/NFR: FR-EXP-01, FR-EXP-02, FR-EXP-03
      DEC: none
      Blocks: none
      File(s): `src/app/dashboard/projects/[id]/page.tsx`

- [ ] TASK-37: Build scheduler page (list all scheduled posts with status badges)
      FR/NFR: FR-SCHED-03, FR-SCHED-04
      DEC: none
      Blocks: TASK-38
      File(s): `src/app/dashboard/scheduler/page.tsx`

- [ ] TASK-38: Implement schedule creation (date/time picker on preview page, saves to schedules collection)
      FR/NFR: FR-SCHED-01, FR-SCHED-02, FR-SCHED-04
      DEC: none
      Blocks: none
      File(s): `src/app/dashboard/scheduler/page.tsx`, `src/app/dashboard/projects/[id]/page.tsx`

- [ ] TASK-41: Add React error boundaries to all major pages
      FR/NFR: NFR-06
      DEC: none
      Blocks: none
      File(s): `src/app/dashboard/page.tsx`, `src/app/dashboard/new/page.tsx`, `src/app/dashboard/projects/[id]/page.tsx`, `src/app/dashboard/projects/[id]/processing/page.tsx`, `src/app/dashboard/settings/page.tsx`, `src/app/dashboard/scheduler/page.tsx`

- [ ] TASK-42: Mobile responsiveness pass (dashboard, preview, new project pages)
      FR/NFR: NFR-05
      DEC: none
      Blocks: none
      File(s): `src/app/dashboard/page.tsx`, `src/app/dashboard/new/page.tsx`, `src/app/dashboard/projects/[id]/page.tsx`
