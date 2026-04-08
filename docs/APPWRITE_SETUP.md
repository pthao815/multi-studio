# AI Multi-Studio — Appwrite Cloud Setup Checklist

**Audience:** Developer with zero prior Appwrite experience
**Goal:** Fully configured Appwrite Cloud project ready for local development
**Time estimate:** 30–45 minutes

Cross-references: [DATABASE_DESIGN.md](./DATABASE_DESIGN.md) · [REQUIREMENTS.md](./REQUIREMENTS.md) · [DECISIONS.md](./DECISIONS.md)

---

## 1. Create Appwrite Project

- [ ] Go to [https://cloud.appwrite.io](https://cloud.appwrite.io)
- [ ] Click **Sign Up** and create a free account (or **Log In** if you already have one)
- [ ] On the dashboard, click **Create Project**
- [ ] Enter name: `AI Multi-Studio`
- [ ] Select the region closest to your users (e.g. Frankfurt for EU, New York for US)
- [ ] Click **Create**
- [ ] On the project overview page, find **Project ID** under the project name
- [ ] Copy the Project ID → paste into `.env.local`:
  ```
  NEXT_PUBLIC_APPWRITE_PROJECT_ID=<paste here>
  ```
- [ ] Also set the endpoint (this never changes for Appwrite Cloud):
  ```
  NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
  ```

---

## 2. Create Database

- [ ] In the left sidebar, click **Databases**
- [ ] Click **Create Database**
- [ ] Enter name: `multi-studio`
- [ ] Click **Create**
- [ ] The new database appears in the list — click on it
- [ ] Copy the **Database ID** shown at the top of the page
- [ ] Paste into `.env.local`:
  ```
  NEXT_PUBLIC_APPWRITE_DB_ID=<paste here>
  ```

---

## 3. Create Collections

You will create 4 collections inside the `multi-studio` database. For each one: navigate to **Databases → multi-studio → Create Collection**, fill in the attributes listed below, set permissions, add indexes, then copy the Collection ID.

> **How to add an attribute:** Click the collection name → **Attributes** tab → **Create Attribute** → select type → fill in the form.
>
> **How to add an index:** Click the collection name → **Indexes** tab → **Create Index** → fill in the form.
>
> **How to set permissions:** Click the collection name → **Settings** tab → **Permissions** section.

---

### 3a. Collection: `profiles`

**Purpose:** One document per user. Stores display name, avatar, and brand voice settings injected into every Claude generation call (FR-SET-02, FR-GEN-06).

**Create the collection:**
- [ ] Click **Create Collection**
- [ ] Name: `profiles`
- [ ] Click **Create**

**Add these attributes** (Attributes tab → Create Attribute):

| Attribute | Type | Size | Required | Default | Notes |
|---|---|---|---|---|---|
| `userId` | String | 128 | Yes | *(none)* | Appwrite Auth UID |
| `displayName` | String | 128 | Yes | `""` (empty string) | Shown in TopBar and Settings |
| `avatarUrl` | String | 512 | No | `""` (empty string) | URL to avatar in Appwrite Storage |
| `brandVoice` | String | 20 | Yes | `"energetic"` | One of: energetic, educational, funny, calm |
| `brandKeywords` | String | 50 | No | *(none)* | **Enable "Array"** toggle; max 10 items |
| `createdAt` | DateTime | — | Yes | *(none)* | Set by server at document creation |

> For `brandKeywords`: when creating the String attribute, toggle **Array** to ON before saving. This creates a `string[]` field.

**Set permissions** (Settings tab → Permissions):

| Role | Permissions |
|---|---|
| Users | Read, Create, Update, Delete |

> In the Permissions panel, add **Users** (not "Any" or "Guests") and tick all four checkboxes. This ensures only authenticated users can access this collection. Document-level ownership is enforced by application code (DEC-05).

**Create indexes** (Indexes tab → Create Index):

| Index key | Type | Attribute | Notes |
|---|---|---|---|
| `userId_unique` | Unique | `userId` | Enforces one profile per user; supports `getOrCreateProfile()` lookup |

**Copy Collection ID:**
- [ ] Go to Settings tab of the `profiles` collection
- [ ] Copy the **Collection ID**
- [ ] Paste into `.env.local`:
  ```
  NEXT_PUBLIC_APPWRITE_PROFILES_COLLECTION_ID=<paste here>
  ```

---

### 3b. Collection: `projects`

**Purpose:** One document per content-generation job. Stores source material, status, and metadata (FR-INPUT-05, FR-GEN-03).

**Create the collection:**
- [ ] Click **Create Collection**
- [ ] Name: `projects`
- [ ] Click **Create**

**Add these attributes:**

| Attribute | Type | Size | Required | Default | Notes |
|---|---|---|---|---|---|
| `userId` | String | 128 | Yes | *(none)* | Foreign key to profiles.userId |
| `title` | String | 256 | Yes | *(none)* | Auto-derived per DEC-07 |
| `sourceType` | String | 10 | Yes | *(none)* | One of: url, text, audio |
| `sourceContent` | String | 100000 | Yes | `""` (empty string) | Raw scraped/pasted/transcribed text |
| `audioFileId` | String | 128 | No | `""` (empty string) | Appwrite Storage file ID (DEC-01) |
| `transcription` | String | 100000 | No | `""` (empty string) | AssemblyAI transcript text |
| `status` | String | 20 | Yes | `"pending"` | One of: pending, processing, done, failed |
| `createdAt` | DateTime | — | Yes | *(none)* | Set by server at creation |
| `updatedAt` | DateTime | — | Yes | *(none)* | Set by server on every status change |

> For `sourceContent` and `transcription`: Appwrite's default String size is 255. You must manually type `100000` in the size field to accommodate long articles and audio transcripts.

**Set permissions** (Settings tab):

| Role | Permissions |
|---|---|
| Users | Read, Create, Update, Delete |

**Create indexes:**

| Index key | Type | Attributes | Order | Notes |
|---|---|---|---|---|
| `userId_key` | Key | `userId` | ASC | Dashboard project list (QRY-04) |
| `status_key` | Key | `status` | ASC | Status filter; polling route (QRY-12) |
| `userId_createdAt` | Key | `userId`, `createdAt` | ASC, DESC | Analytics 7-day chart (QRY-19) |

> For the composite index `userId_createdAt`: when creating the index, click **Add Attribute** twice and add both `userId` (ASC) and `createdAt` (DESC).

**Copy Collection ID:**
- [ ] Copy the **Collection ID** from Settings tab
- [ ] Paste into `.env.local`:
  ```
  NEXT_PUBLIC_APPWRITE_PROJECTS_COLLECTION_ID=<paste here>
  ```

---

### 3c. Collection: `outputs`

**Purpose:** One document per platform-specific generated output. Up to 5 per project (facebook, tiktok, instagram, linkedin, twitter). Stores the generated text and optional image prompt (FR-GEN-02).

**Create the collection:**
- [ ] Click **Create Collection**
- [ ] Name: `outputs`
- [ ] Click **Create**

**Add these attributes:**

| Attribute | Type | Size | Required | Default | Notes |
|---|---|---|---|---|---|
| `projectId` | String | 128 | Yes | *(none)* | Foreign key to projects.$id |
| `userId` | String | 128 | Yes | *(none)* | Denormalised for per-user queries (DEC-05) |
| `channel` | String | 20 | Yes | *(none)* | One of: facebook, tiktok, instagram, linkedin, twitter |
| `content` | String | 65535 | Yes | `""` (empty string) | Generated text; Instagram stores a JSON array string (DEC-06) |
| `imagePrompt` | String | 4096 | No | `""` (empty string) | Image prompt from POST /api/outputs/[id]/image-prompt (DEC-12) |
| `createdAt` | DateTime | — | Yes | *(none)* | Set by server at creation |
| `updatedAt` | DateTime | — | Yes | *(none)* | Set by server on every edit |

> For `content`: set size to `65535` (Appwrite's maximum for String). Instagram outputs store a JSON object `{slides, caption, hashtags}` which can reach ~5000–8000 characters; Facebook and TikTok outputs can reach ~3000 characters. Do not use a smaller value.

**Set permissions:**

| Role | Permissions |
|---|---|
| Users | Read, Create, Update, Delete |

**Create indexes:**

| Index key | Type | Attributes | Order | Notes |
|---|---|---|---|---|
| `projectId_key` | Key | `projectId` | ASC | Preview page output fetch (QRY-09) |
| `userId_key` | Key | `userId` | ASC | Analytics + cascade delete (QRY-18, DEC-08) |
| `projectId_channel` | Key | `projectId`, `channel` | ASC, ASC | Per-channel regenerate lookup |

**Copy Collection ID:**
- [ ] Copy the **Collection ID** from Settings tab
- [ ] Paste into `.env.local`:
  ```
  NEXT_PUBLIC_APPWRITE_OUTPUTS_COLLECTION_ID=<paste here>
  ```

---

### 3d. Collection: `schedules`

**Purpose:** Display-only scheduled post entries. No actual publishing occurs — this is a UI feature only (FR-SCHED-04).

**Create the collection:**
- [ ] Click **Create Collection**
- [ ] Name: `schedules`
- [ ] Click **Create**

**Add these attributes:**

| Attribute | Type | Size | Required | Default | Notes |
|---|---|---|---|---|---|
| `outputId` | String | 128 | Yes | *(none)* | Foreign key to outputs.$id |
| `userId` | String | 128 | Yes | *(none)* | Denormalised for per-user queries (DEC-05) |
| `platform` | String | 20 | Yes | *(none)* | One of: facebook, tiktok, instagram, linkedin, twitter |
| `scheduledAt` | DateTime | — | Yes | *(none)* | User-selected future date/time |
| `status` | String | 20 | Yes | `"pending"` | One of: pending, sent, cancelled |

**Set permissions:**

| Role | Permissions |
|---|---|
| Users | Read, Create, Update, Delete |

**Create indexes:**

| Index key | Type | Attributes | Order | Notes |
|---|---|---|---|---|
| `userId_key` | Key | `userId` | ASC | Scheduler page list (QRY-16) |
| `outputId_key` | Key | `outputId` | ASC | Cascade delete lookup — critical for DEC-08 |
| `userId_scheduledAt` | Key | `userId`, `scheduledAt` | ASC, ASC | Sorted scheduler view |

> The `outputId` index is critical. Without it, cascade delete (DEC-08) requires a full collection scan to find schedules belonging to a deleted output, which fails at scale.

**Copy Collection ID:**
- [ ] Copy the **Collection ID** from Settings tab
- [ ] Paste into `.env.local`:
  ```
  NEXT_PUBLIC_APPWRITE_SCHEDULES_COLLECTION_ID=<paste here>
  ```

---

## 4. Configure OAuth (Google)

- [ ] In the Appwrite Console left sidebar, click **Auth**
- [ ] Click the **Settings** tab
- [ ] Scroll to **OAuth2 Providers** and find **Google**
- [ ] Click the toggle to enable Google OAuth
- [ ] You need a Google Client ID and Secret. To get them:
  1. Go to [https://console.cloud.google.com](https://console.cloud.google.com)
  2. Create a new project (or select an existing one)
  3. Go to **APIs & Services → Credentials**
  4. Click **Create Credentials → OAuth 2.0 Client ID**
  5. Application type: **Web application**
  6. Name: `AI Multi-Studio`
  7. Under **Authorised redirect URIs**, add exactly:
     ```
     https://cloud.appwrite.io/v1/account/sessions/oauth2/callback/google/<YOUR_PROJECT_ID>
     ```
     Replace `<YOUR_PROJECT_ID>` with the Project ID from Step 1.
  8. Click **Create** — copy the **Client ID** and **Client Secret**
- [ ] Back in Appwrite Console, paste the **Client ID** and **Client Secret** into the Google provider form
- [ ] Click **Update**
- [ ] Scroll to **Allowed Callback URLs** (or **Platforms** — see Section 7) and confirm `http://localhost:3000` is present

> The redirect URL format is exactly: `https://cloud.appwrite.io/v1/account/sessions/oauth2/callback/google/YOUR_PROJECT_ID`. Do not add a trailing slash. The Project ID must match exactly.
---

## 5. Create Storage Bucket

- [ ] In the left sidebar, click **Storage**
- [ ] Click **Create Bucket**
- [ ] Name: `audio-uploads`
- [ ] Click **Create**
- [ ] Click on the new bucket to open its settings
- [ ] Under **Settings**, configure:

| Setting | Value | Reason |
|---|---|---|
| File Security | Enabled (private) | DEC-01 — no public file URLs; signed URLs generated server-side |
| Maximum File Size | `26214400` bytes (= 25 MB) | NFR-07 |
| Allowed File Extensions | `mp3, wav, m4a` | FR-INPUT-04 |

- [ ] Under **Permissions**, add **Users** role with **Create** and **Read** permissions only
  - Users need **Create** to upload files
  - Users need **Read** so the server SDK can generate signed URLs
  - Do NOT add **Delete** here — file deletion is handled server-side via the API key
- [ ] Click **Update**
- [ ] Copy the **Bucket ID** from the Settings tab
- [ ] Paste into `.env.local`:
  ```
  NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID=<paste here>
  ```

> "Private" means files are not accessible via a public URL. The server generates short-lived signed URLs (TTL 600s) via `storage.getFileDownload()` and passes them to AssemblyAI — the signed URL is never stored or returned to the client (DEC-01).

---

## 6. Create API Key

The API key gives your Next.js server-side code (API routes) elevated access to Appwrite without a user session.

- [ ] In the left sidebar, click **Overview**
- [ ] Scroll down to **API Keys** and click **Create API Key**
- [ ] Name: `multi-studio-server`
- [ ] Set expiry to **No Expiry** for development (set an expiry date when deploying to production)
- [ ] Under **Scopes**, enable **only** these scopes:

| Scope | Why |
|---|---|
| `databases.read` | Read documents (fetch project, output, profile) |
| `databases.write` | Create/update/delete documents |
| `storage.read` | Generate signed URLs for audio files |
| `storage.write` | Upload audio files server-side |
| `users.read` | Verify user session in API routes (DEC-05) |

- [ ] Click **Create**

> ⚠️ **The secret key is shown only once.** Copy it immediately before closing the dialog.

- [ ] Paste into `.env.local`:
  ```
  APPWRITE_API_KEY=<paste here>
  ```

> This key must **never** have the `NEXT_PUBLIC_` prefix. It is server-only and must never be included in the client bundle (NFR-02).

---

## 7. Configure Allowed Platforms

Appwrite rejects requests from origins not on its allowlist. You must register both your local dev URL and your Vercel URL.

- [ ] In the left sidebar, click **Overview**
- [ ] Scroll to **Platforms** and click **Add Platform**
- [ ] Select **Web App**
- [ ] Name: `localhost`
- [ ] Hostname: `localhost`
- [ ] Click **Create**

For production (do this after you have a Vercel URL):
- [ ] Click **Add Platform** again
- [ ] Select **Web App**
- [ ] Name: `Vercel Production`
- [ ] Hostname: `your-app.vercel.app` (replace with your actual Vercel subdomain — no `https://` prefix, no trailing slash)
- [ ] Click **Create**

> Without the platform entry, you will see CORS errors in the browser console and all Appwrite SDK calls will fail with a 401 or network error.

---

## 8. Final `.env.local` Checklist

Create a file named `.env.local` in the **project root** (same level as `package.json`). This file is already listed in `.gitignore` — never commit it.

```bash
# ============================================================
# APPWRITE — safe to expose in client bundle (NEXT_PUBLIC_)
# ============================================================

# The Appwrite Cloud API endpoint — never changes
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1

# From Step 1 — shown on project overview page
NEXT_PUBLIC_APPWRITE_PROJECT_ID=

# From Step 2 — shown on the database page
NEXT_PUBLIC_APPWRITE_DB_ID=

# From Step 3a — profiles collection Settings tab
NEXT_PUBLIC_APPWRITE_PROFILES_COLLECTION_ID=

# From Step 3b — projects collection Settings tab
NEXT_PUBLIC_APPWRITE_PROJECTS_COLLECTION_ID=

# From Step 3c — outputs collection Settings tab
NEXT_PUBLIC_APPWRITE_OUTPUTS_COLLECTION_ID=

# From Step 3d — schedules collection Settings tab
NEXT_PUBLIC_APPWRITE_SCHEDULES_COLLECTION_ID=

# From Step 5 — storage bucket Settings tab
NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID=

# ============================================================
# SERVER-ONLY — NEVER prefix with NEXT_PUBLIC_
# These must not appear in the browser bundle (NFR-02)
# ============================================================

# From Step 6 — shown once when API key is created
APPWRITE_API_KEY=

# From Google AI Studio — https://aistudio.google.com (free, no credit card)
GOOGLE_AI_API_KEY=

# From AssemblyAI Dashboard — https://www.assemblyai.com/dashboard
ASSEMBLYAI_API_KEY=
```

**Variable summary:**

| Variable | Source | Expose to client? |
|---|---|---|
| `NEXT_PUBLIC_APPWRITE_ENDPOINT` | Hardcoded value above | Yes — safe |
| `NEXT_PUBLIC_APPWRITE_PROJECT_ID` | Appwrite Console → Overview | Yes — safe |
| `NEXT_PUBLIC_APPWRITE_DB_ID` | Appwrite Console → Databases | Yes — safe |
| `NEXT_PUBLIC_APPWRITE_PROFILES_COLLECTION_ID` | Appwrite Console → Collection Settings | Yes — safe |
| `NEXT_PUBLIC_APPWRITE_PROJECTS_COLLECTION_ID` | Appwrite Console → Collection Settings | Yes — safe |
| `NEXT_PUBLIC_APPWRITE_OUTPUTS_COLLECTION_ID` | Appwrite Console → Collection Settings | Yes — safe |
| `NEXT_PUBLIC_APPWRITE_SCHEDULES_COLLECTION_ID` | Appwrite Console → Collection Settings | Yes — safe |
| `NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID` | Appwrite Console → Storage Settings | Yes — safe |
| `APPWRITE_API_KEY` | Appwrite Console → API Keys | **NO — server only** |
| `GOOGLE_AI_API_KEY` | Google AI Studio (aistudio.google.com) — free | **NO — server only** |
| `ASSEMBLYAI_API_KEY` | AssemblyAI Dashboard | **NO — server only** |

> `NEXT_PUBLIC_` variables are embedded into the JavaScript bundle at build time and are visible in the browser. This is acceptable for Appwrite project IDs and collection IDs — they are not secrets. The API keys (`APPWRITE_API_KEY`, `GOOGLE_AI_API_KEY`, `ASSEMBLYAI_API_KEY`) must never have this prefix.

---

## 9. Verification Tests

After completing all steps above, run these checks to confirm the setup is correct.

### 9.1 Console verification (no code required)

- [ ] Go to **Appwrite Console → Databases → multi-studio**
- [ ] Confirm all 4 collections are listed: `profiles`, `projects`, `outputs`, `schedules`
- [ ] Click each collection → **Attributes** tab → confirm all attributes are present with correct types
- [ ] Click each collection → **Indexes** tab → confirm all indexes are listed
- [ ] Go to **Storage** → confirm bucket `audio-uploads` exists with File Security enabled
- [ ] Go to **Auth → Settings** → confirm Google OAuth shows as enabled

### 9.2 Create a test user

- [ ] Go to **Auth → Users → Create User**
- [ ] Enter a test email and password
- [ ] Click **Create**
- [ ] The user appears in the Users list → setup is working

### 9.3 Create a test document

- [ ] Go to **Databases → multi-studio → profiles → Documents → Create Document**
- [ ] Set `userId` to the test user's ID (copy from Users list)
- [ ] Set `displayName` to `Test User`
- [ ] Set `brandVoice` to `energetic`
- [ ] Set `createdAt` to any datetime
- [ ] Click **Create**
- [ ] The document appears → database write is working

### 9.4 Upload a test file

- [ ] Go to **Storage → audio-uploads → Files → Upload File**
- [ ] Upload any small `.mp3` file
- [ ] The file appears in the list → storage bucket is working
- [ ] Click the file → confirm there is **no public URL** (File Security is on)
- [ ] Delete the test file after confirming

### 9.5 Verify API key via curl

Run this command in your terminal (replace the placeholder values with your actual IDs):

```bash
curl https://cloud.appwrite.io/v1/databases \
  -H "X-Appwrite-Project: YOUR_PROJECT_ID" \
  -H "X-Appwrite-Key: YOUR_API_KEY"
```

Expected response: a JSON object containing a `databases` array with your `multi-studio` database listed.

If you get `{"message":"Missing or invalid credentials"}`, the API key is wrong or the scopes are insufficient — return to Step 6 and verify the key and scopes.

### 9.6 Full local smoke test

- [ ] Run `npm install` in the project root
- [ ] Run `npm run dev`
- [ ] Open [http://localhost:3000](http://localhost:3000)
- [ ] Click **Sign Up** → register with email and password
- [ ] Confirm you are redirected to `/dashboard`
- [ ] Go to **Appwrite Console → Databases → multi-studio → profiles → Documents**
- [ ] Confirm a new document was created automatically (triggered by `getOrCreateProfile()` in `dashboard/layout.tsx` — DEC-04)
- [ ] Log out and confirm you are redirected to `/login`

If the profile document was created: the full auth + database write pipeline is working end to end.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| CORS error in browser console | Platform not registered | Add `localhost` in Overview → Platforms (Section 7) |
| `Missing or invalid credentials` on API calls | Wrong Project ID in env | Double-check `NEXT_PUBLIC_APPWRITE_PROJECT_ID` matches Console |
| Google OAuth redirects to wrong URL | Redirect URI mismatch | Verify the redirect URI in Google Cloud Console matches exactly: `https://cloud.appwrite.io/v1/account/sessions/oauth2/callback/google/YOUR_PROJECT_ID` |
| Profile document not created on first login | API key missing or wrong scope | Confirm `APPWRITE_API_KEY` is set and has `databases.write` scope |
| Audio upload returns 401 | Bucket permissions not set | Add Users → Create permission on the `audio-uploads` bucket |
| `Collection not found` error | Wrong collection ID in env | Re-copy each collection ID from its Settings tab in the Console |
| String attribute truncated | Size too small | Edit the attribute and set size to `100000` for `sourceContent`/`transcription`, `65535` for `content` |
