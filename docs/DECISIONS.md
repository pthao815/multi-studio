# Architecture Decisions

---
## DEC-01: Appwrite Storage bucket must be private

**Gap:** Requirements never specified whether the Appwrite Storage bucket should be public or private, yet AssemblyAI requires a publicly accessible audio URL.
**Decision:** Bucket is private. The API route generates a server-side signed URL (TTL 600s) after upload and passes that signed URL to AssemblyAI. The public URL is never stored or exposed to the client. `POST /api/upload` returns `{ fileId }` only. `POST /api/transcribe` independently regenerates the signed URL server-side via `storage.getFileDownload(fileId)` — the signedUrl is never returned to the client.
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
## DEC-06: Instagram carousel stored as JSON object string

**Gap:** The `outputs` collection stores `content` as a single string, but the Instagram spec requires 10 discrete slides with no defined delimiter.
**Decision:** The Instagram prompt instructs the model to return a valid JSON object. The `content` field stores this raw JSON string. The preview component calls `JSON.parse(content)` to render slides, caption, and hashtags.
**Rationale:** A structured delimiter like `\n\n` or `Slide X:` breaks silently if the AI output format drifts; JSON.parse throws a catchable error.
**Affects:** `src/lib/prompts/instagram.ts`, `src/components/preview/InstagramPreview.tsx`, Appwrite `outputs` collection

> **Note:** This decision was expanded by `docs/AI_LAYER.md` (instagram.ts section). The stored format is a JSON object with three keys — not a plain array:
> ```json
> { "slides": [10 strings], "caption": "≤150 chars", "hashtags": [30 strings] }
> ```
> DEC-18 further specifies use of `responseMimeType: "application/json"` (Gemini) to guarantee format. All references to "JSON array of 10 strings" in other documents have been updated to reflect this object structure.

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
## DEC-09: ai.ts exports two separate functions

**Gap:** FR-PREV-05 requires streaming for the per-channel regenerate feature, but the existing `generateContent` function is non-streaming and no streaming utility was specified.
**Decision:** `ai.ts` exports two functions: `generateContent()` (non-streaming, returns `Promise<string>`) used for initial parallel generation; and `streamContent()` (returns a `ReadableStream`) used exclusively for the regenerate endpoint.
**Rationale:** Mixing streaming and non-streaming logic in one function adds complexity; the use cases are distinct enough to warrant separate functions.
**Note:** File renamed from `claude.ts` to `ai.ts` following the switch from Anthropic Claude to Google Gemini (see DEC-16). The exported function signatures (`generateContent`, `streamContent`, `buildBrandVoicePrompt`) are identical — only the underlying SDK call changes.
**Affects:** `src/lib/ai.ts`, `src/app/api/projects/[id]/generate/route.ts` (uses `generateContent`), `src/app/api/outputs/[id]/regenerate/route.ts` (uses `streamContent`)

---
## DEC-10: Route protection uses middleware.ts, not layout redirects

**Gap:** FR-AUTH-03 required all `/dashboard/*` routes to be protected but never specified the enforcement mechanism in Next.js 14 App Router.
**Decision:** A `middleware.ts` file at the project root protects all `/dashboard/*` routes at the edge by checking for a valid Appwrite session cookie before the page renders. `dashboard/layout.tsx` does NOT duplicate this auth check.
**Rationale:** Middleware runs before rendering and blocks the response at the edge; layout-level redirects render the server component first, risking a flash of protected content.
**Affects:** `middleware.ts`, all `src/app/dashboard/**` pages

---
## DEC-11: Initial generation uses Promise.all for all 3 AI calls

**Gap:** FR-GEN-01 required parallel generation but no implementation strategy was specified, leaving sequential calls as the naive default.
**Decision:** `POST /api/projects/[id]/generate` calls `generateContent()` for facebook, tiktok, and instagram simultaneously via `Promise.all([...])`. Sequential calls are explicitly forbidden — 3 sequential AI calls at ~5s each would violate NFR-01 (15-second limit).
**Rationale:** `Promise.all` is the only approach that can fit 3 AI completions inside the 15-second budget.
**Affects:** `src/app/api/projects/[id]/generate/route.ts`, `src/lib/ai.ts`

---
## DEC-12: Image prompt generation gets its own dedicated API route

**Gap:** FR-PREV-06 required a "Generate Image Prompt" button backed by Claude, but Section 7 listed no corresponding route and the feature had no implementation home.
**Decision:** FR-PREV-06 is implemented as `POST /api/outputs/[id]/image-prompt`. It calls Claude with a dedicated image-prompt system prompt from `lib/prompts/image-prompt.ts` and saves the result to the `imagePrompt` field on the output document. `PUT /api/outputs/[id]` is not reused for this purpose.
**Rationale:** Reusing the inline-edit route conflates two distinct operations with different prompts, making the route logic ambiguous and harder to extend.
**Affects:** `src/app/api/outputs/[id]/image-prompt/route.ts`, `src/lib/prompts/image-prompt.ts`, `src/components/preview/ImagePromptButton.tsx`

---
## DEC-13: Edge middleware validates session via Appwrite REST API fetch, not Node.js SDK

**Gap:** `middleware.ts` runs in the Vercel edge runtime (V8 isolate). The `node-appwrite` SDK and `src/lib/appwrite-server.ts` use Node.js APIs (`node:crypto`, `node:http`) that are unavailable in the edge runtime. Importing either in `middleware.ts` causes a build crash: `"The module 'node:crypto' is not available in the Edge Runtime"`.
**Decision:** `middleware.ts` calls the Appwrite REST endpoint directly via `fetch()`:
```
fetch("https://cloud.appwrite.io/v1/account", {
  headers: { "Cookie": request.headers.get("cookie") ?? "" }
})
```
If the response status is 401 or the fetch fails → redirect to `/login`. If the response is 200 → allow the request to proceed. No SDK import. No `node:` module dependency.
**Rationale:** Zero SDK dependency, fully edge-compatible, one `fetch` call per protected request. The server-side DEC-05 check in every API route remains the primary security gate; middleware is a fast pre-render redirect guard only.
**Affects:** `middleware.ts` only.
**DEC reference:** extends DEC-10

---

## DEC-14: Prompt message role structure

**Gap:** No document specifies which content goes in the `system` role vs the `user` role of the Claude Messages API call across any of the six prompt files.
**Decision:** All AI calls use a two-part structure. `system`: static channel formatting instructions + brand voice fragment (built by a shared `buildBrandVoicePrompt()` helper in `src/lib/ai.ts`). `user`: source content only, prefixed with a one-line task instruction (e.g. `"Convert the following content into a Facebook post:\n\n{{sourceContent}}"`). This structure maximises instruction adherence and keeps variable data out of the system prompt.
**Rationale:** Instruction-following reliability is significantly higher when formatting rules are in `system` and variable source content is in `user`. Without this spec, developers implementing different prompt files will mix instructions and source content arbitrarily, producing inconsistent output quality.
**Affects:** `src/lib/ai.ts`, `src/lib/prompts/facebook.ts`, `src/lib/prompts/tiktok.ts`, `src/lib/prompts/instagram.ts`, `src/lib/prompts/linkedin.ts`, `src/lib/prompts/twitter.ts`, `src/lib/prompts/image-prompt.ts`

---
## DEC-15: Source content token length guard

**Gap:** No document defines a maximum length for `sourceContent` before it is passed to Claude, nor what happens when content exceeds that limit.
**Decision:** Before any AI call, `sourceContent` is truncated to a maximum of **12,000 characters** (≈ 3,000 tokens, leaving ~5,000 tokens for system prompt and output). If truncation occurs, a `…[content truncated]` suffix is appended. No user-facing warning is required for MVP. This limit is defined as a named constant `MAX_SOURCE_CONTENT_LENGTH` in `src/lib/ai.ts` so it can be adjusted in one place.
**Rationale:** A long scraped article or long audio transcript could push the user turn past the model's context window or produce slow completions. There is no truncation guard, no token count check, and no defined fallback. The 15-second NFR-01 budget has no protection against this.
**Affects:** `src/lib/ai.ts`, `src/app/api/projects/[id]/generate/route.ts`, `src/app/api/outputs/[id]/regenerate/route.ts`

---
## DEC-16: AI model and generation parameters

**Gap:** The AI model and its sampling parameters were never defined in project requirements, leaving implementation to developer discretion. The original spec referenced `claude-sonnet-4-6` (Anthropic) which has no permanent free tier — violating Constraint 1 (zero budget).
**Decision:** Switch to **Groq API (`llama-3.3-70b-versatile`)** via `groq-sdk`. Permanent free tier: 14,400 requests/day — no credit card required. All calls to `generateContent()` and `streamContent()` use: `temperature: 0.7` (balances creativity with instruction adherence), `max_tokens: 1500` (sufficient for all channel specs). Instagram calls use `temperature: 0.4` and `response_format: { type: "json_object" }` to guarantee structured output. API key: `GROQ_API_KEY` (server-only). Get key at: `https://console.groq.com`. These values are defined as named constants in `src/lib/ai.ts`.
**Rationale:** Anthropic Claude API has no permanent free tier — trial credits expire and violate the zero-budget constraint. Google Gemini free tier quota was unavailable in the deployment region (limit: 0 on all requests). Groq offers a permanent free tier with no regional restrictions and equivalent output quality for structured content generation. The `generateContent()` / `streamContent()` interface is unchanged; only the underlying SDK call differs.
**Affects:** `src/lib/ai.ts`, `GROQ_API_KEY` env var (replaces `GOOGLE_AI_API_KEY`)

---
## DEC-17: Handling Claude empty responses and content-policy refusals

**Gap:** `GENERATION_FAILED` and `REGENERATION_FAILED` error codes are triggered only when `generateContent()` or `streamContent()` throws. An empty string or a refusal text returned without throwing is saved to the database as valid content.
**Decision:** After every AI completion, `generateContent()` checks: (1) if the response is an empty string → throw `AIEmptyResponseError`; (2) if the response begins with a known refusal prefix (e.g. `"I'm sorry"`, `"I can't"`, `"I'm unable"`) → throw `AIRefusalError`. Both error classes are caught by the route handlers and mapped to `GENERATION_FAILED` / `REGENERATION_FAILED`. Project status is set to `"failed"` and no partial output is saved.
**Rationale:** If the model returns an empty string or a content-policy refusal message instead of throwing, the current flow saves the refusal text as the output content, sets project status to `"done"`, and the user sees the refusal in the preview card with no indication that generation failed.
**Affects:** `src/lib/ai.ts`, `src/app/api/projects/[id]/generate/route.ts`, `src/app/api/outputs/[id]/regenerate/route.ts`, `src/app/api/outputs/[id]/image-prompt/route.ts`

---
## DEC-18: Instagram structured output enforcement

**Gap:** DEC-06 specifies that the Instagram prompt instructs the model to return a structured JSON output, but enforcement via prompt instruction alone causes ~5–10% format drift. The API contract acknowledged one retry on JSON validation failure; a second failure sets project status to `"failed"` with no user recovery path.
**Decision:** The Instagram `generateContent()` call passes `responseMimeType: "application/json"` (Gemini JSON mode) in addition to the prompt instruction. This eliminates malformed JSON as a failure mode, removes the need for the retry, and removes the `"failed"` status path caused by format drift alone. The length checks (`slides.length === 10`, `hashtags.length === 30`) are kept as application-level guards after `JSON.parse`. No retry is implemented.
**Rationale:** Relying solely on prompt instruction for JSON structure causes format drift. JSON mode eliminates this risk entirely. The full object format `{ slides, caption, hashtags }` is specified in `docs/AI_LAYER.md` instagram.ts section, which supersedes DEC-06's earlier plain-array description.
**Affects:** `src/lib/prompts/instagram.ts`, `src/lib/ai.ts`, `src/app/api/projects/[id]/generate/route.ts`

---
## DEC-19: Generate route requires explicit Vercel function duration override

**Gap:** `POST /api/projects/[id]/generate` fires 3 parallel AI calls via `Promise.all`, fetches project and profile from Appwrite, and writes 4 documents back. Total wall time: 5–12 seconds depending on model latency. Vercel's default serverless function timeout is 10 seconds — this route will silently fail on any AI response above average latency unless the timeout is overridden.
**Decision:** The file `src/app/api/projects/[id]/generate/route.ts` must declare `export const maxDuration = 60` as its first line (before any imports). Vercel Hobby plan supports up to 60 seconds for serverless functions. This declaration must also be added to `src/app/api/outputs/[id]/regenerate/route.ts` (streaming route — 30 seconds is sufficient for streaming but 60 is safe).
**Rationale:** The DEC-02 decision correctly identified the Vercel 10-second timeout for AssemblyAI polling and moved polling to the client. The same timeout applies to the generate route but was never addressed. Without `maxDuration = 60`, every slow AI response silently causes a 504 on production Vercel — this failure is invisible locally (no timeout in `next dev`) and will appear only after deployment.
**Affects:** `src/app/api/projects/[id]/generate/route.ts`, `src/app/api/outputs/[id]/regenerate/route.ts`

---
API contracts defined in docs/API_CONTRACT.md supersede any request/response shapes in docs/MODULE_STRUCTURE.md if they conflict.
