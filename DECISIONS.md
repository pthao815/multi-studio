# Architecture Decisions

---
## DEC-01: Appwrite Storage bucket must be private

**Gap:** Requirements never specified whether the Appwrite Storage bucket should be public or private, yet AssemblyAI requires a publicly accessible audio URL.
**Decision:** Bucket is private. The API route generates a server-side signed URL (TTL 600s) after upload and passes that signed URL to AssemblyAI. The public URL is never stored or exposed to the client.
**Rationale:** A public bucket exposes all user audio files to anyone with a guessable file ID.
**Affects:** `src/app/api/upload/route.ts`, `src/app/api/transcribe/route.ts`, `src/lib/appwrite-server.ts`

---
## DEC-02: AssemblyAI polling must NOT live inside the API route

**Gap:** Requirements did not address Vercel's serverless function timeout (10s default) vs. AssemblyAI transcription time (up to 5 minutes).
**Decision:** `POST /api/transcribe` only submits the job and returns the `transcriptId`. The frontend polls `GET /api/transcribe/[transcriptId]` every 5 seconds until status is `completed` or `error`.
**Rationale:** A long-running polling loop inside a serverless function will time out on every audio upload.
**Affects:** `src/app/api/transcribe/route.ts`, `src/app/api/transcribe/[transcriptId]/route.ts`, `src/components/input/AudioUpload.tsx`

---
## DEC-03: Processing page uses client-side polling, not SSE

**Gap:** FR-GEN-05 said "SSE or polling" without deciding, and the transition mechanism from the processing page to the preview page was never specified.
**Decision:** The processing page polls `GET /api/projects/[id]/status` every 3 seconds. When status is `"done"`, it redirects to the preview page. After 20 failed attempts it surfaces an error state.
**Rationale:** Polling requires no persistent connection infrastructure and is straightforward to implement within Next.js API routes.
**Affects:** `src/app/dashboard/projects/[id]/processing/page.tsx`, `src/app/api/projects/[id]/status/route.ts`

---
## DEC-04: Profile document is created in dashboard/layout.tsx server component

**Gap:** FR-AUTH-04 required profile creation on first login but never specified where in the codebase this should occur.
**Decision:** The dashboard root layout (`src/app/dashboard/layout.tsx`) is a server component that checks whether a `profiles` document exists for the authenticated `userId`. If not, it creates one with defaults before rendering any child page.
**Rationale:** The layout runs on every dashboard route, guaranteeing the profile exists before any page that depends on brand voice or keywords is reached.
**Affects:** `src/app/dashboard/layout.tsx`, `src/lib/appwrite-server.ts`, Appwrite `profiles` collection

---
## DEC-05: API routes never trust userId from request body

**Gap:** Requirements stated collection-level security rules but never specified how API routes should verify user identity.
**Decision:** Every API route extracts the session from the Appwrite session cookie server-side using the server SDK and derives `userId` from the verified session only. Any `userId` field in the request body is ignored.
**Rationale:** Trusting client-supplied `userId` allows any authenticated user to act on another user's data.
**Affects:** `src/app/api/projects/[id]/generate/route.ts`, `src/app/api/outputs/[id]/route.ts`, `src/app/api/transcribe/route.ts`, `src/app/api/upload/route.ts`, `src/lib/appwrite-server.ts`

---
## DEC-06: Instagram carousel stored as JSON array string

**Gap:** The `outputs` collection stores `content` as a single string, but the Instagram spec requires 10 discrete slides with no defined delimiter.
**Decision:** The Instagram Claude prompt instructs the model to return a valid JSON array of exactly 10 strings. The `content` field stores this raw JSON string. The preview component calls `JSON.parse(content)` to render individual slides.
**Rationale:** A structured delimiter like `\n\n` or `Slide X:` breaks silently if Claude's output format drifts; JSON.parse throws a catchable error.
**Affects:** `src/lib/prompts/instagram.ts`, `src/components/preview/InstagramPreview.tsx`, Appwrite `outputs` collection

---
## DEC-07: Project title is auto-generated per source type

**Gap:** The `projects` collection requires a `title` field but the requirements only defined a title source for URL input, not for text or audio.
**Decision:** Title is derived automatically — URL: scraped `<title>` tag value; Text: first 8 words of the pasted content followed by `"..."`; Audio: filename without extension appended with the upload date (`YYYY-MM-DD`).
**Rationale:** Requiring manual title entry adds friction and creates inconsistency across source types.
**Affects:** `src/app/api/scrape/route.ts`, `src/app/dashboard/new/page.tsx`, `src/lib/utils.ts`

---
## DEC-08: Cascade delete order is schedules → outputs → projects

**Gap:** FR-DASH-04 specified cascading deletes from projects to outputs but did not mention the `schedules` collection, which holds `outputId` foreign keys.
**Decision:** Deletion executes in strict order: first all `schedules` documents matching the project's output IDs, then all `outputs` documents for the project, then the `project` document itself. The operation is wrapped in a try/catch — if any step fails, an error is surfaced to the user and the sequence halts.
**Rationale:** Deleting outputs before their dependent schedules leaves orphaned documents that break the scheduler page.
**Affects:** `src/app/dashboard/page.tsx` (or a dedicated delete API route), Appwrite `schedules`, `outputs`, `projects` collections

---
## DEC-09: claude.ts exports two separate functions

**Gap:** FR-PREV-05 requires streaming for the per-channel regenerate feature, but the existing `generateContent` function is non-streaming and no streaming utility was specified.
**Decision:** `claude.ts` exports two functions: `generateContent()` (non-streaming, returns `Promise<string>`) used for initial parallel generation; and `streamContent()` (returns a `ReadableStream`) used exclusively for the regenerate endpoint.
**Rationale:** Mixing streaming and non-streaming logic in one function adds complexity; the use cases are distinct enough to warrant separate functions.
**Affects:** `src/lib/claude.ts`, `src/app/api/projects/[id]/generate/route.ts` (uses `generateContent`), `src/app/api/outputs/[id]/regenerate/route.ts` (uses `streamContent`)

---
## DEC-10: Route protection uses middleware.ts, not layout redirects

**Gap:** FR-AUTH-03 required all `/dashboard/*` routes to be protected but never specified the enforcement mechanism in Next.js 14 App Router.
**Decision:** A `middleware.ts` file at the project root protects all `/dashboard/*` routes at the edge by checking for a valid Appwrite session cookie before the page renders. `dashboard/layout.tsx` does NOT duplicate this auth check.
**Rationale:** Middleware runs before rendering and blocks the response at the edge; layout-level redirects render the server component first, risking a flash of protected content.
**Affects:** `middleware.ts`, all `src/app/dashboard/**` pages

---
## DEC-11: Initial generation uses Promise.all for all 3 Claude calls

**Gap:** FR-GEN-01 required parallel generation but no implementation strategy was specified, leaving sequential calls as the naive default.
**Decision:** `POST /api/projects/[id]/generate` calls `generateContent()` for facebook, tiktok, and instagram simultaneously via `Promise.all([...])`. Sequential calls are explicitly forbidden — 3 sequential Claude calls at ~5s each would violate NFR-01 (15-second limit).
**Rationale:** `Promise.all` is the only approach that can fit 3 Claude completions inside the 15-second budget.
**Affects:** `src/app/api/projects/[id]/generate/route.ts`, `src/lib/claude.ts`

---
## DEC-12: Image prompt generation gets its own dedicated API route

**Gap:** FR-PREV-06 required a "Generate Image Prompt" button backed by Claude, but Section 7 listed no corresponding route and the feature had no implementation home.
**Decision:** FR-PREV-06 is implemented as `POST /api/outputs/[id]/image-prompt`. It calls Claude with a dedicated image-prompt system prompt from `lib/prompts/image-prompt.ts` and saves the result to the `imagePrompt` field on the output document. `PUT /api/outputs/[id]` is not reused for this purpose.
**Rationale:** Reusing the inline-edit route conflates two distinct operations with different prompts, making the route logic ambiguous and harder to extend.
**Affects:** `src/app/api/outputs/[id]/image-prompt/route.ts`, `src/lib/prompts/image-prompt.ts`, `src/components/preview/ImagePromptButton.tsx`
