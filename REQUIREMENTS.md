# AI Multi-Studio — Requirements Document

**Project Type:** SaaS Web Application (6-Week Internship)
**Last Updated:** 2026-03-24

---

## 1. Project Overview

AI Multi-Studio is a multimedia content creation automation system. Users submit a raw content source (URL, plain text, or audio file), and the system uses Claude AI to decompose it into platform-optimized social media content for multiple channels simultaneously.

**Target Users:** Content Creators — YouTubers, podcasters, bloggers
**Primary Value:** One input → multiple polished, platform-native posts in seconds

---

## 2. Confirmed Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Backend | Next.js API Routes (server-side) |
| Auth | Appwrite Cloud (Google OAuth + Email/Password) |
| Database | Appwrite Cloud (4 collections) |
| File Storage | Appwrite Storage |
| AI Generation | Anthropic Claude API (`claude-sonnet-4-6`) |
| Transcription | AssemblyAI REST API |
| URL Scraping | Cheerio (server-side) |
| Charts | Recharts |
| Notifications | Sonner |
| Deployment | Vercel (frontend) + Appwrite Cloud (backend) |

---

## 3. Priority Tiers

| Tier | Features | Target |
|---|---|---|
| MUST HAVE | Auth, Input (URL/Text/Audio), Claude generate, 3-channel preview, history, export | Weeks 1–5 |
| SHOULD HAVE | Brand voice, inline edit, regenerate per channel, settings page | Weeks 4–5 |
| NICE TO HAVE | Scheduler (display only), basic analytics, image prompt generator | Week 6 |
| DEFERRED | Team workspace, direct API publishing, template library, LinkedIn/Twitter full polish | Post-internship |

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

- **FR-GEN-01:** After ingestion, the user triggers generation. The system calls Claude API in parallel for all 3 primary channels.
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
| **LinkedIn** | Professional article format (secondary — basic template) |
| **Twitter/X** | Numbered thread format (secondary — basic template) |

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
id:            string
userId:        string
title:         string
sourceType:    string    // "url" | "text" | "audio"
sourceContent: string
audioFileId:   string
transcription: string
status:        string    // "pending" | "processing" | "done" | "failed"
createdAt:     datetime
updatedAt:     datetime
```

### `outputs`
```
id:           string
projectId:    string
userId:       string
channel:      string    // "facebook" | "tiktok" | "instagram" | "linkedin" | "twitter"
content:      string
imagePrompt:  string
createdAt:    datetime
updatedAt:    datetime
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
| POST | `/api/transcribe` | Submit file to AssemblyAI, poll for transcript |
| POST | `/api/projects/[id]/generate` | Trigger parallel Claude generation for all channels |
| PUT | `/api/outputs/[id]` | Update a single output (inline edit) |

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
│   │   ├── transcribe/route.ts
│   │   ├── projects/[id]/generate/route.ts
│   │   └── outputs/[id]/route.ts
│   ├── layout.tsx
│   └── page.tsx                            ← Landing page
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   └── TopBar.tsx
│   ├── preview/
│   │   ├── ChannelTabs.tsx
│   │   ├── FacebookPreview.tsx
│   │   ├── TikTokPreview.tsx
│   │   └── InstagramPreview.tsx
│   ├── input/
│   │   ├── SourceTypeSelector.tsx
│   │   ├── UrlInput.tsx
│   │   ├── TextInput.tsx
│   │   └── AudioUpload.tsx
│   └── ui/
│       ├── GlassCard.tsx
│       └── GradientButton.tsx
├── lib/
│   ├── appwrite.ts                         ← Client + server SDK config
│   ├── appwrite-server.ts                  ← Server-only SDK (API routes)
│   ├── claude.ts                           ← Claude API service
│   ├── assemblyai.ts                       ← AssemblyAI REST client
│   ├── cheerio.ts                          ← URL scraper
│   └── prompts/
│       ├── facebook.ts
│       ├── tiktok.ts
│       ├── instagram.ts
│       ├── linkedin.ts
│       └── twitter.ts
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
ANTHROPIC_API_KEY=                         # Server-only
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
| 5 | Set brand voice → new project → confirm tone reflected in Claude output |
| 6 | Full E2E on live Vercel URL: audio → transcribe → generate → preview → export → schedule |

---

## 11. Out of Scope (Post-Internship)

- Direct social media API publishing (Facebook Graph API, TikTok API, etc.)
- Team/workspace collaboration
- Content template library
- LinkedIn and Twitter/X full polish
- Per-user API quota enforcement
- Paid subscription / billing
