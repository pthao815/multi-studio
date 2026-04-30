# AI Multi-Studio — API Contract

> This document is the single source of truth for all request/response shapes.
> It supersedes any conflicting shapes in docs/MODULE_STRUCTURE.md (see Section 5 note).
> All routes derive `userId` exclusively from the verified Appwrite session cookie — never from the request body (DEC-05).

---

## POST /api/scrape

**Auth required:** yes
**Session source:** `appwrite-session` cookie (auto-sent by browser)

**Request:**
```typescript
// Headers
{ "Content-Type": "application/json" }

// Body
{
  url: string  // fully-qualified URL to scrape (must begin with http:// or https://)
}
```

**Response — Success:**
```typescript
// Status: 200
{
  title: string  // value of <title> tag, used as project title per DEC-07
  text:  string  // scraped body text passed as sourceContent to projects collection
}
```

**Response — Error:**
```typescript
// Status: 400 | 500
{
  error: string  // user-readable message
  code:  string  // machine-readable code
}
```

**Error codes defined:**
| Code | Status | Trigger |
|---|---|---|
| `INVALID_URL` | 400 | `url` field is missing, empty, or does not begin with `http://`/`https://` |
| `NO_CONTENT` | 400 | Cheerio finds no readable body text after stripping scripts/styles |
| `SCRAPE_FAILED` | 500 | Network error fetching the URL, or unexpected Cheerio exception |

**Frontend calls this from:** `src/components/input/UrlInput.tsx`
**Backend implements in:** `src/app/api/scrape/route.ts`
**DEC reference:** DEC-07

---

## POST /api/upload

**Auth required:** yes
**Session source:** `appwrite-session` cookie

**Request:**
```typescript
// Headers
{ "Content-Type": "multipart/form-data" }  // set automatically by fetch with FormData body

// Body — FormData
{
  file: File  // audio file; accepted MIME types: audio/mpeg, audio/wav, audio/x-m4a; max 25 MB
}
```

**Response — Success:**
```typescript
// Status: 200
{
  fileId: string  // Appwrite Storage file ID in the private bucket; used by POST /api/transcribe
}
```

**Response — Error:**
```typescript
// Status: 400 | 413 | 500
{
  error: string
  code:  string
}
```

**Error codes defined:**
| Code | Status | Trigger |
|---|---|---|
| `UNSUPPORTED_FILE_TYPE` | 400 | File MIME type is not `audio/mpeg`, `audio/wav`, or `audio/x-m4a` |
| `FILE_TOO_LARGE` | 413 | File size exceeds 25 MB |
| `UPLOAD_FAILED` | 500 | Appwrite `storage.createFile()` throws, or session verification fails |

**Note:** The signed URL is generated server-side and passed directly to AssemblyAI — it is **never** returned to the client (DEC-01). The client receives only `fileId`.

**Frontend calls this from:** `src/components/input/AudioUpload.tsx`
**Backend implements in:** `src/app/api/upload/route.ts`
**DEC reference:** DEC-01, DEC-05

---

## POST /api/transcribe

**Auth required:** yes
**Session source:** `appwrite-session` cookie

**Request:**
```typescript
// Headers
{ "Content-Type": "application/json" }

// Body
{
  fileId: string  // Appwrite Storage file ID returned by POST /api/upload
}
```

**Response — Success:**
```typescript
// Status: 200
{
  transcriptId: string  // AssemblyAI transcript ID; used to poll GET /api/transcribe/[id]
}
```

**Response — Error:**
```typescript
// Status: 500
{
  error: string
  code:  string
}
```

**Error codes defined:**
| Code | Status | Trigger |
|---|---|---|
| `TRANSCRIPTION_SUBMIT_FAILED` | 500 | Server fails to regenerate the signed URL from `fileId`, or AssemblyAI job submission throws |

**Note:** This route independently regenerates the signed URL server-side via `storage.getFileDownload(fileId)` before submitting to AssemblyAI (DEC-01, DEC-02). No polling happens inside this route — polling is done by the client via `GET /api/transcribe/[id]`.

**Frontend calls this from:** `src/components/input/AudioUpload.tsx`
**Backend implements in:** `src/app/api/transcribe/route.ts`
**DEC reference:** DEC-01, DEC-02, DEC-05

---

## GET /api/transcribe/[id]

**Auth required:** yes
**Session source:** `appwrite-session` cookie

**Request:**
```typescript
// Headers
{ "Cookie": "appwrite-session=..." }  // auto-sent by browser

// Path parameter
id: string  // AssemblyAI transcriptId returned by POST /api/transcribe
```

**Response — Success:**
```typescript
// Status: 200
{
  status: "queued" | "processing" | "completed" | "error"
  text?:  string  // present only when status === "completed"; full transcript text
}
```

**Response — Error:**
```typescript
// Status: 500
{
  error: string
  code:  string
}
```

**Error codes defined:**
| Code | Status | Trigger |
|---|---|---|
| `TRANSCRIPTION_POLL_FAILED` | 500 | AssemblyAI API call throws, or session verification fails |

**Note:** The client polls this endpoint every 5 seconds until `status` is `"completed"` or `"error"`. On `"completed"`, the caller saves `text` to `projects.transcription` and `projects.sourceContent` (DEC-02).

**Frontend calls this from:** `src/components/input/AudioUpload.tsx` (via `setInterval`)
**Backend implements in:** `src/app/api/transcribe/[id]/route.ts`
**DEC reference:** DEC-02, DEC-05

---

## GET /api/projects/[id]/status

**Auth required:** yes
**Session source:** `appwrite-session` cookie

**Request:**
```typescript
// Headers
{ "Cookie": "appwrite-session=..." }

// Path parameter
id: string  // Appwrite projects collection document ID
```

**Response — Success:**
```typescript
// Status: 200
{
  status: "pending" | "processing" | "done" | "failed"
}
```

**Response — Error:**
```typescript
// Status: 403 | 404
{
  error: string
  code:  string
}
```

**Error codes defined:**
| Code | Status | Trigger |
|---|---|---|
| `UNAUTHORIZED` | 403 | Session `userId` does not match `project.userId` |
| `PROJECT_NOT_FOUND` | 404 | No document exists with the given `id` in the projects collection |

**Note:** The processing page polls this endpoint every 3 seconds. After 20 failed or non-`"done"` attempts it surfaces an error state (DEC-03).

**Frontend calls this from:** `src/app/dashboard/projects/[id]/processing/page.tsx`
**Backend implements in:** `src/app/api/projects/[id]/status/route.ts`
**DEC reference:** DEC-03, DEC-05

---

## POST /api/projects/[id]/generate

**Auth required:** yes
**Session source:** `appwrite-session` cookie

**Request:**
```typescript
// Headers
{ "Cookie": "appwrite-session=..." }

// Path parameter
id: string  // Appwrite projects collection document ID

// Body: none — all source data and brand voice are fetched server-side from Appwrite
```

**Response — Success:**
```typescript
// Status: 200
{
  success: true
}
```

**Response — Error:**
```typescript
// Status: 403 | 500
{
  error: string
  code:  string
}
```

**Error codes defined:**
| Code | Status | Trigger |
|---|---|---|
| `UNAUTHORIZED` | 403 | Session `userId` does not match `project.userId` |
| `GENERATION_FAILED` | 500 | `Promise.all` across 3 Claude calls throws, Instagram JSON validation fails after retry, or Appwrite output writes fail |

**Note:** Route uses `Promise.all` across 3 simultaneous `generateContent()` calls (DEC-11). Instagram output uses `responseMimeType: "application/json"` (DEC-18) — malformed JSON is not expected. After parsing, the route verifies `slides.length === 10` and `hashtags.length === 30` as application-level guards. On guard failure → `GENERATION_FAILED` immediately. **No retry is implemented** (DEC-18 eliminates the need). On success, project status is set to `"done"`. Route must declare `export const maxDuration = 60` as first line (DEC-19).

**Frontend calls this from:** `src/app/dashboard/new/page.tsx`
**Backend implements in:** `src/app/api/projects/[id]/generate/route.ts`
**DEC reference:** DEC-05, DEC-06, DEC-11

---

## PUT /api/outputs/[id]

**Auth required:** yes
**Session source:** `appwrite-session` cookie

**Request:**
```typescript
// Headers
{ "Content-Type": "application/json" }

// Path parameter
id: string  // Appwrite outputs collection document ID

// Body
{
  content: string  // updated output text; for Instagram channel, must be a valid JSON array string of 10 strings (DEC-06)
}
```

**Response — Success:**
```typescript
// Status: 200
{
  id:        string  // Appwrite output document ID (same as path param)
  content:   string  // the saved content value (mirrors request body)
  updatedAt: string  // ISO 8601 timestamp of the update
}
```

**Response — Error:**
```typescript
// Status: 403 | 500
{
  error: string
  code:  string
}
```

**Error codes defined:**
| Code | Status | Trigger |
|---|---|---|
| `UNAUTHORIZED` | 403 | Session `userId` does not match `output.userId` |
| `UPDATE_FAILED` | 500 | Appwrite `databases.updateDocument()` throws |

**Frontend calls this from:** `src/app/dashboard/projects/[id]/page.tsx` (on textarea blur — auto-save)
**Backend implements in:** `src/app/api/outputs/[id]/route.ts`
**DEC reference:** DEC-05

---

## POST /api/outputs/[id]/regenerate

**Auth required:** yes
**Session source:** `appwrite-session` cookie

**Request:**
```typescript
// Headers
{ "Cookie": "appwrite-session=..." }

// Path parameter
id: string  // Appwrite outputs collection document ID

// Body: none — channel type and source content fetched server-side from Appwrite
```

**Response — Success:**
```typescript
// Status: 200
// Content-Type: text/event-stream
// Transfer-Encoding: chunked
// Body: raw text stream — each chunk is a partial string of the regenerated content
// Stream closes when generation is complete; DB write happens after stream closes
```

**Response — Error:**
```typescript
// Status: 403 | 500
{
  error: string
  code:  string
}
```

**Error codes defined:**
| Code | Status | Trigger |
|---|---|---|
| `UNAUTHORIZED` | 403 | Session `userId` does not match `output.userId` |
| `REGENERATION_FAILED` | 500 | `streamContent()` throws before stream opens, or Appwrite DB write after stream ends fails |

**Note:** Uses `TransformStream` — chunks are piped to the `Response` AND accumulated for a single `updateOutput()` call after the stream closes (DEC-09). Do not await stream completion before returning `Response` (breaks streaming UX). Do not skip the DB write (breaks inline edit state).

**Frontend calls this from:** `src/app/dashboard/projects/[id]/page.tsx` (Regenerate button)
**Backend implements in:** `src/app/api/outputs/[id]/regenerate/route.ts`
**DEC reference:** DEC-05, DEC-09

---

## POST /api/outputs/[id]/image-prompt

**Auth required:** yes
**Session source:** `appwrite-session` cookie

**Request:**
```typescript
// Headers
{ "Cookie": "appwrite-session=..." }

// Path parameter
id: string  // Appwrite outputs collection document ID

// Body: none — output content fetched server-side from Appwrite
```

**Response — Success:**
```typescript
// Status: 200
{
  imagePrompt: string  // Claude-generated image/art-direction prompt saved to outputs.imagePrompt field
}
```

**Response — Error:**
```typescript
// Status: 403 | 500
{
  error: string
  code:  string
}
```

**Error codes defined:**
| Code | Status | Trigger |
|---|---|---|
| `UNAUTHORIZED` | 403 | Session `userId` does not match `output.userId` |
| `IMAGE_PROMPT_FAILED` | 500 | Claude API call via `generateContent()` throws, or Appwrite update to `imagePrompt` field fails |

**Note:** Uses `generateContent()` (non-streaming) with the dedicated prompt from `src/lib/prompts/image-prompt.ts`. Result is saved to `outputs.imagePrompt` — a separate field from `content` — and also returned in the response so the client can display it immediately without a re-fetch (DEC-12).

**Frontend calls this from:** `src/components/preview/ImagePromptButton.tsx`
**Backend implements in:** `src/app/api/outputs/[id]/image-prompt/route.ts`
**DEC reference:** DEC-05, DEC-12

---

## PUT /api/projects/[id]/source  [Expansion Week 8]

**Auth required:** yes
**Session source:** `appwrite-session` cookie

**Request:**
```typescript
// Headers
{ "Content-Type": "application/json" }

// Path parameter
id: string  // Appwrite projects collection document ID

// Body (all fields optional — only provided fields are updated)
{
  sourceContent?:     string  // updated source text (user-edited in source preview panel)
  summarisedContent?: string  // updated summary (set when user overrides auto-summary)
  title?:             string  // updated project title (user-edited inline)
}
```

**Response — Success:**
```typescript
// Status: 200
{
  id:               string
  title:            string
  sourceContent:    string
  updatedAt:        string  // ISO 8601
}
```

**Response — Error:**
```typescript
// Status: 400 | 403 | 500
{
  error: string
  code:  string
}
```

**Error codes defined:**
| Code | Status | Trigger |
|---|---|---|
| `UNAUTHORIZED` | 403 | Session `userId` does not match `project.userId` |
| `NO_FIELDS` | 400 | Request body contains none of the three optional fields |
| `UPDATE_FAILED` | 500 | Appwrite `databases.updateDocument()` throws |

**Note:** Only updates the fields provided in the request body. Status, userId, sourceType, and audioFileId are never modified by this route. Called on textarea blur in the source preview panel (FR-SRC-03) and after auto-summarisation saves `summarisedContent` (DEC-25).

**Frontend calls this from:** `src/app/dashboard/new/page.tsx` (source preview panel)
**Backend implements in:** `src/app/api/projects/[id]/source/route.ts`
**DEC reference:** DEC-05, DEC-25

---

## POST /api/projects/[id]/duplicate  [Expansion Week 8]

**Auth required:** yes
**Session source:** `appwrite-session` cookie

**Request:**
```typescript
// Headers
{ "Cookie": "appwrite-session=..." }

// Path parameter
id: string  // Appwrite projects collection document ID to duplicate

// Body: none
```

**Response — Success:**
```typescript
// Status: 201
{
  newProjectId: string  // Appwrite document ID of the newly created project
}
```

**Response — Error:**
```typescript
// Status: 403 | 404 | 500
{
  error: string
  code:  string
}
```

**Error codes defined:**
| Code | Status | Trigger |
|---|---|---|
| `UNAUTHORIZED` | 403 | Session `userId` does not match `project.userId` |
| `PROJECT_NOT_FOUND` | 404 | No document with given `id` in the projects collection |
| `DUPLICATE_FAILED` | 500 | Appwrite `databases.createDocument()` throws |

**Note:** Creates a new `projects` document with `sourceType`, `sourceContent`, `summarisedContent` (if present), and `title` (original title + " (copy)") copied from the original. New document has `status: "pending"`, empty `audioFileId` and `transcription`, and fresh `createdAt`/`updatedAt` timestamps. No `outputs` documents are copied (DEC-23). The client navigates to the new project page on success.

**Frontend calls this from:** `src/app/dashboard/page.tsx` (Duplicate button on project card)
**Backend implements in:** `src/app/api/projects/[id]/duplicate/route.ts`
**DEC reference:** DEC-05, DEC-23

---

## POST /api/projects/[id]/compare  [Expansion Week 9]

**Auth required:** yes
**Session source:** `appwrite-session` cookie

**Request:**
```typescript
// Headers
{ "Content-Type": "application/json" }

// Path parameter
id: string  // Appwrite projects collection document ID

// Body
{
  outputId: string      // Appwrite outputs document ID for the channel being compared
  toneA:    BrandVoice  // "energetic" | "educational" | "funny" | "calm"
  toneB:    BrandVoice  // "energetic" | "educational" | "funny" | "calm"; must differ from toneA
}
```

**Response — Success:**
```typescript
// Status: 200
{
  contentA: string  // generated content using toneA
  contentB: string  // generated content using toneB
}
```

**Response — Error:**
```typescript
// Status: 400 | 403 | 500
{
  error: string
  code:  string
}
```

**Error codes defined:**
| Code | Status | Trigger |
|---|---|---|
| `UNAUTHORIZED` | 403 | Session `userId` does not match `project.userId` or `output.userId` |
| `SAME_TONE` | 400 | `toneA === toneB` |
| `COMPARE_FAILED` | 500 | Either `generateContent()` call throws, or either result fails the DEC-17 refusal check |

**Note:** Fetches the project's `summarisedContent || sourceContent` and the output's `channel`. Fires two `generateContent()` calls in parallel via `Promise.all`, each using the same channel prompt but different `buildBrandVoicePrompt()` fragments. Neither result is written to the database — both are returned to the client for display in `ToneCompareModal.tsx` (DEC-24). If the user selects a version, the client calls `PUT /api/outputs/[id]` separately to save it. Route must declare `export const maxDuration = 60` (DEC-19).

**Frontend calls this from:** `src/components/preview/ToneCompareModal.tsx`
**Backend implements in:** `src/app/api/projects/[id]/compare/route.ts`
**DEC reference:** DEC-05, DEC-19, DEC-24

---

## POST /api/outputs/[id]/score  [Expansion Week 9]

**Auth required:** yes
**Session source:** `appwrite-session` cookie

**Request:**
```typescript
// Headers
{ "Cookie": "appwrite-session=..." }

// Path parameter
id: string  // Appwrite outputs collection document ID

// Body: none — output content and channel fetched server-side from Appwrite
```

**Response — Success:**
```typescript
// Status: 200
{
  qualityScore: string  // raw JSON string: { total, hook, cta, platformFit, brandAlignment, tip }
}
```

**Response — Error:**
```typescript
// Status: 400 | 403 | 500
{
  error: string
  code:  string
}
```

**Error codes defined:**
| Code | Status | Trigger |
|---|---|---|
| `UNAUTHORIZED` | 403 | Session `userId` does not match `output.userId` |
| `SCORE_FAILED` | 400 | Parsed score object fails invariant (`hook + cta + platformFit + brandAlignment !== total`) or any field is missing |
| `SCORE_GENERATION_FAILED` | 500 | `generateContent()` throws, or Appwrite `updateDocument` to `qualityScore` field fails |

**Note:** Uses `generateContent()` (non-streaming) with `buildQualityScorePrompt(channel, brandVoice)` from `src/lib/prompts/quality-score.ts`. Calls `temperature: 0.2` and `response_format: { type: "json_object" }` to maximise score consistency (DEC-21). Validates the invariant sum before saving. Result is saved to `outputs.qualityScore` as a raw JSON string and also returned in the response for immediate display. Route must declare `export const maxDuration = 60` (DEC-19).

**Frontend calls this from:** `src/app/dashboard/projects/[id]/page.tsx` (auto-triggered after generation and regeneration)
**Backend implements in:** `src/app/api/outputs/[id]/score/route.ts`
**DEC reference:** DEC-05, DEC-19, DEC-21

---

## POST /api/outputs/[id]/hashtags  [Expansion Week 9]

**Auth required:** yes
**Session source:** `appwrite-session` cookie

**Request:**
```typescript
// Headers
{ "Cookie": "appwrite-session=..." }

// Path parameter
id: string  // Appwrite outputs collection document ID (must be an instagram channel output)

// Body: none — slides content fetched from output.content server-side
```

**Response — Success:**
```typescript
// Status: 200
{
  hashtags: string[]  // the 30 newly optimised hashtag strings (without # prefix)
}
```

**Response — Error:**
```typescript
// Status: 400 | 403 | 500
{
  error: string
  code:  string
}
```

**Error codes defined:**
| Code | Status | Trigger |
|---|---|---|
| `UNAUTHORIZED` | 403 | Session `userId` does not match `output.userId` |
| `WRONG_CHANNEL` | 400 | `output.channel !== "instagram"` |
| `HASHTAG_FAILED` | 400 | `hashtags.length !== 30` after parsing the AI response |
| `HASHTAG_GENERATION_FAILED` | 500 | `generateContent()` throws, or Appwrite `updateDocument` fails |

**Note:** Fetches output, verifies channel is `"instagram"`, calls `JSON.parse(output.content)` to get `{ slides, caption, hashtags }`. Joins `slides` with `\n\n` as the prompt input. Calls `generateContent()` with `buildHashtagOptimizerPrompt()` using `temperature: 0.4` and JSON mode. After validation, reconstructs the Instagram JSON object via `{ ...existing, hashtags: newHashtags }` and saves via `databases.updateDocument({ content: JSON.stringify(merged) })`. The `slides` and `caption` fields are never modified (DEC-26). Route must declare `export const maxDuration = 60` (DEC-19).

**Frontend calls this from:** `src/components/preview/InstagramPreview.tsx` (Refresh Hashtags button)
**Backend implements in:** `src/app/api/outputs/[id]/hashtags/route.ts`
**DEC reference:** DEC-05, DEC-06, DEC-19, DEC-26
