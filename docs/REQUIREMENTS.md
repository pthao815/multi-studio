# AI Multi-Studio — Requirements Document

**Project Type:** SaaS Web Application (6-Week Internship + 4-Week Expansion)
**Last Updated:** 2026-04-27

---

## 1. Project Overview

AI Multi-Studio is a multimedia content creation automation system. Users submit a raw content source (URL, plain text, or audio file), and the system uses AI to decompose it into platform-optimized social media content for multiple channels simultaneously.

**Target Users:** Content Creators — YouTubers, podcasters, bloggers
**Primary Value:** One input → multiple polished, platform-native posts in seconds
**Expansion Phase:** Weeks 7–10 add 5-channel output (LinkedIn + Twitter), AI quality scoring, version history, tone A/B comparison, source preview/edit, enhanced analytics, calendar scheduler, and project duplication.

---

## 2. Confirmed Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Backend | Next.js API Routes (server-side) |
| Auth | Appwrite Cloud (Google OAuth + Email/Password) |
| Database | Appwrite Cloud (4 collections) |
| File Storage | Appwrite Storage |
| AI Generation | Google Gemini API (`gemini-2.0-flash`) |
| Transcription | AssemblyAI REST API |
| URL Scraping | Cheerio (server-side) |
| Charts | Recharts |
| Notifications | Sonner |
| Deployment | Vercel (frontend) + Appwrite Cloud (backend) |

---

## 3. Priority Tiers

| Tier | Features | Target |
|---|---|---|
| MUST HAVE | Auth, Input (URL/Text/Audio), AI generate, 3-channel preview, history, export | Weeks 1–5 ✓ |
| SHOULD HAVE | Brand voice, inline edit, regenerate per channel, settings page | Weeks 4–5 ✓ |
| NICE TO HAVE | Scheduler (display only), basic analytics, image prompt generator | Week 6 ✓ |
| EXPANSION | LinkedIn + Twitter full channels, AI quality scorer, source preview/edit, version history, A/B tone comparison, enhanced analytics, project duplication, calendar scheduler, source summarizer, hashtag optimiser | Weeks 7–10 |
| DEFERRED | Team workspace, direct API publishing, template library | Post-internship |

---

## 4. Functional Requirements

### 4.1 Authentication

- **FR-AUTH-01:** Users can register with email and password.
- **FR-AUTH-02:** Users can log in with Google OAuth via Appwrite.
- **FR-AUTH-03:** All `/dashboard/*` routes are protected; unauthenticated users are redirected to `/login`.
- **FR-AUTH-04:** A `profiles` document is created in Appwrite on first login.
- **FR-AUTH-05:** Users can log out from the sidebar.

### 4.2 Content Input (New Project)

- **FR-INPUT-01:** Users can select one of three source types: URL, Text, or Audio.
- **FR-INPUT-02 (URL):** The system scrapes a given URL using Cheerio on the server and extracts title + body text. Saves raw text to the project.
- **FR-INPUT-03 (Text):** Users can paste or type raw text directly into a textarea with a live character count.
- **FR-INPUT-04 (Audio):** Users can upload `.mp3`, `.wav`, or `.m4a` files (max 25 MB) via drag-and-drop. The file is uploaded to Appwrite Storage and then transcribed via AssemblyAI. The resulting transcript is saved as the project's source content.
- **FR-INPUT-05:** A project record is created in Appwrite with `status: "pending"` at the start of ingestion.
- **FR-INPUT-06:** Loading/progress state is shown while transcription is in progress (polling AssemblyAI).
- **FR-INPUT-07:** Errors are handled: unsupported URL, file too large, transcription failure — each surfaces a user-readable message.

### 4.3 Content Generation

- **FR-GEN-01:** After ingestion, the user triggers generation. The system calls the Gemini API in parallel for all 3 primary channels.
- **FR-GEN-02:** Each channel output is saved to the `outputs` collection in Appwrite.
- **FR-GEN-03:** The project `status` is updated to `"processing"` during generation and `"done"` or `"failed"` after.
- **FR-GEN-04:** A processing screen shows animated step progress while generation runs.
- **FR-GEN-05:** Generation status is polled or streamed to the UI in real time (SSE or polling).
- **FR-GEN-06:** Brand voice and brand keywords from the user's profile are injected into every Claude prompt.

### 4.4 Channel Output Specifications

| Channel | Format |
|---|---|
| **Facebook** | 3–5 paragraphs, storytelling hook, emoji usage, CTA, 400–600 words |
| **TikTok** | 3-second hook line, `[Scene X]` labels throughout, trending sound suggestion, ~60-second spoken script |
| **Instagram** | 10 carousel slides (Slide 1: hook, Slides 2–9: content, Slide 10: CTA), short caption ≤150 chars, 30 hashtags |
| **LinkedIn** | Professional article, bold opening statement or question, 3–5 body paragraphs, closing takeaway, 250–400 words, plain text only |
| **Twitter/X** | Numbered thread (`N/` format), 5–8 tweets, each ≤280 chars, hook tweet, one-point-per-tweet body, CTA final tweet |

> **Note (Expansion Week 7):** LinkedIn and Twitter are now first-class channels with full preview UI tabs alongside Facebook, TikTok, and Instagram. Prompts were completed in Week 3 (see `AI_LAYER.md`). Week 7 adds `LinkedInPreview.tsx`, `TwitterPreview.tsx`, expands `ChannelTabs` from 3 to 5, and extends the `Promise.all` in the generate route to fire all 5 calls simultaneously (DEC-20).

### 4.5 Preview & Editing

- **FR-PREV-01:** A preview page shows a 3-tab switcher: Facebook | TikTok | Instagram.
- **FR-PREV-02:** Each tab renders a platform-styled preview card (Facebook post card, TikTok script format, Instagram slide mockup).
- **FR-PREV-03:** Each output displays a character/word count badge.
- **FR-PREV-04:** Users can click any output to edit it inline (textarea). Changes are auto-saved on blur via `PUT /api/outputs/[id]`.
- **FR-PREV-05:** A per-channel "Regenerate" button re-calls Claude for that channel only and streams the new result.
- **FR-PREV-06:** An "Generate Image Prompt" button calls Claude with an image-prompt-specific system prompt and displays the result.

### 4.6 Export

- **FR-EXP-01:** Users can copy any single channel output to clipboard.
- **FR-EXP-02:** Users can download all channel outputs as individual `.txt` files.
- **FR-EXP-03:** Users can download all channel outputs as a single structured `.json` file.

### 4.7 Dashboard & History

- **FR-DASH-01:** The dashboard displays a grid of all user projects with status badges (`pending / processing / done / failed`).
- **FR-DASH-02:** Quick stats cards show: total projects, total outputs generated.
- **FR-DASH-03:** Projects can be filtered by source type (URL / Text / Audio) and searched by title.
- **FR-DASH-04:** Users can delete a project (with confirmation dialog). Deletion cascades to associated outputs.

### 4.8 Settings & Brand Voice

- **FR-SET-01:** Settings page allows users to update their display name and upload an avatar (stored in Appwrite Storage).
- **FR-SET-02:** Users can select a brand voice tone: `Energetic`, `Educational`, `Funny`, or `Calm`.
- **FR-SET-03:** Users can add up to 10 brand keywords via a tag input.
- **FR-SET-04:** Saved brand voice and keywords are injected into all future Claude prompt calls.

### 4.9 Scheduler (Light — Display Only)

- **FR-SCHED-01:** Each channel output has a "Schedule this post" button.
- **FR-SCHED-02:** A date/time picker saves the schedule to the `schedules` collection in Appwrite.
- **FR-SCHED-03:** A scheduler page (`/dashboard/scheduler`) lists all scheduled posts with status badges.
- **FR-SCHED-04:** No actual API publishing — posts are marked as "Scheduled" (display only).

### 4.10 Analytics (Basic)

- **FR-ANAL-01:** Stats cards show: total projects, outputs by platform, projects created this week.
- **FR-ANAL-02:** A bar chart (Recharts) shows projects created per day for the last 7 days.

---

## 4 (Expansion). Functional Requirements — Weeks 7–10

> These requirements extend the core MVP built in Weeks 1–6. All features stay within the same tech stack, use free tiers only, and are additive — no existing behaviour is broken.

### 4.11 LinkedIn & Twitter Full Channel UI (FEAT-01)

- **FR-LTW-01:** The preview page expands from a 3-tab switcher to a 5-tab switcher: Facebook | TikTok | Instagram | LinkedIn | Twitter.
- **FR-LTW-02:** A `LinkedInPreview` component renders the LinkedIn output as a plain-text article card with a word-count badge.
- **FR-LTW-03:** A `TwitterPreview` component renders each `N/` tweet as a separate styled card with a per-tweet character-count badge (280-char limit indicator).
- **FR-LTW-04:** The generate route fires all 5 channel calls in a single `Promise.all` — LinkedIn and Twitter are generated simultaneously alongside the existing 3 channels (DEC-20).
- **FR-LTW-05:** The analytics "outputs by platform" breakdown includes LinkedIn and Twitter counts.

### 4.12 Source Content Preview & Edit Before Generating (FEAT-05)

- **FR-SRC-01:** After input completes (URL scraped, text entered, or audio transcribed), the new project page shows an expandable "Source Preview" panel containing the full `sourceContent` text.
- **FR-SRC-02:** The source preview textarea is editable. A live character-count indicator shows proximity to the 12,000-character truncation limit (DEC-15); the indicator turns amber at 10,000 chars and red at 12,000 chars.
- **FR-SRC-03:** If the user edits the source content, the updated text is saved back to `projects.sourceContent` via `PUT /api/projects/[id]/source` before the generate call fires.
- **FR-SRC-04:** The original auto-generated title can be renamed inline in the same panel. Title is saved alongside source content via the same `PUT /api/projects/[id]/source` route.

### 4.13 Content Quality Scoring (FEAT-03 / AI-01)

- **FR-SCORE-01:** After initial generation completes, the system automatically requests a quality score for each channel output (5 calls, one per channel, fired in parallel).
- **FR-SCORE-02:** Each score call returns a JSON object: `{ total: 0–100, hook: 0–25, cta: 0–25, platformFit: 0–25, brandAlignment: 0–25, tip: string }`. The result is saved to `outputs.qualityScore` (stored as a JSON string).
- **FR-SCORE-03:** Each channel tab displays a compact score ring badge (SVG) showing the `total` score (0–100). The badge background is green (≥80), amber (60–79), or red (<60).
- **FR-SCORE-04:** Clicking the score badge opens a tooltip/popover showing the 4 sub-scores and the one-sentence improvement tip.
- **FR-SCORE-05:** After a per-channel regeneration, the score for that channel is automatically re-fetched and updated.
- **FR-SCORE-06:** Score generation uses `temperature: 0.2` and JSON mode to maximise consistency (DEC-21).

### 4.14 Regeneration Version History (FEAT-06)

- **FR-HIST-01:** Before any `content` field overwrite (inline edit save or regeneration), the current `content` value is copied to `outputs.previousContent`.
- **FR-HIST-02:** A "Restore Previous Version" button appears in each preview component when `previousContent` is non-empty.
- **FR-HIST-03:** Clicking "Restore Previous Version" calls `PUT /api/outputs/[id]` with `{ content: previousContent }`, swapping current and previous values. Only one level of history is maintained (DEC-22).
- **FR-HIST-04:** After restoration, the score badge re-triggers score generation for the restored content.

### 4.15 Project Duplication (FEAT-09)

- **FR-DUP-01:** Each project card on the dashboard has a "Duplicate" icon button.
- **FR-DUP-02:** Clicking "Duplicate" calls `POST /api/projects/[id]/duplicate`, which creates a new `projects` document with the same `sourceType`, `sourceContent`, and `title` (suffixed with " (copy)"). No `outputs` are copied (DEC-23).
- **FR-DUP-03:** On success, the user is navigated to the new project's generate page (`/dashboard/projects/[newId]/processing` after triggering generation, or `/dashboard/new` pre-wired with source).
- **FR-DUP-04:** The duplication is useful for re-generating from the same source with a different brand voice — users change their Settings tone, then duplicate.

### 4.16 Multi-Tone A/B Comparison (FEAT-10 / AI-02)

- **FR-COMP-01:** The preview page has a "Compare Tones" button that opens a modal for the currently active channel.
- **FR-COMP-02:** The modal presents two tone selectors (Tone A, Tone B) pre-populated with the user's current brand voice and one adjacent tone. All four tones (`energetic`, `educational`, `funny`, `calm`) are selectable.
- **FR-COMP-03:** Clicking "Compare" fires `POST /api/projects/[id]/compare` with `{ channelId, toneA, toneB }`. The route calls `generateContent()` twice in parallel with the same source but different brand voice fragments. The result is ephemeral — not saved to the DB (DEC-24).
- **FR-COMP-04:** The modal renders a 2-column side-by-side preview of both outputs. A "Use This Version" button below each column calls `PUT /api/outputs/[id]` to persist the chosen content and closes the modal.
- **FR-COMP-05:** Only one channel at a time can be compared to avoid 10 simultaneous AI calls.

### 4.17 Source Summarization (AI-03)

- **FR-SUMM-01:** When `sourceContent.length > 8,000` characters, the new project page automatically runs a summarisation call after input completes. The summarised content (target 2,500–3,000 chars) is saved to `projects.summarisedContent`.
- **FR-SUMM-02:** The source preview panel (FR-SRC-01) displays a banner: "Source was summarised (original: X chars → summarised: Y chars). Generation will use the summarised version." A toggle reveals the original.
- **FR-SUMM-03:** The generate route uses `summarisedContent` when non-empty, falling back to `sourceContent`. This replaces the silent DEC-15 truncation for long content.
- **FR-SUMM-04:** The user can override the summary: editing the source textarea (FR-SRC-02) replaces `summarisedContent` with their edited text.

### 4.18 Instagram Hashtag Optimiser (AI-04)

- **FR-HASH-01:** The Instagram preview tab has a "Refresh Hashtags" button distinct from the full "Regenerate" button.
- **FR-HASH-02:** Clicking it calls `POST /api/outputs/[id]/hashtags`, which fires a dedicated hashtag-optimisation prompt using the existing slides content as input. The prompt returns JSON: `{ hashtags: [30 strings] }`.
- **FR-HASH-03:** The new hashtags are merged into the existing Instagram JSON object (replacing only the `hashtags` array) and saved via `PUT /api/outputs/[id]`. The `slides` and `caption` are preserved unchanged.
- **FR-HASH-04:** The three-tier hashtag strategy (10 broad / 10 niche / 10 content-specific) is enforced by the optimiser prompt, the same as the original generation (DEC-26).

### 4.19 Enhanced Analytics (FEAT-04)

- **FR-ANAL-03:** A platform breakdown bar chart shows total output count grouped by channel (Facebook, TikTok, Instagram, LinkedIn, Twitter) using existing `outputs` collection data.
- **FR-ANAL-04:** A source type distribution chart shows project count by `sourceType` (URL / Text / Audio).
- **FR-ANAL-05:** The existing 7-day bar chart (FR-ANAL-02) is extended to a 28-day trend line using `LineChart` from Recharts. The underlying query filters `createdAt >= 28DaysAgo`.
- **FR-ANAL-06:** Two computed stats are added to the stats row: "Average outputs per project" (total outputs ÷ total projects) and "Most active day of week" (derived from `projects.createdAt` day-of-week grouping).

### 4.20 Scheduler Calendar View (FEAT-08)

- **FR-SCHED-05:** The scheduler page offers a "Calendar" view toggle alongside the existing "List" view.
- **FR-SCHED-06:** The calendar view renders a 7-column weekly grid (Mon–Sun) with rows for each hour from 07:00 to 22:00.
- **FR-SCHED-07:** Each scheduled post appears as a colour-coded pill in its day/hour cell: blue=Facebook, red=TikTok, orange=Instagram, navy=LinkedIn, black=Twitter. The pill shows the post title truncated to 20 chars.
- **FR-SCHED-08:** Week navigation (← Previous Week / Next Week →) filters the displayed schedules client-side. No new API route is required — all schedule data is already fetched on page load.

### 4.21 UI Polish — Quick Wins

- **FR-UI-01:** The dashboard project grid renders `ProjectCardSkeleton` placeholders (Tailwind `animate-pulse`) while data is loading, replacing the blank-state flash.
- **FR-UI-02:** When a user has zero projects, the dashboard shows an `EmptyDashboard` component with an inline SVG illustration, a headline ("Start your first project"), and a link to `/dashboard/new`.
- **FR-UI-03:** The Instagram preview tab has a "Copy all hashtags" button that formats all 30 hashtags as `#tag1 #tag2 ...` and copies to clipboard via the Clipboard API.
- **FR-UI-04:** Each project card's title is click-to-edit (inline `contenteditable` with blur-save via a new `PATCH /api/projects/[id]` or the existing `PUT /api/projects/[id]/source` route).
- **FR-UI-05:** When a user activates the inline edit textarea on any preview channel, a live word/character count badge updates in real time and changes colour when approaching the platform's recommended limit.

---

## 5. Non-Functional Requirements

- **NFR-01 (Performance):** 3 channel outputs generated within 15 seconds of triggering generation.
- **NFR-02 (Security):** No API secrets exposed in the client bundle. All AI and storage calls are server-side only.
- **NFR-03 (Security):** Appwrite collection security rules enforce that users can only read/write their own documents.
- **NFR-04 (Scalability):** Single shared API key (demo/dev mode) — no per-user quota enforcement required for this phase.
- **NFR-05 (Responsiveness):** Application is mobile-responsive, with priority on: dashboard, preview page, and new project page.
- **NFR-06 (Error Handling):** All major pages have React error boundaries. API routes return structured error responses.
- **NFR-07 (File Size):** Audio uploads capped at 25 MB.

---

## 6. Database Schema (Appwrite Collections)

### `profiles`
```
userId:        string    // Appwrite Auth UID
displayName:   string
avatarUrl:     string
brandVoice:    string    // "energetic" | "educational" | "funny" | "calm"
brandKeywords: string[]
createdAt:     datetime
```

### `projects`
```
id:                 string
userId:             string
title:              string
sourceType:         string    // "url" | "text" | "audio"
sourceContent:      string
audioFileId:        string
transcription:      string
summarisedContent:  string    // Expansion Week 9: AI-condensed source for long content (>8,000 chars)
status:             string    // "pending" | "processing" | "done" | "failed"
createdAt:          datetime
updatedAt:          datetime
```

### `outputs`
```
id:              string
projectId:       string
userId:          string
channel:         string    // "facebook" | "tiktok" | "instagram" | "linkedin" | "twitter"
content:         string
imagePrompt:     string
qualityScore:    string    // Expansion Week 9: JSON string { total, hook, cta, platformFit, brandAlignment, tip }
previousContent: string    // Expansion Week 8: content snapshot before last overwrite (one-level undo)
createdAt:       datetime
updatedAt:       datetime
```

### `schedules`
```
id:          string
outputId:    string
userId:      string
platform:    string
scheduledAt: datetime
status:      string    // "pending" | "sent" | "cancelled"
```

---

## 7. API Routes

| Method | Route | Description |
|---|---|---|
| POST | `/api/scrape` | Scrape URL with Cheerio, return title + text |
| POST | `/api/upload` | Upload audio file to Appwrite Storage, return fileId |
| POST | `/api/transcribe` | Submit audio file to AssemblyAI, return transcriptId only |
| GET  | `/api/transcribe/[id]` | Poll AssemblyAI for transcript status and result |
| POST | `/api/projects/[id]/generate` | Trigger parallel AI generation for all 5 channels (DEC-20) |
| GET  | `/api/projects/[id]/status` | Poll project generation status (pending/processing/done/failed) |
| PUT  | `/api/projects/[id]/source` | **[Expansion W8]** Update sourceContent and/or title before generation |
| POST | `/api/projects/[id]/duplicate` | **[Expansion W8]** Clone a project (source only, no outputs); returns new projectId |
| POST | `/api/projects/[id]/compare` | **[Expansion W9]** Generate same channel in two tones simultaneously; ephemeral (DEC-24) |
| PUT  | `/api/outputs/[id]` | Update output content (inline edit, saves on blur) |
| POST | `/api/outputs/[id]/regenerate` | Re-generate one channel via AI, returns stream |
| POST | `/api/outputs/[id]/image-prompt` | Generate image prompt via AI, save to imagePrompt field |
| POST | `/api/outputs/[id]/score` | **[Expansion W9]** Generate quality score JSON for one output (DEC-21) |
| POST | `/api/outputs/[id]/hashtags` | **[Expansion W9]** Re-optimise Instagram hashtags in-place (DEC-26) |

> Note: `POST /api/transcribe` was split into two routes per DEC-02 — the submit route returns `transcriptId` immediately; client polls `GET /api/transcribe/[id]` every 5s. See DECISIONS.md.

---

## 8. Key File Structure

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── dashboard/
│   │   ├── page.tsx                        ← Dashboard home
│   │   ├── new/page.tsx                    ← New project / input
│   │   ├── projects/[id]/page.tsx          ← Preview & edit
│   │   ├── projects/[id]/processing/page.tsx
│   │   ├── settings/page.tsx
│   │   └── scheduler/page.tsx
│   ├── api/
│   │   ├── scrape/route.ts
│   │   ├── upload/route.ts
│   │   ├── transcribe/
│   │   │   ├── route.ts              ← POST: submit job, return transcriptId
│   │   │   └── [id]/route.ts         ← GET: poll status and result
│   │   ├── projects/[id]/
│   │   │   ├── generate/route.ts     ← POST: trigger parallel AI generation (5 channels, DEC-20)
│   │   │   ├── status/route.ts       ← GET: return current project status field
│   │   │   ├── source/route.ts       ← PUT: [Expansion W8] update sourceContent + title (FR-SRC-03)
│   │   │   ├── duplicate/route.ts    ← POST: [Expansion W8] clone project source (DEC-23)
│   │   │   └── compare/route.ts      ← POST: [Expansion W9] ephemeral 2-tone comparison (DEC-24)
│   │   └── outputs/[id]/
│   │         ├── route.ts               ← PUT: inline edit save
│   │         ├── regenerate/route.ts    ← POST: streaming regenerate via streamContent()
│   │         ├── image-prompt/route.ts  ← POST: generate image prompt (DEC-12)
│   │         ├── score/route.ts         ← POST: [Expansion W9] quality score JSON (DEC-21)
│   │         └── hashtags/route.ts      ← POST: [Expansion W9] Instagram hashtag optimiser (DEC-26)
│   ├── layout.tsx
│   └── page.tsx                            ← Landing page (polished in Expansion W7)
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   └── TopBar.tsx
│   ├── preview/
│   │   ├── ChannelTabs.tsx                 ← Expanded to 5 tabs in Expansion W7
│   │   ├── FacebookPreview.tsx
│   │   ├── TikTokPreview.tsx
│   │   ├── InstagramPreview.tsx
│   │   ├── LinkedInPreview.tsx             ← [Expansion W7] plain-text article card + word count
│   │   ├── TwitterPreview.tsx              ← [Expansion W7] per-tweet card + char count badge
│   │   ├── ImagePromptButton.tsx
│   │   ├── QualityScoreBadge.tsx           ← [Expansion W9] score ring SVG + tooltip breakdown
│   │   └── ToneCompareModal.tsx            ← [Expansion W9] 2-column A/B comparison modal
│   ├── scheduler/
│   │   └── CalendarWeekView.tsx            ← [Expansion W10] 7-col weekly grid calendar
│   ├── input/
│   │   ├── SourceTypeSelector.tsx
│   │   ├── UrlInput.tsx
│   │   ├── TextInput.tsx
│   │   └── AudioUpload.tsx
│   └── ui/
│       ├── GlassCard.tsx
│       ├── GradientButton.tsx
│       ├── ProjectCardSkeleton.tsx          ← [Expansion W7] animate-pulse loading skeleton
│       └── EmptyDashboard.tsx              ← [Expansion W7] zero-project empty state
├── lib/
│   ├── appwrite.ts                         ← Client + server SDK config
│   ├── appwrite-server.ts                  ← Server-only SDK (API routes)
│   ├── ai.ts                               ← Groq API service (generateContent, streamContent)
│   ├── assemblyai.ts                       ← AssemblyAI REST client
│   ├── cheerio.ts                          ← URL scraper
│   └── prompts/
│       ├── facebook.ts
│       ├── tiktok.ts
│       ├── instagram.ts
│       ├── linkedin.ts
│       ├── twitter.ts
│       ├── image-prompt.ts
│       ├── quality-score.ts                ← [Expansion W9] 4-criteria evaluation prompt (AI-01)
│       ├── summarize.ts                    ← [Expansion W9] long-source condensation prompt (AI-03)
│       └── hashtag-optimizer.ts            ← [Expansion W9] Instagram hashtag re-ranking prompt (AI-04)
└── types/
    └── index.ts                            ← Shared TypeScript types
```

---

## 9. Environment Variables Required

```
# Appwrite
NEXT_PUBLIC_APPWRITE_ENDPOINT=
NEXT_PUBLIC_APPWRITE_PROJECT_ID=
APPWRITE_API_KEY=                          # Server-only

# Appwrite Collection IDs
NEXT_PUBLIC_APPWRITE_DB_ID=
NEXT_PUBLIC_APPWRITE_PROFILES_COLLECTION_ID=
NEXT_PUBLIC_APPWRITE_PROJECTS_COLLECTION_ID=
NEXT_PUBLIC_APPWRITE_OUTPUTS_COLLECTION_ID=
NEXT_PUBLIC_APPWRITE_SCHEDULES_COLLECTION_ID=
NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID=

# AI Services
GROQ_API_KEY=                              # Server-only — get free key at console.groq.com
ASSEMBLYAI_API_KEY=                        # Server-only
```

---

## 10. Weekly Verification Checkpoints

| Week | Verification Test |
|---|---|
| 1 | Register → login → dashboard loads → logout works |
| 2 | Submit URL, text, and audio — all produce a saved project with raw source text |
| 3 | Trigger generate → Appwrite `outputs` has 3 records within 15s |
| 4 | Edit output → verify DB updated → regenerate → verify new content |
| 5 | Set brand voice → new project → confirm tone reflected in AI output |
| 6 | Full E2E on live Vercel URL: audio → transcribe → generate → preview → export → schedule |
| 7 | Generate project → preview page shows 5 tabs → LinkedIn and Twitter content present in Appwrite outputs |
| 8 | New project page shows source preview panel → edit source text → confirm updated sourceContent in DB; dashboard shows skeleton while loading; duplicate a project → new project record created |
| 9 | Generate project → quality score badge appears on each channel tab → click badge shows sub-scores; regenerate one channel → score updates; compare two tones → modal shows side-by-side content |
| 10 | Scheduler page calendar view renders this week's schedules as colour-coded pills → week navigation works; full E2E demo run on live Vercel URL covering all expansion features |

---

## 11. Out of Scope (Post-Internship)

- Direct social media API publishing (Facebook Graph API, TikTok API, etc.)
- Team/workspace collaboration
- Content template library
- Per-user API quota enforcement
- Paid subscription / billing
