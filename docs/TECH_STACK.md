# AI Multi-Studio — Technology Stack Reference

---

## Layer 1 — Frontend

---
## Next.js 14 (App Router)
**Role:** Full-stack React framework that serves all pages, handles routing, and hosts every API route in this project.
**Version:** 14.x (`next@14`)
**Why chosen over alternatives:** App Router enables server components for dashboard layout profile-creation logic (DEC-04) and edge middleware for auth protection (DEC-10), which Pages Router and Remix do not support as cleanly.
**Configuration needed:**
- Set `experimental.serverComponentsExternalPackages` if Cheerio causes bundling issues in server components.
- `middleware.ts` must be placed at the project root (not inside `src/`) to intercept all `/dashboard/*` routes at the edge.
- All API routes live under `src/app/api/` and export named HTTP method handlers (`GET`, `POST`, `PUT`).
**Connects to:** TypeScript, Tailwind CSS, Appwrite (client + server SDKs), Anthropic Claude API, AssemblyAI, Cheerio, Recharts, Sonner, Vercel
**Decision reference:** DEC-04, DEC-10

---
## TypeScript
**Role:** Provides static typing across the entire codebase — shared types for Appwrite documents, API request/response shapes, and component props.
**Version:** 5.x (`typescript@5`)
**Why chosen over alternatives:** Required by Next.js 14 best practices; catches mismatches between Appwrite document shapes and frontend rendering code before runtime.
**Configuration needed:**
- Shared types are centralised in `src/types/index.ts` — define `Project`, `Output`, `Profile`, `Schedule` interfaces there.
- `strict: true` should be enabled in `tsconfig.json` to catch null/undefined errors in Appwrite response handling.
**Connects to:** Next.js 14, all components, all API routes, all lib files
**Decision reference:** none

---
## Tailwind CSS
**Role:** Provides all visual styling — layout, spacing, colours, and responsive breakpoints — via utility classes directly in JSX.
**Version:** 3.x (`tailwindcss@3`)
**Why chosen over alternatives:** Zero-config integration with Next.js 14; eliminates the need for a separate CSS module or styled-components setup.
**Configuration needed:**
- `tailwind.config.ts` content paths must include `./src/**/*.{ts,tsx}` to tree-shake unused styles.
- Custom design tokens (brand gradient, glass-card blur) should be added to the `theme.extend` section for `GlassCard.tsx` and `GradientButton.tsx`.
- Enable `darkMode: 'class'` if a dark theme is planned.
**Connects to:** Next.js 14, all React components
**Decision reference:** none

---

## Layer 2 — Backend

---
## Next.js API Routes
**Role:** Server-side endpoints that handle all AI calls, Appwrite writes, file uploads, scraping, and transcription — keeping every secret off the client (NFR-02).
**Version:** Included with Next.js 14 (no separate install)
**Why chosen over alternatives:** Collocated with the frontend in a single repo; avoids the overhead of a separate Express/Fastify server for a 6-week project scope.
**Configuration needed:**
- Every route must extract `userId` from the Appwrite session cookie server-side — never from the request body (DEC-05).
- Routes that call the AI service or Appwrite server SDK must import exclusively from `src/lib/appwrite-server.ts` and `src/lib/ai.ts`, never from the client-side `src/lib/appwrite.ts`.
- Streaming routes (`/api/outputs/[id]/regenerate`) must return a `Response` with a `ReadableStream` and `Content-Type: text/event-stream`.
**Connects to:** Appwrite Cloud (server SDK), Anthropic Claude API, AssemblyAI, Cheerio, Vercel
**Decision reference:** DEC-02, DEC-03, DEC-05, DEC-09, DEC-11, DEC-12

---
## Cheerio
**Role:** Server-side HTML parser used in `POST /api/scrape` to extract the `<title>` and body text from a submitted URL.
**Version:** Latest (`cheerio@1`)
**Why chosen over alternatives:** Lightweight jQuery-like API; no headless browser overhead needed since target content (blog posts, articles) is server-rendered HTML.
**Configuration needed:**
- Import and use only inside `src/lib/cheerio.ts` (server-side); never import in any client component or page.
- Set a reasonable `fetch` timeout (e.g. 10 seconds) before passing HTML to Cheerio to avoid hanging the serverless function.
- Strip `<script>`, `<style>`, and `<nav>` tags before returning body text to reduce Claude prompt noise.
**Connects to:** Next.js API Routes (`/api/scrape`), Claude API (scraped text becomes prompt input)
**Decision reference:** none

---

## Layer 3 — Auth & Database

---
## Appwrite Cloud (Auth)
**Role:** Manages user identity — email/password registration and Google OAuth login — and issues session cookies validated by every API route.
**Version:** Appwrite Cloud (managed); `appwrite@14` SDK
**Why chosen over alternatives:** Provides both OAuth and email/password in one service with built-in session management; eliminates the need for NextAuth or a custom JWT implementation.
**Configuration needed:**
- Enable Google OAuth provider in Appwrite Console → Auth → Providers.
- Add the Vercel deployment URL and `localhost:3000` to the allowed redirect URLs list.
- In `src/lib/appwrite.ts` (client SDK): initialise `Client` with `NEXT_PUBLIC_APPWRITE_ENDPOINT` and `NEXT_PUBLIC_APPWRITE_PROJECT_ID`.
- In `src/lib/appwrite-server.ts` (server SDK): initialise with `APPWRITE_API_KEY` (never exposed to client).
- `middleware.ts` reads the Appwrite session cookie to gate all `/dashboard/*` routes (DEC-10).
**Connects to:** Next.js middleware, dashboard layout server component, all API routes (session verification), Appwrite Database
**Decision reference:** DEC-04, DEC-05, DEC-10

---
## Appwrite Cloud (Database — 4 collections)
**Role:** Persists all application data across four collections: `profiles`, `projects`, `outputs`, and `schedules`.
**Version:** Appwrite Cloud (managed); `appwrite@14` SDK
**Why chosen over alternatives:** Same platform as Auth avoids cross-service session complexity; document model maps naturally to the 4-collection schema without migrations.
**Configuration needed:**
- Create database with ID matching `NEXT_PUBLIC_APPWRITE_DB_ID`.
- Create 4 collections with IDs matching the four `NEXT_PUBLIC_APPWRITE_*_COLLECTION_ID` env vars.
- Set collection-level security rules so each document is readable/writable only by the owning `userId` (NFR-03).
- `profiles`: attributes per Section 6 schema; `projects`: include `status` enum index for dashboard filtering.
- `outputs`: `content` field must be `string` type with sufficient length to store Instagram JSON array (DEC-06).
- Cascade delete order in code: `schedules` → `outputs` → `projects` (DEC-08).
**Connects to:** Next.js API Routes (server SDK writes), Next.js pages (client SDK reads), Appwrite Auth (userId foreign key)
**Decision reference:** DEC-04, DEC-06, DEC-08

---
## Appwrite Storage
**Role:** Stores user-uploaded audio files in a private bucket; server-side signed URLs are generated for AssemblyAI access (DEC-01).
**Version:** Appwrite Cloud (managed); `appwrite@14` SDK
**Why chosen over alternatives:** Co-located with Auth and Database on the same platform; private bucket with signed URLs satisfies NFR-02 without a separate S3 setup.
**Configuration needed:**
- Create one bucket with ID matching `NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID`.
- Set bucket to **private** (no public read access) per DEC-01.
- Set maximum file size to 25 MB per NFR-07.
- Allowed MIME types: `audio/mpeg`, `audio/wav`, `audio/x-m4a`.
- In `POST /api/upload`: after storing the file, call `storage.getFileDownload()` server-side to generate a signed URL (TTL 600s) and pass it to AssemblyAI — never return the signed URL to the client (DEC-01).
**Connects to:** Next.js API Routes (`/api/upload`), AssemblyAI (signed URL for transcription)
**Decision reference:** DEC-01

---

## Layer 4 — AI & External Services

---
## Google Gemini API (gemini-2.0-flash)
**Role:** Generates all platform-specific social media content (Facebook, TikTok, Instagram, LinkedIn, Twitter) and image prompts from the user's source text.
**Version:** Model: `llama-3.3-70b-versatile`; SDK: `groq-sdk` (latest)
**Why chosen over alternatives:** Only capable AI model with a **permanent free tier** — 14,400 requests/day, no credit card required. Satisfies Constraint 1 (zero budget). Output quality is equivalent to claude-sonnet for structured content generation tasks. Anthropic Claude API has no permanent free tier; Google Gemini free tier quota was unavailable in the deployment region (DEC-16).
**Get API key:** Go to `https://console.groq.com` → Sign up → API Keys → Create API key. Free. No billing required.
**Configuration needed:**
- `GROQ_API_KEY` must be server-only (no `NEXT_PUBLIC_` prefix); never imported in client components.
- `src/lib/ai.ts` exports two functions: `generateContent()` (non-streaming, `Promise<string>`) for initial parallel generation, and `streamContent()` (returns `ReadableStream`) for per-channel regeneration (DEC-09).
- `POST /api/projects/[id]/generate` calls `generateContent()` via `Promise.all([facebook, tiktok, instagram])` — sequential calls are forbidden as they violate NFR-01 (DEC-11).
- Brand voice tone and keywords from the user's `profiles` document must be injected into every prompt call (FR-GEN-06, FR-SET-04).
- Instagram calls use `response_format: { type: "json_object" }` and `temperature: 0.4`; all other calls use `temperature: 0.7`, `max_tokens: 1500` (DEC-16, DEC-18).
- Routes that call this service must declare `export const maxDuration = 60` as first line (DEC-19).
**Connects to:** Next.js API Routes (server-side only), Appwrite Database (outputs saved after generation), channel prompt files in `src/lib/prompts/`
**Decision reference:** DEC-06, DEC-09, DEC-11, DEC-12, DEC-16, DEC-18, DEC-19

---
## AssemblyAI REST API
**Role:** Transcribes user-uploaded audio files into text that becomes the project's source content.
**Version:** REST API (no version pinned); HTTP client via `src/lib/assemblyai.ts`
**Why chosen over alternatives:** Specified by project requirements; handles `.mp3`, `.wav`, `.m4a` without additional format conversion.
**Configuration needed:**
- `ASSEMBLYAI_API_KEY` must be server-only; never exposed to the client.
- `POST /api/transcribe` submits the job using the Appwrite-signed URL and returns only the `transcriptId` — the polling loop must NOT live inside this API route (DEC-02).
- `GET /api/transcribe/[id]` polls AssemblyAI for status; the frontend calls this endpoint every 5 seconds from `AudioUpload.tsx` until status is `completed` or `error` (DEC-02).
- `src/lib/assemblyai.ts` should wrap the two REST calls (`POST /v2/transcript` and `GET /v2/transcript/:id`) with typed responses.
**Connects to:** Appwrite Storage (receives signed URL), Next.js API Routes (`/api/transcribe`, `/api/transcribe/[id]`), Appwrite Database (transcript saved to `projects.transcription`)
**Decision reference:** DEC-01, DEC-02

---

## Layer 5 — UI Libraries

---
## Recharts
**Role:** Renders the analytics bar chart showing projects created per day over the last 7 days on the dashboard (FR-ANAL-02).
**Version:** Latest (`recharts@2`)
**Why chosen over alternatives:** React-native charting library with no D3 expertise required; `BarChart` component integrates directly into the dashboard page without a canvas wrapper.
**Configuration needed:**
- Import `BarChart`, `Bar`, `XAxis`, `YAxis`, `Tooltip`, `ResponsiveContainer` from `recharts`.
- Wrap the chart in `<ResponsiveContainer width="100%" height={300}>` for mobile responsiveness (NFR-05).
- Data shape: `{ date: "Mon", count: 3 }[]` — derive from `projects` collection filtered to the last 7 days.
- Component must be a Client Component (`"use client"`) as Recharts uses browser APIs.
**Connects to:** Next.js dashboard page (`src/app/dashboard/page.tsx`), Appwrite Database (project creation timestamps)
**Decision reference:** none

---
## Sonner
**Role:** Displays all in-app toast notifications — success confirmations, error messages, and copy/export feedback — across every dashboard page.
**Version:** Latest (`sonner@1`)
**Why chosen over alternatives:** Minimal setup; `toast()` API is callable from any client component without a context provider wrapping; works cleanly with Tailwind.
**Configuration needed:**
- Add `<Toaster />` once in `src/app/dashboard/layout.tsx` (or the root layout) so toasts are available on all pages.
- Use `toast.error()` for API failures (transcription error, generation failed, scrape error — FR-INPUT-07, NFR-06).
- Use `toast.success()` for copy-to-clipboard and export confirmations (FR-EXP-01, FR-EXP-02, FR-EXP-03).
**Connects to:** All dashboard client components that trigger async operations or user actions
**Decision reference:** none

---

## Layer 6 — Deployment

---
## Vercel
**Role:** Hosts and deploys the Next.js frontend and all API routes as serverless functions on the edge.
**Version:** Vercel platform (managed); deploy via `vercel` CLI or GitHub integration
**Why chosen over alternatives:** First-party Next.js hosting with zero configuration; automatic preview deployments per PR; edge middleware support required for DEC-10.
**Configuration needed:**
- All server-only environment variables (`APPWRITE_API_KEY`, `GROQ_API_KEY`, `ASSEMBLYAI_API_KEY`) must be added to Vercel project settings, not committed to the repo.
- `NEXT_PUBLIC_*` variables must also be set in Vercel for client-side Appwrite SDK initialisation.
- Default serverless function timeout is 10 seconds — this is why the AssemblyAI polling loop must live on the client, not in the API route (DEC-02).
- For `POST /api/projects/[id]/generate` and `POST /api/outputs/[id]/regenerate`: add `export const maxDuration = 60` as the **first line** of each route file, before any imports. Without this, Vercel applies the 10-second default and every slow AI response silently causes a 504 in production. Hobby plan supports up to 60 seconds (DEC-19).
- Add the Vercel deployment URL to the Appwrite Console allowed redirect URLs for OAuth (FR-AUTH-02).
**Connects to:** Next.js 14 (full framework deployment), all API routes, Appwrite Cloud (via env vars)
**Decision reference:** DEC-02

---
## Appwrite Cloud (hosting)
**Role:** Hosts the Appwrite backend — Auth, Database, and Storage — as a managed cloud service, eliminating the need to self-host an Appwrite instance.
**Version:** Appwrite Cloud (managed SaaS)
**Why chosen over alternatives:** Managed service removes infrastructure overhead; free tier sufficient for a 6-week internship project (NFR-04).
**Configuration needed:**
- Create one Appwrite project; copy the Project ID to `NEXT_PUBLIC_APPWRITE_PROJECT_ID`.
- Set the API endpoint to `https://cloud.appwrite.io/v1` for `NEXT_PUBLIC_APPWRITE_ENDPOINT`.
- Generate a server API key with `databases.read`, `databases.write`, `storage.read`, `storage.write`, `users.read` scopes for `APPWRITE_API_KEY`.
- Add both `http://localhost:3000` and the Vercel production URL to the Appwrite project's allowed web platforms.
**Connects to:** Appwrite Auth, Appwrite Database, Appwrite Storage (all same project), Next.js API Routes, Vercel
**Decision reference:** DEC-01, DEC-04, DEC-05

---

## Layer 7 — Key Architectural Patterns

---
## Server Components vs Client Components
**Role:** Determines where rendering and data fetching occur — server components fetch from Appwrite directly; client components handle interactivity, polling, and real-time UI state.
**Version:** n/a (Next.js 14 App Router built-in)
**Why chosen over alternatives:** Server components reduce client bundle size and allow secure Appwrite server SDK calls without an extra API hop; client components are reserved for browser-only needs.
**Configuration needed:**
- Default to Server Components for all pages and layouts; add `"use client"` only when the component uses `useState`, `useEffect`, event handlers, browser APIs, or Recharts.
- Specific server components: `dashboard/layout.tsx` (profile auto-creation, DEC-04), `dashboard/page.tsx` (initial project list fetch).
- Specific client components: `AudioUpload.tsx` (polling, DEC-02), `processing/page.tsx` (polling, DEC-03), all preview/edit components (inline editing), `Recharts` chart (browser canvas).
**Connects to:** Next.js 14 App Router, Appwrite (server SDK in server components, client SDK in client components)
**Decision reference:** DEC-04

---
## Server-only API Routes (NFR-02)
**Role:** Ensures all Groq, AssemblyAI, and Appwrite server-SDK calls execute exclusively in Next.js API routes, so no secret key is ever included in the client-side bundle.
**Version:** n/a (architectural rule)
**Why chosen over alternatives:** Client-side calls to Groq or AssemblyAI would expose API keys in the browser network tab; NFR-02 mandates server-side execution.
**Configuration needed:**
- `GROQ_API_KEY`, `ASSEMBLYAI_API_KEY`, and `APPWRITE_API_KEY` must have no `NEXT_PUBLIC_` prefix.
- `src/lib/ai.ts`, `src/lib/assemblyai.ts`, and `src/lib/appwrite-server.ts` must never be imported in any file that is or could become a client component.
- Consider adding `import 'server-only'` at the top of these three lib files to get a build-time error if accidentally imported client-side.
**Connects to:** All server-only lib files (`ai.ts`, `assemblyai.ts`, `appwrite-server.ts`), all API route handlers
**Decision reference:** none (enforces NFR-02)

---
## Parallel Claude Calls via Promise.all (DEC-11)
**Role:** Fires all three initial Claude generation calls (Facebook, TikTok, Instagram) simultaneously so all outputs arrive within the 15-second NFR-01 budget.
**Version:** n/a (JavaScript language pattern)
**Why chosen over alternatives:** Sequential calls (~5s × 3 = 15s minimum, often exceeding the budget) make NFR-01 impossible to reliably meet; `Promise.all` caps total latency at the slowest single call.
**Configuration needed:**
- In `POST /api/projects/[id]/generate`: construct all three `generateContent()` calls and pass them to `Promise.all([...])` in a single `await`.
- If one call fails, `Promise.all` rejects immediately — wrap in try/catch and update project `status` to `"failed"` on any rejection.
- Do NOT use `Promise.allSettled` — a partial success (2 of 3 outputs) leaves the project in an ambiguous state.
**Connects to:** `src/app/api/projects/[id]/generate/route.ts`, `src/lib/ai.ts` (`generateContent()`), Appwrite Database (3 output documents saved after all resolve)
**Decision reference:** DEC-11

---
## Private Bucket + Signed URL Pattern (DEC-01)
**Role:** Keeps audio files inaccessible to the public while still allowing AssemblyAI to fetch the file for transcription via a time-limited server-generated URL.
**Version:** n/a (Appwrite Storage feature)
**Why chosen over alternatives:** A public bucket exposes all user audio files to anyone who knows or guesses the file ID; signed URLs expire (TTL 600s) and are never stored or returned to the client.
**Configuration needed:**
- Appwrite bucket must be set to private.
- In `POST /api/upload`: after `storage.createFile()`, immediately call `storage.getFileDownload()` with a server API key to get the signed URL, then pass it directly to the AssemblyAI submit call within the same request.
- The signed URL is ephemeral — do not store it in Appwrite or return it in the API response to the client.
- The stored `audioFileId` in `projects` is used only for server-side retrieval if re-transcription is ever needed.
**Connects to:** Appwrite Storage, `src/app/api/upload/route.ts`, `src/app/api/transcribe/route.ts`, AssemblyAI
**Decision reference:** DEC-01

---
## Client-side Polling Pattern (DEC-02, DEC-03)
**Role:** Moves long-running wait loops (AssemblyAI transcription status, Claude generation status) onto the client so they don't time out inside Vercel's 10-second serverless function limit.
**Version:** n/a (React `useEffect` + `setInterval` pattern)
**Why chosen over alternatives:** SSE or WebSockets require persistent connections and added infrastructure; simple polling with `setInterval` or `setTimeout` in a `useEffect` is sufficient for the expected latency ranges.
**Configuration needed:**
- `AudioUpload.tsx`: poll `GET /api/transcribe/[id]` every **5 seconds**; stop on `completed` or `error` status (DEC-02).
- `processing/page.tsx`: poll `GET /api/projects/[id]/status` every **3 seconds**; redirect to preview on `"done"`, surface error state after **20 failed attempts** (DEC-03).
- Always clear the interval/timeout in the `useEffect` cleanup function to prevent memory leaks on component unmount.
- Both polling components must be Client Components (`"use client"`).
**Connects to:** `src/components/input/AudioUpload.tsx`, `src/app/dashboard/projects/[id]/processing/page.tsx`, `src/app/api/transcribe/[id]/route.ts`, `src/app/api/projects/[id]/status/route.ts`
**Decision reference:** DEC-02, DEC-03
