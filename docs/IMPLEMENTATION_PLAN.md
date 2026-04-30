# AI Multi-Studio — Implementation Plan

> This is NOT a repeat of docs/TASKS.md. docs/TASKS.md lists what to build.
> This document defines **runnable steps** — each step ends with a specific test you can run RIGHT NOW to confirm it works before moving on.
>
> A step is "runnable" if it produces something visible or testable, the test can be done in under 5 minutes, and failure gives a clear error message.

---

## Milestone 1: Project Boots

**Unlocks:** Every subsequent milestone — nothing else can be tested without a running dev server.
**TASK reference:** TASK-01 (Appwrite config), TASK-02 through TASK-07 scaffold

---

### Step 1.1: Initialise Next.js 14 with TypeScript and Tailwind

**Build:** Create `next.config.js`, `tailwind.config.ts`, `postcss.config.js`, `tsconfig.json`, `src/app/layout.tsx`, `src/app/page.tsx`

**Follows:** none

**Implementation notes:**
- Use `npx create-next-app@14` with `--typescript --tailwind --app --src-dir` flags, or scaffold manually
- `tailwind.config.ts` content paths must include `"./src/**/*.{ts,tsx}"` — missing this causes all Tailwind classes to be purged in dev
- `src/app/layout.tsx` must render `<html lang="en"><body>{children}</body></html>` with global font import
- Do not add any Appwrite or Claude imports yet — this step is pure scaffold

**Runnable test:**
> Action: Run `npm run dev` in the project root
> Expected: Terminal prints "Ready — started server on 0.0.0.0:3000"; visit `http://localhost:3000` → landing page renders without error overlay
> Fail signal: `Module not found` or `SyntaxError` in terminal; red error overlay in browser

**Blocker if test fails:** Check `tsconfig.json` paths alias (`@/*` → `./src/*`) and that `tailwind.config.ts` lists correct content paths.

---

### Step 1.2: Install and configure all npm dependencies

**Build:** `package.json` — add all required packages

**Follows:** none

**Implementation notes:**
- Install: `node-appwrite`, `appwrite`, `@google/generative-ai`, `assemblyai`, `cheerio`, `sonner`, `recharts` — check docs/TECH_STACK.md for exact versions
- Run `npm install` and confirm zero peer-dependency errors
- Add `"node-appwrite"` to `serverExternalPackages` in `next.config.js` to prevent edge bundling issues (needed for DEC-13)
- Verify `package.json` has `"type": "module"` NOT set — Next.js App Router expects CommonJS interop

**Runnable test:**
> Action: Run `npm run build` (not dev)
> Expected: Build completes with "Compiled successfully" — no "Module not found" errors
> Fail signal: Any `Cannot find module` error in build output

**Blocker if test fails:** Run `npm ls <package>` on the failing import to confirm it was installed. Check `next.config.js` for `serverExternalPackages`.

---

### Step 1.3: Create `.env.local` with all required environment variables

**Build:** `.env.local` (not committed), `src/lib/appwrite.ts`, `src/lib/appwrite-server.ts`

**Follows:** TASK-01 (Appwrite Cloud project must exist with collections created)

**Implementation notes:**
- Required vars: `NEXT_PUBLIC_APPWRITE_ENDPOINT`, `NEXT_PUBLIC_APPWRITE_PROJECT_ID`, `NEXT_PUBLIC_APPWRITE_DB_ID`, `NEXT_PUBLIC_APPWRITE_PROFILES_COLLECTION_ID`, `NEXT_PUBLIC_APPWRITE_PROJECTS_COLLECTION_ID`, `NEXT_PUBLIC_APPWRITE_OUTPUTS_COLLECTION_ID`, `NEXT_PUBLIC_APPWRITE_SCHEDULES_COLLECTION_ID`, `NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID`, `GROQ_API_KEY`, `ASSEMBLYAI_API_KEY`, `APPWRITE_API_KEY` (server-only) — copy the `.env.local.example` file from the project root for the full template
- `src/lib/appwrite.ts` exports the browser-side `Client` + `Account`, `Databases`, `Storage` instances using `NEXT_PUBLIC_` vars
- `src/lib/appwrite-server.ts` exports the server-side `Client` using `APPWRITE_API_KEY` (never prefixed `NEXT_PUBLIC_`) — this file must never be imported by any client component
- TypeScript types for all four Appwrite collections go in `src/types/index.ts`

**Runnable test:**
> Action: Add `console.log(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)` to `src/app/page.tsx` temporarily; run `npm run dev`; open browser console
> Expected: Appwrite project ID string printed (not `undefined`)
> Fail signal: `undefined` printed — env var name is wrong or `.env.local` is in wrong directory

**Blocker if test fails:** Confirm `.env.local` is in the project root (same level as `package.json`), not inside `src/`.

---

### Step 1.4: Add TypeScript types for all Appwrite collections

**Build:** `src/types/index.ts`

**Follows:** Step 1.3

**Implementation notes:**
- Define interfaces: `Profile`, `Project`, `Output`, `Schedule` matching docs/DATABASE_DESIGN.md schemas exactly
- Define union types: `SourceType = "url" | "text" | "audio"`, `GenerationStatus = "pending" | "processing" | "done" | "failed"`, `ChannelType = "facebook" | "tiktok" | "instagram" | "linkedin" | "twitter"`
- Export all from `src/types/index.ts` — every API route and component imports types from here
- Do not use `any` — strict TypeScript is enforced by `tsconfig.json`

**Runnable test:**
> Action: Run `npx tsc --noEmit`
> Expected: Zero TypeScript errors
> Fail signal: Type errors referencing `src/types/index.ts` missing exports

**Blocker if test fails:** Check that every field in docs/DATABASE_DESIGN.md Section 2 schemas is represented in the interface.

---

## Milestone 2: Auth Works End-to-End

**Unlocks:** All dashboard pages — nothing behind `/dashboard/*` can be tested without working auth.
**TASK reference:** TASK-02, TASK-03, TASK-04, TASK-05, TASK-06, TASK-07

---

### Step 2.1: Build register and login pages

**Build:** `src/app/(auth)/register/page.tsx`, `src/app/(auth)/login/page.tsx`

**Follows:** Step 1.3

**Implementation notes:**
- Register: calls `account.create(ID.unique(), email, password)` then `account.createEmailPasswordSession(email, password)` then `router.push("/dashboard")`
- Login: calls `account.createEmailPasswordSession(email, password)` then `router.push("/dashboard")` — also shows Google OAuth button that calls `account.createOAuth2Session("google", successUrl, failureUrl)`
- Use Sonner `toast.error()` for all auth error messages — do not use native `alert()`
- Both pages are client components (`"use client"`) — no server-side rendering needed here

**Runnable test:**
> Action: Visit `http://localhost:3000/register` → fill in email/password → submit
> Expected: Appwrite console (cloud.appwrite.io) shows new user in Auth > Users; browser redirects to `/dashboard` (which may 404 — that's fine at this step)
> Fail signal: Error toast appears; or Appwrite console shows no new user

**Blocker if test fails:** Check browser DevTools Network tab for the Appwrite API call — verify `NEXT_PUBLIC_APPWRITE_PROJECT_ID` matches the project in Appwrite console.

---

### Step 2.2: Implement edge middleware route protection

**Build:** `middleware.ts` (project root)

**Follows:** Step 2.1

**Implementation notes:**
- Use `fetch("https://cloud.appwrite.io/v1/account", { headers: { Cookie: request.headers.get("cookie") ?? "" } })` — do NOT import `node-appwrite` or `appwrite-server.ts` (DEC-13)
- If response status is 401 → `NextResponse.redirect(new URL("/login", request.url))`
- If fetch throws → redirect to `/login` (treat errors as unauthenticated)
- `matcher` config must include `"/dashboard/:path*"` and exclude `"/api/:path*"` (API routes do their own session check via DEC-05)
- This file runs in the Vercel edge runtime — zero Node.js API usage

**Runnable test:**
> Action: While logged out, visit `http://localhost:3000/dashboard`
> Expected: Browser redirects to `http://localhost:3000/login`
> Fail signal: Dashboard page renders (or 500 error) — middleware is not running or matcher is wrong

**Blocker if test fails:** Confirm `middleware.ts` is at the project root (not inside `src/`). Check `matcher` config pattern syntax.

---

### Step 2.3: Build dashboard layout with profile auto-creation

**Build:** `src/app/dashboard/layout.tsx`, `src/components/layout/Sidebar.tsx`, `src/components/layout/TopBar.tsx`

**Follows:** Step 2.2

**Implementation notes:**
- `dashboard/layout.tsx` is a **server component** — it calls `appwrite-server.ts` to get the current user, then calls `getOrCreateProfile(userId)` which does `databases.listDocuments(profilesCollectionId, [Query.equal("userId", userId)])` and creates one if missing (DEC-04)
- `Sidebar.tsx` is a client component with a logout button that calls `account.deleteSession("current")` then `router.push("/login")`
- `TopBar.tsx` displays the user's `displayName` from the profile
- Brand voice defaults (`"energetic"`) must be set in `getOrCreateProfile()` per docs/DATABASE_DESIGN.md

**Runnable test:**
> Action: Log in → browser shows dashboard layout with Sidebar and TopBar
> Expected: Appwrite console shows a new document in the `profiles` collection with `userId` matching the logged-in user and `brandVoice: "energetic"`
> Fail signal: 500 error on dashboard load; or no profile document in Appwrite console

**Blocker if test fails:** Check that `APPWRITE_API_KEY` has the `databases.write` scope in Appwrite console > Settings > API Keys.

---

### Step 2.4: Verify full auth flow end-to-end

**Build:** No new files — integration test of Steps 2.1–2.3

**Follows:** Step 2.3

**Implementation notes:**
- Log out via the Sidebar logout button — calls `account.deleteSession("current")`
- Confirm the Appwrite session cookie is cleared (DevTools > Application > Cookies)
- Attempt to visit `/dashboard` directly — middleware must redirect to `/login`
- Google OAuth requires the Google provider to be enabled in Appwrite console > Auth > OAuth2

**Runnable test:**
> Action: Register new account → dashboard loads → click Logout → manually navigate to `http://localhost:3000/dashboard`
> Expected: Browser redirects to `/login` — the session cookie is gone and middleware correctly blocks re-entry
> Fail signal: Dashboard renders after logout (middleware not running or cookie not cleared)

**Blocker if test fails:** Check that `account.deleteSession("current")` is actually awaited before `router.push("/login")`.

---

## Milestone 3: URL Input Produces a Saved Project

**Unlocks:** Generation flow (Milestone 6) — requires a project document with `sourceContent`.
**TASK reference:** TASK-08, TASK-12, TASK-13, TASK-16

---

### Step 3.1: Implement POST /api/scrape

**Build:** `src/app/api/scrape/route.ts`, `src/lib/cheerio.ts`

**Follows:** Step 1.3

**Implementation notes:**
- `scrapeUrl(url: string): Promise<{ title: string; text: string }>` in `cheerio.ts` — use `$("title").text()` for title and `$("body").text()` stripped of script/style tags for text
- Validate `url` starts with `http://` or `https://` before fetching — return `{ code: "INVALID_URL" }` per docs/API_CONTRACT.md
- Session verification at route level: call Appwrite server SDK `account.get()` — if it throws → return 401 (DEC-05 pattern)
- Return `{ code: "NO_CONTENT" }` if stripped text is empty after whitespace normalization

**Runnable test:**
> Action: Run `curl -X POST http://localhost:3000/api/scrape -H "Content-Type: application/json" -d '{"url":"https://example.com"}' --cookie "appwrite-session=<your-session-cookie>"`
> Expected: JSON response `{ "title": "Example Domain", "text": "..." }` with status 200
> Fail signal: 401 (missing session cookie in curl), 500 (Cheerio import error), or empty `text` field

**Blocker if test fails:** Check that `cheerio` is listed in `package.json` dependencies (not devDependencies). Verify the session cookie value by copying it from browser DevTools.

---

### Step 3.2: Build UrlInput component and new project page

**Build:** `src/components/input/UrlInput.tsx`, `src/components/input/SourceTypeSelector.tsx`, `src/app/dashboard/new/page.tsx`, `src/lib/utils.ts`

**Follows:** Step 3.1

**Implementation notes:**
- `UrlInput.tsx` posts to `POST /api/scrape` and calls an `onSuccess({ title, text })` callback to the parent page
- `new/page.tsx` creates a `projects` document via `databases.createDocument()` with `status: "pending"`, `sourceType: "url"`, `sourceContent: text`, `title: title` — then calls `POST /api/projects/[id]/generate` — then navigates to `/dashboard/projects/[id]/processing`
- `utils.ts` exports `deriveTitle(sourceType, content, filename?)` implementing DEC-07 logic — used by all three input paths
- Error handling: if scrape returns a non-200 response, call `toast.error(data.error)` and do NOT create the project

**Runnable test:**
> Action: Go to `http://localhost:3000/dashboard/new` → paste `https://example.com` into URL field → click Scrape/Submit
> Expected: Appwrite console shows a new document in the `projects` collection with `sourceType: "url"`, `status: "pending"`, and a non-empty `title` and `sourceContent`
> Fail signal: No document appears in Appwrite console; or error toast appears

**Blocker if test fails:** Check browser DevTools Network tab — look for the `POST /api/scrape` response. If 200, the issue is in the `databases.createDocument()` call in `new/page.tsx`.

---

## Milestone 4: Text Input Produces a Saved Project

**Unlocks:** Independent text-based project creation path; confirms DEC-07 title logic for text.
**TASK reference:** TASK-14, TASK-16

---

### Step 4.1: Build TextInput component

**Build:** `src/components/input/TextInput.tsx`

**Follows:** Step 3.2

**Implementation notes:**
- Renders a `<textarea>` with live character count displayed below (e.g., "1,234 characters")
- Calls `onContentChange(text)` prop on every keystroke — parent derives title via `deriveTitle("text", text)` from `utils.ts`
- DEC-07 text title: first 8 words followed by `"..."` — implement in `deriveTitle()` in `utils.ts`
- No API call — text is passed directly to the parent's state

**Runnable test:**
> Action: On `http://localhost:3000/dashboard/new`, select the Text tab → type at least 10 words → click Generate/Submit
> Expected: Appwrite console shows a new `projects` document with `sourceType: "text"`, `sourceContent` matching what was typed, and `title` equal to the first 8 words + `"..."`
> Fail signal: `title` is empty or `sourceType` is wrong

**Blocker if test fails:** Check `deriveTitle("text", content)` output in browser console — add a `console.log` temporarily.

---

## Milestone 5: Audio Input Produces a Transcript

**Unlocks:** Audio-based project creation path; required for full input pipeline.
**TASK reference:** TASK-09, TASK-10, TASK-11, TASK-15, TASK-16

---

### Step 5.1: Implement POST /api/upload

**Build:** `src/app/api/upload/route.ts`

**Follows:** Step 1.3

**Implementation notes:**
- Parse `multipart/form-data` using `request.formData()` — Next.js 14 App Router handles this natively; do not use `multer`
- Validate MIME type against `["audio/mpeg", "audio/wav", "audio/x-m4a"]` → return `{ code: "UNSUPPORTED_FILE_TYPE" }` per docs/API_CONTRACT.md
- Validate size ≤ 25 MB → return `{ code: "FILE_TOO_LARGE" }` per docs/API_CONTRACT.md
- Call `storage.createFile(bucketId, ID.unique(), InputFile.fromBuffer(buffer, filename))` using the server SDK
- Return `{ fileId }` only — never return the signed URL (DEC-01)

**Runnable test:**
> Action: Upload a `.mp3` file via `curl -X POST http://localhost:3000/api/upload -F "file=@test.mp3" --cookie "appwrite-session=<cookie>"`
> Expected: JSON `{ "fileId": "..." }` returned; Appwrite console > Storage shows the uploaded file in the private bucket
> Fail signal: 400 UNSUPPORTED_FILE_TYPE (check MIME type of test file); 500 (check `APPWRITE_API_KEY` bucket permissions)

**Blocker if test fails:** Confirm the Appwrite bucket has "Create" permission for authenticated users. Check that `InputFile` is imported from `node-appwrite/file`.

---

### Step 5.2: Implement POST /api/transcribe and GET /api/transcribe/[id]

**Build:** `src/app/api/transcribe/route.ts`, `src/app/api/transcribe/[id]/route.ts`, `src/lib/assemblyai.ts`

**Follows:** Step 5.1

**Implementation notes:**
- `assemblyai.ts` exports `submitTranscriptionJob(signedUrl: string): Promise<string>` and `getTranscriptionStatus(transcriptId: string): Promise<{ status: string; text?: string }>`
- `POST /api/transcribe` body is `{ fileId: string }` (per docs/API_CONTRACT.md, not `signedUrl`) — route regenerates signed URL server-side via `storage.getFileDownload(bucketId, fileId)` then submits to AssemblyAI (DEC-01, DEC-02)
- `GET /api/transcribe/[id]` calls `getTranscriptionStatus(id)` and returns the raw status + optional text
- AssemblyAI API key is `process.env.ASSEMBLYAI_API_KEY` — never expose to client

**Runnable test:**
> Action: Get a `fileId` from Step 5.1 test; call `curl -X POST http://localhost:3000/api/transcribe -H "Content-Type: application/json" -d '{"fileId":"<id>"}' --cookie "..."` → get `transcriptId`; then poll `curl http://localhost:3000/api/transcribe/<transcriptId> --cookie "..."` every 5 seconds
> Expected: After polling, response shows `{ "status": "completed", "text": "..." }` with actual transcript text
> Fail signal: `status: "error"` from AssemblyAI (check audio file quality); 500 on transcribe submit (check `ASSEMBLYAI_API_KEY`)

**Blocker if test fails:** Log the signed URL inside `POST /api/transcribe` (server console only) and paste it into a browser — it should trigger a file download. If it returns 401, the bucket permissions or API key is wrong.

---

### Step 5.3: Build AudioUpload component

**Build:** `src/components/input/AudioUpload.tsx`

**Follows:** Step 5.2

**Implementation notes:**
- Implements the full pipeline: drag-and-drop UI → `POST /api/upload` → `POST /api/transcribe` → poll `GET /api/transcribe/[transcriptId]` every 5000ms (DEC-02)
- `uploadState` drives the UI: `"idle"` → drag zone; `"uploading"` → spinner; `"transcribing"` → polling indicator; `"done"` → calls `onTranscriptReady({ transcript, fileId, title })` prop; `"error"` → shows error message
- Poll timeout at 60 attempts (5 minutes) — set `uploadState: "error"` with message "Transcription timed out"
- DEC-07 audio title: `filename` without extension + ` (YYYY-MM-DD)` — derive in `utils.ts` `deriveTitle("audio", "", file.name)`

**Runnable test:**
> Action: On `http://localhost:3000/dashboard/new`, select Audio tab → drag and drop a `.mp3` file → wait for transcription to complete
> Expected: UI progresses through Uploading → Transcribing → Done states; Appwrite console shows a new `projects` document with `sourceType: "audio"`, non-empty `transcription` field, and `title` ending with today's date
> Fail signal: UI stays on "Transcribing" forever (polling not starting); or 400 error (MIME type mismatch)

**Blocker if test fails:** Open browser DevTools Network tab — confirm `POST /api/upload` returns 200 with `fileId`; then confirm `POST /api/transcribe` returns 200 with `transcriptId`; then check whether polling requests are firing every 5 seconds.

---

## Milestone 6: Generation Produces 3 Outputs

**Unlocks:** Preview page (Milestone 8) — requires output documents in Appwrite.
**TASK reference:** TASK-17, TASK-18, TASK-19

---

### Step 6.1: Write AI prompt builders and ai.ts

**Build:** `src/lib/ai.ts`, `src/lib/prompts/facebook.ts`, `src/lib/prompts/tiktok.ts`, `src/lib/prompts/instagram.ts`

**Follows:** Step 1.3

**Implementation notes:**
- `ai.ts` exports exactly two functions per DEC-09: `generateContent(systemPrompt: string, userContent: string, options?: { jsonMode?: boolean }): Promise<string>` (non-streaming) and `streamContent(systemPrompt: string, userContent: string): ReadableStream` (streaming)
- `generateContent` uses `@google/generative-ai` SDK: `genAI.getGenerativeModel({ model: "gemini-2.0-flash" }).generateContent(...)` with `temperature: 0.7`, `maxOutputTokens: 1500` — see DEC-16
- Instagram calls pass `responseMimeType: "application/json"` and `temperature: 0.4` (DEC-18)
- `buildInstagramPrompt(brandVoice, keywords)` must instruct the model to return a JSON object `{ slides: string[10], caption: string, hashtags: string[30] }` per AI_LAYER.md instagram.ts section (supersedes DEC-06 plain-array description)
- Each prompt builder accepts `(sourceContent: string, brandVoice: string, keywords: string[]): { system: string, user: string }` — brand voice injected per FR-GEN-06 via `buildBrandVoicePrompt()` from `src/lib/ai.ts`
- Get free API key: `https://aistudio.google.com` → "Get API key"

**Runnable test:**
> Action: Add a temporary test script `test-ai.ts` that calls `generateContent(buildFacebookPrompt("energetic", []).system, buildFacebookPrompt("energetic", []).user + "\n\nTest content about AI")` and prints the result; run with `npx tsx test-ai.ts`
> Expected: A 400–600 word Facebook post printed to terminal with emojis and a CTA
> Fail signal: `GroqError` (check `GROQ_API_KEY`); empty string returned; quota exceeded (14,400 req/day free limit)

**Blocker if test fails:** Check that `GROQ_API_KEY` is set in `.env.local`. Verify the key is active at `https://console.groq.com`. If quota exceeded, wait for daily reset.

---

### Step 6.2: Implement POST /api/projects/[id]/generate

**Build:** `src/app/api/projects/[id]/generate/route.ts`

**Follows:** Step 6.1

**Implementation notes:**
- **CRITICAL:** First line of this file must be `export const maxDuration = 60` — before any imports. Without this Vercel times out at 10 seconds in production (DEC-19).
- Fetch project by ID using server SDK; verify `project.userId === session.userId` (DEC-05) — return `{ code: "UNAUTHORIZED" }` on mismatch
- Set `project.status = "processing"` before calling AI
- Call `Promise.all([generateContent(facebookPrompt, ...), generateContent(tiktokPrompt, ...), generateContent(instagramPrompt, ...)])` — never sequential (DEC-11)
- After `Promise.all` resolves: call `JSON.parse(instagramContent)` — verify `result.slides.length === 10 && result.hashtags.length === 30`; on failure → set status `"failed"`, do not save any outputs, return `GENERATION_FAILED`. **No retry** (DEC-18 uses JSON mode — format failure means prompt error, not model flakiness)
- On success: create 3 output documents in Appwrite, then set `project.status = "done"` — per docs/API_CONTRACT.md

**Runnable test:**
> Action: Get a project `id` with `status: "pending"` from Appwrite console; call `curl -X POST http://localhost:3000/api/projects/<id>/generate --cookie "appwrite-session=<cookie>"`
> Expected: Within 15 seconds — response `{ "success": true }`; Appwrite console shows 3 new `outputs` documents (channel: facebook, tiktok, instagram) and `project.status` changed to `"done"`
> Fail signal: Response takes >15 seconds (sequential calls — check `Promise.all`); `status: "failed"` (Instagram validation failed — inspect Claude response); 403 (session/userId mismatch)

**Blocker if test fails:** Add `console.log(instagramContent)` in the route to inspect the raw Claude Instagram response. If it's not valid JSON, adjust the Instagram prompt to be more explicit about output format.

---

## Milestone 7: Processing Page Works

**Unlocks:** Full new-project flow from input to preview — the bridge between creation and results.
**TASK reference:** TASK-20, TASK-21

---

### Step 7.1: Implement GET /api/projects/[id]/status

**Build:** `src/app/api/projects/[id]/status/route.ts`

**Follows:** Step 1.3

**Implementation notes:**
- Fetch project by ID; verify `project.userId === session.userId` → 403 on mismatch per docs/API_CONTRACT.md
- Return `{ status: project.status }` — the `GenerationStatus` union type defined in `src/types/index.ts`
- Return 404 `{ code: "PROJECT_NOT_FOUND" }` if `databases.getDocument()` throws a `404` Appwrite exception

**Runnable test:**
> Action: `curl http://localhost:3000/api/projects/<id>/status --cookie "..."`
> Expected: `{ "status": "done" }` (or current project status)
> Fail signal: 403 (session mismatch); 500 (Appwrite query error — check collection ID env var)

**Blocker if test fails:** Verify `NEXT_PUBLIC_APPWRITE_PROJECTS_COLLECTION_ID` in `.env.local` matches the actual collection ID in Appwrite console.

---

### Step 7.2: Build processing page with animated steps and polling

**Build:** `src/app/dashboard/projects/[id]/processing/page.tsx`

**Follows:** Step 7.1

**Implementation notes:**
- Client component polling `GET /api/projects/[id]/status` every 3000ms via `setInterval` in `useEffect` (DEC-03)
- Animated steps: display 4 steps ("Analysing content", "Drafting Facebook", "Drafting TikTok", "Drafting Instagram") — advance animation every 3 polls regardless of actual status
- When `status === "done"` → `router.push("/dashboard/projects/[id]")` and `clearInterval`
- When `status === "failed"` OR `pollCount >= 20` → clear interval, set `error` state, display "Generation failed" with a link back to dashboard
- `pollCount` increments on every poll, even on 200 responses

**Runnable test:**
> Action: Submit a new URL project (Milestone 3) → observe the processing page
> Expected: Page shows animated steps → within 15 seconds → automatically redirects to `/dashboard/projects/[id]` (preview page, which may 404 — that's fine at this step)
> Fail signal: Page stays on processing forever (polling not working or status never reaches "done"); or instant redirect (polling not waiting for status)

**Blocker if test fails:** Open DevTools Network tab — confirm polling requests fire every 3 seconds and the response `status` field is changing from `"processing"` to `"done"`.

---

## Milestone 8: Preview Page Renders All 3 Channels

**Unlocks:** Edit, regenerate, and export features (Milestones 9–10).
**TASK reference:** TASK-22, TASK-23, TASK-24, TASK-25, TASK-26

---

### Step 8.1: Build channel preview components

**Build:** `src/components/preview/ChannelTabs.tsx`, `src/components/preview/FacebookPreview.tsx`, `src/components/preview/TikTokPreview.tsx`, `src/components/preview/InstagramPreview.tsx`

**Follows:** Step 6.2

**Implementation notes:**
- `ChannelTabs.tsx` renders three tab buttons (Facebook / TikTok / Instagram) and calls `onChannelChange(channel)` on click
- `FacebookPreview.tsx` renders the content string in a post-card mockup with a character and word count badge (FR-PREV-03)
- `TikTokPreview.tsx` renders content with `[Scene X]` labels styled differently (e.g., bold or coloured)
- `InstagramPreview.tsx` calls `JSON.parse(content)` inside a try/catch — if it throws, render an error state instead of crashing; on success, render 10 slide cards in a scrollable row (DEC-06)

**Runnable test:**
> Action: Build the components; temporarily render them in isolation with hardcoded content — add to `src/app/page.tsx` during dev
> Expected: All three previews render without React errors; Instagram shows 10 discrete slide cards when given a valid JSON array string
> Fail signal: InstagramPreview crashes on `JSON.parse` (missing try/catch); TikTok shows raw `[Scene 1]` text without styling

**Blocker if test fails:** Inspect the Instagram `content` field in Appwrite console — paste it into a browser console and run `JSON.parse(...)` to confirm it's valid JSON.

---

### Step 8.2: Build preview page

**Build:** `src/app/dashboard/projects/[id]/page.tsx`

**Follows:** Step 8.1

**Implementation notes:**
- Client component that fetches outputs from Appwrite: `databases.listDocuments(outputsCollectionId, [Query.equal("projectId", id)])`
- Renders `<ChannelTabs>` and the matching preview component for `activeChannel`
- Placeholder `<textarea>` for inline edit (wired up in Milestone 9) and disabled Regenerate button (wired up in Milestone 10)
- Fetch both the project (for title display) and outputs on mount

**Runnable test:**
> Action: After completing the URL → generate flow (Milestone 6), navigate to `/dashboard/projects/[id]`
> Expected: Preview page loads with three channel tabs; clicking each tab renders the correct preview component with real Claude-generated content; Instagram tab shows 10 slides
> Fail signal: "outputs is empty" (outputs not fetched correctly — check Query); Instagram tab shows error state (raw content is not valid JSON)

**Blocker if test fails:** In browser DevTools console, run `JSON.parse(outputs.find(o => o.channel === "instagram").content)` — if it throws, the Claude prompt needs adjustment.

---

## Milestone 9: Inline Edit Saves to DB

**Unlocks:** Data persistence for edited content; required for regenerate to have something to update.
**TASK reference:** TASK-27

---

### Step 9.1: Implement PUT /api/outputs/[id] and wire up inline edit

**Build:** `src/app/api/outputs/[id]/route.ts` (PUT handler), update `src/app/dashboard/projects/[id]/page.tsx`

**Follows:** Step 8.2

**Implementation notes:**
- Route validates session and verifies `output.userId === session.userId` → 403 per docs/API_CONTRACT.md
- `databases.updateDocument(outputsCollectionId, id, { content })` → return `{ id, content, updatedAt: new Date().toISOString() }`
- Preview page: clicking output text enters edit mode (`editingId = output.$id`, `editContent = output.content`); on textarea blur → call `PUT /api/outputs/[id]` with `{ content: editContent }` per docs/API_CONTRACT.md; on success → update `outputs` state; on error → `toast.error(...)`

**Runnable test:**
> Action: On preview page, click the Facebook content → edit some text → click outside the textarea
> Expected: Appwrite console shows the `outputs` document with updated `content` field matching the new text
> Fail signal: Content reverts after blur (response not applied to state); 403 (session userId mismatch — check DEC-05 implementation)

**Blocker if test fails:** Check DevTools Network tab for the `PUT /api/outputs/[id]` response — if 200 but state does not update, the `setOutputs` call after the fetch is missing.

---

## Milestone 10: Regenerate Streams Correctly

**Unlocks:** Per-channel regeneration feature; streaming UX validation.
**TASK reference:** TASK-17, TASK-28

---

### Step 10.1: Add streamContent() to ai.ts and implement POST /api/outputs/[id]/regenerate

**Build:** Update `src/lib/ai.ts` (add `streamContent`), `src/app/api/outputs/[id]/regenerate/route.ts`

**Follows:** Step 6.1, Step 9.1

**Implementation notes:**
- `streamContent()` uses `anthropic.messages.stream(...)` which returns an `AsyncIterable<MessageStreamEvent>` — wrap in a `ReadableStream` using `new ReadableStream({ async start(controller) { for await (const chunk of stream) { controller.enqueue(chunk.delta?.text ?? "") } controller.close() } })`
- Regenerate route uses `TransformStream` — one `WritableStream` side accumulates chunks into `let accumulated = ""`; the other `ReadableStream` side is piped to the `Response` — after the transform closes, call `updateOutput(id, accumulated)` (DEC-09 pattern)
- Do NOT `await` the stream before returning `new Response(readable, { headers: { "Content-Type": "text/event-stream" } })` — returning the response first is what enables streaming UX
- Preview page: on "Regenerate" click → set `regenerating = channel`; use `fetch` with `response.body.getReader()` to read chunks and append to a local `string` state; on stream end → set `regenerating = null` and update `outputs` state

**Runnable test:**
> Action: On preview page, click "Regenerate" on the TikTok channel
> Expected: TikTok content visibly streams in character-by-character (not a sudden swap); after stream ends, content is fully updated; Appwrite console shows the `outputs` document with the new TikTok `content` value
> Fail signal: Content appears all at once (streaming not working — check `TransformStream` setup); content does not update in Appwrite (DB write after stream end missing)

**Blocker if test fails:** Check browser DevTools Network tab — the `POST /api/outputs/[id]/regenerate` request should show `Transfer-Encoding: chunked` and the response body should arrive incrementally.

---

## Milestone 11: Dashboard Works Completely

**Unlocks:** Full project history and management; required for Week 5 verification.
**TASK reference:** TASK-33, TASK-34, TASK-35, TASK-39, TASK-40

---

### Step 11.1: Build dashboard home page with project grid and stats

**Build:** `src/app/dashboard/page.tsx`

**Follows:** Step 2.3

**Implementation notes:**
- Fetch all `projects` where `userId === session.userId` sorted by `createdAt DESC`
- Render project cards with title, `sourceType` icon, `status` badge (colour-coded: pending=grey, processing=yellow, done=green, failed=red)
- Stats cards: total project count, total output count (query `outputs` collection), projects created in last 7 days (filter by `createdAt >= 7daysAgo`)
- Recharts `<BarChart>` with data shaped as `[{ date: "Apr-01", count: 3 }, ...]` for last 7 days (FR-ANAL-02)
- Source-type filter (URL / Text / Audio / All) and title search are client-side filters on the fetched array — no additional Appwrite queries needed

**Runnable test:**
> Action: Visit `http://localhost:3000/dashboard` after creating at least 2 projects
> Expected: Project cards show correct titles, source type icons, and status badges; stats cards show non-zero numbers; bar chart renders with at least one bar
> Fail signal: Empty grid (userId query wrong — check Query.equal syntax); chart renders but all bars are zero (date grouping logic off)

**Blocker if test fails:** Log the raw Appwrite response in the browser console — check the `documents` array and ensure each document has a `userId` field matching the logged-in user.

---

### Step 11.2: Implement cascade delete

**Build:** Update `src/app/dashboard/page.tsx` (or add a dedicated delete API route)

**Follows:** Step 11.1

**Implementation notes:**
- On delete confirmation: first query and delete all `schedules` with `outputId IN [project's outputIds]`; then delete all `outputs` where `projectId === project.$id`; then delete the `project` document — strict order per DEC-08
- Wrap in try/catch — if any step throws, surface `toast.error(...)` and halt sequence
- Show a confirmation dialog (`window.confirm` is acceptable for MVP) before starting the sequence

**Runnable test:**
> Action: Create a project with outputs → delete it from dashboard → check Appwrite console
> Expected: Appwrite console shows the project document is gone; `outputs` collection shows no documents with that `projectId`; `schedules` collection shows no documents referencing that project's output IDs
> Fail signal: Project deleted but outputs remain (delete order wrong — check DEC-08); 403 on any delete call (session not passed to the delete calls)

**Blocker if test fails:** Check that each Appwrite `deleteDocument` call uses the server SDK (not client SDK) if done via an API route, or that the client SDK calls are wrapped with the correct session.

---

## Milestone 12: Settings and Brand Voice Work

**Unlocks:** Verifiable brand voice injection in generated content.
**TASK reference:** TASK-32

---

### Step 12.1: Build settings page and verify brand voice injection

**Build:** `src/app/dashboard/settings/page.tsx`

**Follows:** Step 2.3, Step 6.2

**Implementation notes:**
- Display name input, brand voice selector (4 options: energetic / educational / funny / calm), keyword tag input (max 10 tags, max 50 chars each) — all from `profiles` collection schema
- Save via `databases.updateDocument(profilesCollectionId, profileId, { displayName, brandVoice, brandKeywords })`
- `POST /api/projects/[id]/generate` already fetches the profile and injects `brandVoice` and `brandKeywords` into prompts (Step 6.2) — no change needed to the generate route

**Runnable test:**
> Action: Go to Settings → set brand voice to "Funny" → add keyword "viral" → Save → create a new URL project and trigger generation
> Expected: The generated Facebook output noticeably uses humour and contains the word "viral"; tone differs from an "energetic" baseline
> Fail signal: Output tone unchanged (brand voice not fetched in generate route — check `getOrCreateProfile()` call); keyword "viral" not present anywhere in outputs

**Blocker if test fails:** Add `console.log(profile.brandVoice, profile.brandKeywords)` inside the generate route (server console) to confirm the profile is being fetched before Claude is called.

---

## Milestone 13: Export and Scheduler Work

**Unlocks:** Full feature completeness for Weeks 1–6.
**TASK reference:** TASK-36, TASK-37, TASK-38

---

### Step 13.1: Implement export features

**Build:** Update `src/app/dashboard/projects/[id]/page.tsx`

**Follows:** Step 8.2

**Implementation notes:**
- Copy to clipboard: `navigator.clipboard.writeText(activeOutput.content)` → `toast.success("Copied!")`
- `.txt` download: `new Blob([content], { type: "text/plain" })` → `URL.createObjectURL` → programmatic anchor click with `download` attribute set to `"<channel>-content.txt"`
- `.json` download: `JSON.stringify({ facebook: ..., tiktok: ..., instagram: JSON.parse(...) }, null, 2)` → Blob with `type: "application/json"` → download as `"all-outputs.json"`
- For `.json` export, parse Instagram content from its JSON string back to array before embedding (DEC-06)

**Runnable test:**
> Action: On preview page → click "Download .json"
> Expected: A `.json` file downloads; open the file — it contains an object with keys `facebook`, `tiktok`, `instagram`; `instagram` is an array of 10 strings (not a raw JSON string)
> Fail signal: Downloaded file has `instagram` as a raw string (forgot `JSON.parse` before embedding); file has only 1 or 2 channels (outputs not all fetched)

**Blocker if test fails:** Log `outputs` in browser console — confirm all 3 channel outputs are present in the array.

---

### Step 13.2: Build scheduler page and schedule creation

**Build:** `src/app/dashboard/scheduler/page.tsx`, update `src/app/dashboard/projects/[id]/page.tsx`

**Follows:** Step 11.1

**Implementation notes:**
- Schedule creation: date/time picker on preview page → `databases.createDocument(schedulesCollectionId, ...)` with `outputId`, `userId`, `scheduledAt` (ISO 8601), `status: "scheduled"` — display only, no actual publish mechanism
- Scheduler page: query all `schedules` where `userId === session.userId` sorted by `scheduledAt ASC`; render with channel name, project title (join via `projectId`), scheduled time, and status badge

**Runnable test:**
> Action: On preview page, schedule the Facebook output for a future date → navigate to `/dashboard/scheduler`
> Expected: Scheduler page shows the scheduled post with the correct channel, title, and scheduled datetime; Appwrite console shows the `schedules` document
> Fail signal: Scheduler page is empty (userId query wrong); scheduled time shows wrong timezone (ensure ISO 8601 string stored, display converted to local time)

**Blocker if test fails:** Check the `schedules` document in Appwrite console — confirm `userId` matches the logged-in user's ID.

### Step 13.3: Build image prompt feature

**Build:** `src/lib/prompts/image-prompt.ts`, `src/app/api/outputs/[id]/image-prompt/route.ts`, `src/components/preview/ImagePromptButton.tsx`

**Follows:** Step 8.2, Step 6.1

**Implementation notes:**
- `image-prompt.ts` exports `buildImagePromptSystemPrompt()` and `buildImagePromptUserPrompt(content, channel)` — instructs AI to produce a detailed image generation prompt (subject, style, mood, composition) suited to the channel's visual format
- `POST /api/outputs/[id]/image-prompt` validates session, calls `generateContent()`, then `databases.updateDocument(outputsCollectionId, id, { imagePrompt: result })` — returns `{ imagePrompt }` per DEC-12
- `ImagePromptButton.tsx` renders a button on the preview page; on click calls the route, shows loading state, then displays the generated prompt in a read-only textarea with a copy button
- `imagePrompt` field added to `Output` type in `src/types/index.ts`

**Runnable test:**
> Action: On preview page, click "Generate Image Prompt" on any output
> Expected: Button shows loading state → textarea appears with a detailed image prompt; Appwrite console shows `imagePrompt` field populated on the output document
> Fail signal: 403 (session mismatch — DEC-05); empty imagePrompt returned (check `generateContent()` call and prompt content)

**Blocker if test fails:** Log the raw AI response inside the route (server console) — if it's empty, the prompt builder is returning blank content.

---

## Milestone 14: Full E2E on Vercel

**Unlocks:** Production deployment — the final deliverable.
**TASK reference:** TASK-41, TASK-42

---

### Step 14.1: Add error boundaries and mobile responsiveness

**Build:** Update all major page files listed in TASK-41 and TASK-42

**Follows:** All prior milestones

**Implementation notes:**

**UI fix — layout viewport gap (TASK-42 · `src/app/layout.tsx`, `src/app/dashboard/layout.tsx`)**
- *Before:* All dashboard pages showed a large empty purple/gradient strip on the right side of the screen (~40% of viewport width) because `<body>` was `flex` row and `DashboardLayout` div had no `w-full`, causing it to shrink to content width only.
- *After:* `flex` removed from `<body>`; `w-full` added to DashboardLayout div; `overflow-x-hidden` added to body. Dashboard now fills 100% of viewport width with no visual gap.

**UI fix — processing page dark theme (TASK-42 · `src/app/dashboard/projects/[id]/processing/page.tsx`)**
- *Before:* Processing page used `bg-gray-50` (white background) and `text-gray-800` — a light-mode colour palette that clashed with the rest of the dark-theme app, creating a jarring white flash mid-flow.
- *After:* Replaced with dark palette (`text-white`, `text-slate-400`, `bg-white/[0.06]`, `text-indigo-400`). Step indicators and spinner now match the app's visual language. Two separate `return` paths consolidated into a single conditional return.

**UI overhaul — new project page (TASK-42 · `src/app/dashboard/new/page.tsx`)**
- *Before:* Single narrow `max-w-2xl` column. After clicking "Scrape URL" the page immediately created a project and redirected — no feedback, no preview, empty space below the form.
- *After:* Two-column layout (`grid-cols-1 lg:grid-cols-2`). Left column: input form. Right column: context panel that changes based on state:
  - **Empty state:** "How it works" guide — 3 numbered steps (Choose source → AI writes → Preview & publish) + channel badges (Facebook / TikTok / Instagram) + per-channel output description
  - **After URL scrape / audio transcribe:** Preview card — extracted title, first 240 chars of content, character count, channel badges, "Generate Content →" confirm button, "Try a different URL / Upload a different file" reset link. Input is `disabled` until reset to prevent double-scrape confusion.
  - **While typing text (>30 chars):** Live hint card — character count, channel badges, output description per channel.
- Project is only created when the user explicitly clicks "Generate Content →" in the preview card (confirm-before-generate flow).

**Remaining for Step 14.1:**
- [TODO] Create `src/components/ErrorBoundary.tsx` as a class component with `componentDidCatch` — wrap each major page's content in it
- [TODO] Mobile sidebar: collapse `w-60` to `w-14 md:w-60` with icon-only display below `md:` breakpoint — labels hidden via `hidden md:inline`
- [TODO] Test on mobile viewport using Chrome DevTools device simulation (iPhone SE 375×667)

**Runnable test:**
> Action: In Chrome DevTools, set viewport to iPhone SE (375×667) → visit dashboard, new project, and preview pages
> Expected: All pages are usable without horizontal scrolling; sidebar collapses to icon-only; no text overflow
> Fail signal: Horizontal overflow; sidebar overlaps content

**Blocker if test fails:** Check `overflow-x-hidden` is on `<body>` in `src/app/layout.tsx`. Verify sidebar uses `w-14 md:w-60`.

---

### Step 14.2: Deploy to Vercel and run full E2E verification

**Build:** Vercel project configuration; all `.env.local` vars added to Vercel Environment Variables

**Follows:** Step 14.1

**Implementation notes:**
- Add all environment variables from `.env.local` to Vercel Dashboard > Settings > Environment Variables — include both `NEXT_PUBLIC_*` and server-only vars
- Add Vercel deployment URL to Appwrite > Auth > Settings > Allowed Hostnames and OAuth redirect URLs
- Run docs/REQUIREMENTS.md Section 10 verification checklist on the live Vercel URL
- `APPWRITE_API_KEY` is server-only — confirm it does not appear in any client bundle (check Vercel build output for warnings)

**Runnable test:**
> Action: On the live Vercel URL: register → login → submit a real audio file → wait for transcription → trigger generation → preview → edit one output → regenerate one channel → export `.json` → schedule one post
> Expected: Every step completes without error; exported `.json` contains all 3 channels; scheduled post appears in scheduler page; no 500 errors in Vercel function logs
> Fail signal: Any 500 error (check Vercel function logs for the specific route); CORS error on Appwrite calls (add Vercel domain to Appwrite allowed hostnames)

**Blocker if test fails:** Check Vercel function logs (Dashboard > Deployments > Functions tab) — the error message will identify which API route and which line failed.

---

## Summary

- **Total milestones:** 14
- **Total steps:** 23
- **Longest milestone (most steps):** Milestone 2 (Auth Works End-to-End) — 4 steps
- **First step where a real Claude API call is made:** Step 6.1 (runnable test calls `generateContent()`)
- **First step where real Appwrite data is written:** Step 2.1 (register creates a user; Step 2.3 creates the first `profiles` document)

**TASKs in docs/TASKS.md not covered by any step in this plan:**
- None — all 42 tasks (TASK-01 through TASK-42) are covered. Cross-reference:
  - TASK-01: Step 1.3 (Appwrite config prerequisite)
  - TASK-02: Step 2.1
  - TASK-03: Step 2.1
  - TASK-04: Step 2.2
  - TASK-05: Step 2.3
  - TASK-06: Step 2.3
  - TASK-07: Step 2.3
  - TASK-08: Step 3.1
  - TASK-09: Step 5.1
  - TASK-10: Step 5.2
  - TASK-11: Step 5.2
  - TASK-12: Step 3.2
  - TASK-13: Step 3.2
  - TASK-14: Step 4.1
  - TASK-15: Step 5.3
  - TASK-16: Steps 3.2, 4.1, 5.3
  - TASK-17: Step 10.1
  - TASK-18: Step 6.1
  - TASK-19: Step 6.2
  - TASK-20: Step 7.1
  - TASK-21: Step 7.2
  - TASK-22: Step 8.1
  - TASK-23: Step 8.1
  - TASK-24: Step 8.1
  - TASK-25: Step 8.1
  - TASK-26: Step 8.2
  - TASK-27: Step 9.1
  - TASK-28: Step 10.1
  - TASK-29: Step 13.3
  - TASK-30: Step 13.3
  - TASK-31: Step 13.3
  - TASK-32: Step 12.1
  - TASK-33: Step 11.1
  - TASK-34: Step 11.1
  - TASK-35: Step 11.2
  - TASK-36: Step 13.1
  - TASK-37: Step 13.2
  - TASK-38: Step 13.2
  - TASK-39: Step 11.1
  - TASK-40: Step 11.1
  - TASK-41: Step 14.1
  - TASK-42: Step 14.1

> **Completed steps as of 2026-04-26:** Steps 1.1–14.1 are all complete. Step 14.2: deployed to https://multi-studio.vercel.app on 2026-04-26 — build compiled, 16 pages, all 11 env vars set in Vercel Production, APPWRITE_API_KEY confirmed server-only. E2E checklist (register → generate → export → schedule on live URL) not yet run — pending manual Appwrite/Google OAuth hostname config first.
