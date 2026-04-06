# AI Multi-Studio — AI Layer Implementation Contracts

> This file documents **only** the four implementation contracts a developer needs
> to write actual prompt content. Architectural decisions (two-function split,
> Promise.all parallelism, streaming pattern, model parameters, truncation constant,
> error class names) are already specified in docs/DECISIONS.md (DEC-09, DEC-11,
> DEC-14 through DEC-18). Module responsibilities are in docs/MODULE_STRUCTURE.md.
> Do not add content here that duplicates those documents.

---

## 1. AI Layer Overview

The Google Gemini API (`gemini-2.0-flash`) serves as a **content transformation engine**.
Users supply one plain-text source — scraped from a URL, typed directly, or
transcribed from audio — and the system reformats that source into platform-native
social media posts for three channels simultaneously. Every Claude call is
single-turn and stateless: one source text and one set of formatting instructions
go in; one formatted post comes out. Per-channel regeneration uses a streaming
variant of the same pattern, delivering output to the browser progressively while
writing the completed result to the database in one step after the stream closes.
Instagram output is requested in JSON mode to guarantee a structured three-field
response. Brand voice (tone and keywords) is injected into the system role of
every call through a shared helper function, forming a reusable skill layer that
ensures consistent tone across all channels and regenerations.

The AI layer does **not** maintain conversation history between calls, use tool
calls or function calling, retrieve information from an external knowledge base
(no RAG), operate as an autonomous agent that decides next steps in a loop, publish
content to any social media platform, generate images (only text prompts for images),
or validate the factual accuracy of generated content. All Claude calls are
server-side only; no credentials, prompts, or raw responses are ever sent to the
browser.

---

## 2. Prompt Templates

All six prompt builders return `{ system: string, user: string }`. The `system`
role contains static formatting rules plus the output of `buildBrandVoicePrompt()`
inserted at `{{BRAND_VOICE_FRAGMENT}}`. The `user` role contains a one-line task
instruction followed by the (already-truncated) source content at
`{{SOURCE_CONTENT}}`. See DEC-14 for the structural rationale and DEC-15 for
truncation.

---

### facebook.ts

**system role:**
```
You are a social media content writer specialising in Facebook posts.

Write a Facebook post based on the content provided. Follow these rules exactly:
- Length: 400–600 words (strictly enforced — count before returning)
- Structure: 3–5 paragraphs; do not use bullet points or numbered lists
- Opening: Begin with a storytelling hook — a single compelling sentence that
  draws the reader in emotionally or through curiosity; do not start with the
  subject's name or a generic greeting
- Emojis: Use 3–8 emojis distributed naturally throughout the post; do not
  cluster them at the end
- Closing: End with a clear call to action that invites the reader to comment,
  share, click a link, or take one specific next step
- Do not include hashtags
- Do not include a title, heading, or subject line
- Output plain text only — no markdown formatting

{{BRAND_VOICE_FRAGMENT}}
```

**user role:**
```
Convert the following content into a Facebook post:

{{SOURCE_CONTENT}}
```

**Output contract:**
- Format: Plain text
- Length: 400–600 words
- Required elements: storytelling hook (opening sentence), 3–8 emojis,
  CTA (final sentence)
- Forbidden: hashtags, title/heading, markdown, bullet points

---

### tiktok.ts

**system role:**
```
You are a TikTok script writer specialising in short-form video content.

Write a TikTok video script based on the content provided. Follow these rules exactly:
- Hook: The very first line of the script must be a 3-second hook — one single
  punchy sentence (10 words or fewer) that stops scrolling; do not add a label
  to this line
- Scenes: Structure the body of the script using scene labels on their own line,
  formatted exactly as: [Scene 1], [Scene 2], [Scene 3], etc.
- Scene length: Each scene is 1–3 sentences of spoken dialogue or narration
- Total length: The full script (excluding the sound suggestion) must be
  speakable in approximately 60 seconds — target 130–160 words
- Sound: End with a standalone line formatted exactly as:
  "Trending sound suggestion: [sound name or genre that fits the content mood]"
- Do not include hashtags anywhere in the script
- Do not add any labels, headings, or metadata other than the [Scene X] markers
  and the sound suggestion line
- Output plain text only

{{BRAND_VOICE_FRAGMENT}}
```

**user role:**
```
Convert the following content into a TikTok video script:

{{SOURCE_CONTENT}}
```

**Output contract:**
- Format: Plain text
- Length: 130–160 words (body only, excluding sound suggestion line)
- Required elements: 3-second hook (unlabelled first line), `[Scene X]` labels,
  `Trending sound suggestion: [...]` as final line
- Forbidden: hashtags, any label other than `[Scene X]` and the sound line,
  markdown

---


### instagram.ts

> ⚠️ **This section supersedes DEC-06.** DEC-06, TASK-18 (old version), and
> DATABASE_DESIGN.md Section 7 previously described the stored format as a plain
> "JSON array of 10 strings." That description was incomplete. The object structure
> below is the correct implementation. All other references have been updated to
> match.

The full Instagram spec (docs/REQUIREMENTS.md Section 4.4) requires 10 slides,
a caption ≤150 characters, and 30 hashtags. The stored `outputs.content` field
holds the complete JSON object below. `InstagramPreview.tsx` reads all three
fields via `JSON.parse(output.content)` and accesses `parsed.slides`,
`parsed.caption`, `parsed.hashtags`.

This call is made with `responseMimeType: "application/json"` and
`temperature: 0.4` per DEC-16 and DEC-18.

**system role:**
```
You are a social media content writer specialising in Instagram carousel posts.

Return your response as valid JSON matching this exact structure — no other text,
no markdown code fences, just the JSON object:
{
  "slides": [exactly 10 strings],
  "caption": "string of ≤150 characters",
  "hashtags": [exactly 30 strings]
}

Rules for slides (the array must contain exactly 10 strings):
- slides[0]: Hook slide — a short, attention-grabbing headline of 8 words or
  fewer that makes the viewer swipe right; no full stop at the end
- slides[1] through slides[8]: Content slides — one focused key point per slide;
  1–3 sentences each; conversational and punchy; use a line break (\n) to
  separate a bold lead-in word from the body if it aids readability
- slides[9]: CTA slide — a direct call to action (examples: "Save this post",
  "Follow for more", "Share with someone who needs this", "Drop a 🔥 if this
  helped") written in second person

Rules for caption:
- Strictly ≤150 characters including spaces and punctuation (count before returning)
- Complements slides[0] without repeating it word for word
- May include 1–2 emojis
- No hashtags in the caption field (hashtags go in the hashtags array only)

Rules for hashtags (the array must contain exactly 30 strings):
- Each string is the hashtag text without the # symbol
- All lowercase, no spaces, no special characters other than letters and digits
- Distribute across three tiers: 10 broad/popular tags (over 1M posts),
  10 niche-specific tags (100K–1M posts), 10 content-specific tags (under 100K
  posts or highly targeted to the subject matter)

{{BRAND_VOICE_FRAGMENT}}
```

**user role:**
```
Convert the following content into an Instagram carousel post:

{{SOURCE_CONTENT}}
```

**Output contract:**
- Format: JSON object with three keys: `slides` (array of exactly 10 strings),
  `caption` (string ≤150 characters), `hashtags` (array of exactly 30 strings)
- Stored in `outputs.content` as a raw JSON string
- `InstagramPreview.tsx` calls `JSON.parse(content)` and accesses all three fields
- Array length guard: `slides.length === 10` and `hashtags.length === 30` are
  checked by the route handler after parsing (DEC-18)
- Required elements: hook slide (index 0), 8 content slides (indices 1–8),
  CTA slide (index 9), caption ≤150 chars, exactly 30 hashtags

---

### linkedin.ts

**system role:**
```
You are a professional content writer specialising in LinkedIn articles.

Write a LinkedIn article based on the content provided. Follow these rules exactly:
- Length: 250–400 words
- Opening: Begin with a bold opening statement, a thought-provoking question,
  or a counterintuitive claim (1–2 sentences) that establishes your point of
  view immediately
- Body: 3–5 paragraphs of 2–4 sentences each; each paragraph makes one clear
  point; use plain paragraph form — avoid bullet points or numbered lists unless
  the content is genuinely enumerable (e.g. a step-by-step process)
- Closing: End with a key takeaway, a forward-looking statement, or a question
  that invites comments
- Tone: Professional, authoritative, and insightful — write as a subject-matter
  expert sharing hard-won knowledge with peers, not as a marketer
- Do not include hashtags
- Do not include a title or heading
- Output plain text only — no markdown formatting

{{BRAND_VOICE_FRAGMENT}}
```

**user role:**
```
Convert the following content into a LinkedIn article:

{{SOURCE_CONTENT}}
```

**Output contract:**
- Format: Plain text
- Length: 250–400 words
- Required elements: bold opening statement or question, 3–5 body paragraphs,
  closing takeaway or question
- Forbidden: hashtags, title/heading, markdown, bullet points (unless content
  is genuinely list-based)

---

### twitter.ts

**system role:**
```
You are a social media content writer specialising in Twitter/X threads.

Write a Twitter/X thread based on the content provided. Follow these rules exactly:
- Format: Number each tweet on its own line as 1/, 2/, 3/, etc., followed
  immediately (no blank line) by the tweet text
- Tweet length: Each tweet must be 280 characters or fewer — count carefully
  and trim if needed; the numbering (e.g. "1/ ") counts toward the limit
- Thread length: 5–8 tweets total
- First tweet (1/): Hook — a bold claim, a surprising statistic, or a direct
  value statement that makes the reader want to read the thread
- Middle tweets: One focused, self-contained point per tweet; conversational
  and direct; use plain language over jargon
- Final tweet: A thread-closing CTA — invite the reader to retweet, follow,
  reply, or save; may include 1–2 emojis
- Do not place hashtags inside individual tweets (they consume character budget)
- Do not add any introductory text before "1/" or any closing text after the
  final tweet
- Output plain text only

{{BRAND_VOICE_FRAGMENT}}
```

**user role:**
```
Convert the following content into a Twitter/X thread:

{{SOURCE_CONTENT}}
```

**Output contract:**
- Format: Plain text, numbered `N/` format
- Length: 5–8 tweets; each tweet ≤280 characters including the `N/ ` prefix
- Required elements: hook tweet (1/), one-point-per-tweet body, CTA final tweet
- Forbidden: inline hashtags, introductory/closing text outside the numbered
  tweets, markdown

---

### image-prompt.ts

> Unlike the five channel prompt files, this builder receives **existing post
> content** (`{{POST_CONTENT}}`) as its user input — not the original source
> text. The result is saved to `outputs.imagePrompt`, a separate field from
> `outputs.content`. See DEC-12.

`buildBrandVoicePrompt()` is **not** called in this prompt. Brand voice is
already embedded in the post content that serves as input; adding a tone
instruction here would conflict with the visual description task.

**system role:**
```
You are an art director specialising in creating prompts for AI image generation
tools (such as Midjourney, DALL-E, or Stable Diffusion).

Write a single image prompt based on the social media post provided. Follow
these rules exactly:
- Length: 40–80 words — one continuous paragraph, no bullet points, no line breaks
- Required elements (include all four in every prompt):
    1. Subject: The main visual subject, scene, or concept (a person, object,
       setting, or abstract representation of the post's theme)
    2. Style: One term from the allowed style vocabulary below
    3. Mood and lighting: Emotional tone (e.g. warm and optimistic, tense and
       dramatic) and lighting conditions (e.g. golden hour sunlight, soft studio
       lighting, neon-lit night)
    4. Composition: Camera angle or framing (e.g. close-up portrait, wide
       establishing shot, overhead flat lay, rule-of-thirds framing)
- Do not describe any text, captions, speech bubbles, or overlays
- Do not name the social media platform in the prompt
- Do not use the phrases "create", "generate", "an image of", or "a picture of"
  — begin the prompt directly with the subject or scene description
- Do not include aspect ratio instructions or technical render parameters

Allowed style vocabulary (use exactly one of these terms per prompt):
cinematic photography, editorial photography, flat lay photography,
lifestyle photography, documentary photography, portrait photography,
digital illustration, vector illustration, watercolour illustration,
bold graphic design, minimalist design, vintage poster style,
vibrant street photography, product photography
```

**user role:**
```
Generate a visual image prompt for the following social media post:

{{POST_CONTENT}}
```

**Output contract:**
- Format: Plain text, single paragraph
- Length: 40–80 words
- Required elements: subject, one style term from allowed vocabulary, mood and
  lighting, composition
- Forbidden: text/caption descriptions, platform names, "create"/"generate"/
  "image of" phrasing, render parameters, bullet points

---

## 3. buildBrandVoicePrompt() Contract


This function is exported from `src/lib/ai.ts` and called at the end of
every channel prompt builder's system role construction (except `image-prompt.ts`).
It returns a string fragment that is appended to the system role template at
`{{BRAND_VOICE_FRAGMENT}}`.

### Function signature
```typescript
function buildBrandVoicePrompt(
  brandVoice: BrandVoice | null | undefined,
  brandKeywords: string[]
): string
```

### Output format

The returned fragment always consists of two parts:

1. A **tone instruction sentence** that specifies how to write.
2. A **keywords sentence** that specifies which words to weave in — present only
   when `brandKeywords` is a non-empty array.

The fragment is a standalone block of 1–2 sentences with no surrounding
whitespace (the caller appends it to the system prompt string with a preceding
newline).

### One example per tone value

**energetic:**
```
Write with an energetic, high-energy tone: use short punchy sentences, active
verbs, and enthusiastic language that excites and motivates the reader; convey
momentum and a sense of possibility in every line.
```
*(with keywords: append sentence below)*
```
Naturally weave the following keywords into the content where relevant, without
forcing them: {{KEYWORDS_LIST}}.
```

**educational:**
```
Write with an educational, informative tone: prioritise clarity, logical
structure, and accessible explanation; teach the reader something useful without
being condescending, and back up key points with concrete examples or analogies.
```

**funny:**
```
Write with a funny, lighthearted tone: use wit, wordplay, and relatable humour
where it fits naturally; keep the comedy clever rather than forced — the humour
should emerge from the content, not be inserted as standalone jokes.
```

**calm:**
```
Write with a calm, measured tone: use gentle pacing, reassuring language, and a
composed voice that puts the reader at ease; avoid urgency, hype, or
exclamation-heavy sentences.
```

### Keywords sentence format (when brandKeywords is non-empty)

The keywords sentence is always the same structure regardless of tone:

```
Naturally weave the following keywords into the content where relevant, without
forcing them: [keyword1, keyword2, keyword3].
```

Keywords are joined with `, ` and the list is terminated with `.`. The brackets
shown above are not literal — the output is inline prose:

```
// brandKeywords = ["productivity", "deep work", "focus"]
// Result sentence:
"Naturally weave the following keywords into the content where relevant, without forcing them: productivity, deep work, focus."
```

### Edge cases

| Input state | Behavior |
|---|---|
| `brandKeywords` is `[]` (empty array) | Keywords sentence is **omitted entirely**. The function returns only the tone instruction sentence. No trailing space or punctuation gap. |
| `brandKeywords` has 1–10 items | All items included, comma-separated, in the keywords sentence. Order is preserved as stored in the `profiles` document. |
| `brandKeywords` contains special characters (e.g. `"AI/ML"`, `"C++"`) | Characters are included as-is. No escaping. The prompt treats them as plain text. |
| `brandVoice` is `null` or `undefined` (profile not yet saved) | Function defaults to the `calm` tone instruction. Does not throw. |
| `brandVoice` is a value not in the enum (data corruption) | Function defaults to the `calm` tone instruction. Does not throw. |

---

## 4. ClaudeRefusalError — Complete Prefix List

`AIRefusalError` is thrown by `generateContent()` in `src/lib/ai.ts`
when the returned string begins with any of the prefixes below, indicating
Claude declined to complete the request rather than generating usable content.

### Check behaviour

- **Trimmed first:** `response.trim()` is applied before the prefix check.
  Leading whitespace or a leading newline in the response does not cause a
  missed detection.
- **Case-insensitive:** All checks use `.toLowerCase()` on the trimmed response.
  The prefix list below is therefore shown in lowercase.
- **Prefix match only:** The check is `trimmedLower.startsWith(prefix)` — it
  matches the beginning of the response, not a substring anywhere in the body.
  This prevents false positives from content that quotes or discusses refusal
  language.

### Complete prefix list

```typescript
const REFUSAL_PREFIXES: string[] = [
  // Apology forms
  "i'm sorry",
  "i am sorry",
  "i apologize",
  "i apologise",
  "my apologies",

  // Inability forms
  "i'm unable",
  "i am unable",
  "i'm not able",
  "i am not able",
  "i can't",
  "i cannot",
  "i'm afraid i can't",
  "i'm afraid i cannot",

  // Willingness forms
  "i won't",
  "i will not",
  "i'm not going to",
  "i am not going to",

  // Judgment / concern forms
  "i don't think i can",
  "i do not think i can",
  "i don't feel comfortable",
  "i do not feel comfortable",
  "i have concerns about",
  "i must decline",
  "i need to decline",
  "i'd rather not",
  "i would rather not",

  // Policy / framing forms
  "as an ai",
  "as a language model",
  "as an artificial intelligence",
  "this request",
  "that request",
  "this type of content",
  "this kind of content",
  "unfortunately, i",
  "unfortunately i",
  "i'm designed to",
  "i am designed to",
]
```

### Implementation note

The prefix list is defined as a named constant in `src/lib/ai.ts` so it can
be extended in one place. When adding a new prefix, add it in lowercase — the
runtime comparison uses `.toLowerCase()` on both sides.

---

## 5. Image Prompt Output Specification

This section defines what a valid value for the `outputs.imagePrompt` field
must contain. The field is populated by `POST /api/outputs/[id]/image-prompt`
and displayed by `ImagePromptButton.tsx`.

### Specification

| Property | Requirement |
|---|---|
| Format | Single paragraph, plain text |
| Length | 40–80 words (not enforced programmatically — enforced by the system prompt instruction) |
| Subject | Required — a concrete visual subject or scene; may be literal or conceptual |
| Style | Required — exactly one term from the allowed style vocabulary |
| Mood and lighting | Required — emotional tone + lighting conditions in one phrase |
| Composition | Required — camera angle, framing, or layout reference |
| Prohibited content | Text overlays, captions, speech bubbles, platform names, render parameters, aspect ratios |

### Allowed style vocabulary

```
cinematic photography        editorial photography
flat lay photography         lifestyle photography
documentary photography      portrait photography
digital illustration         vector illustration
watercolour illustration     bold graphic design
minimalist design            vintage poster style
vibrant street photography   product photography
```

### Example — Facebook post about productivity

```
A person sitting at a clean wooden desk in a sunlit home office, surrounded by
a single open notebook and a cup of coffee, cinematic photography, warm golden
morning light streaming through a large window casting soft shadows, medium
shot framed slightly off-centre to create breathing room on the right side.
```
*(62 words — subject: person at desk; style: cinematic photography; mood and
lighting: warm golden morning light; composition: medium shot, off-centre)*

### Example — TikTok script about cooking

```
Hands confidently slicing fresh vegetables on a marble countertop with vibrant
colours — red tomatoes, green herbs, golden onions — lifestyle photography,
bright even studio lighting with a slight warm tint that makes the food look
appetising, overhead flat-lay perspective looking directly down at the cutting
board from above.
```
*(52 words — subject: hands slicing vegetables; style: lifestyle photography;
mood and lighting: bright warm studio light; composition: overhead flat-lay)*

---

## 6. Empty State Handling

Defines what each prompt function and `ai.ts` must do when inputs are
absent, empty, or edge-case. These are the expected runtime contract — not
error recovery strategies (those are covered by DEC-17 for Claude's response;
DEC-15 for content length).

| Scenario | Behavior |
|---|---|
| `sourceContent` is an empty string | `generateContent()` and `streamContent()` throw a `TypeError` with message `"sourceContent must not be empty"` **before** making any Claude API call. The route handler catches this and maps it to `GENERATION_FAILED` / `REGENERATION_FAILED`. No API credit is consumed. |
| `sourceContent` is truncated by DEC-15 (>12,000 chars) | The truncated string with `…[content truncated]` suffix is passed to the prompt builder as-is. The prompt builder does not know or check whether truncation occurred. No special instruction is added to the prompt. Claude generates from the truncated content. |
| `brandVoice` is not set (null / undefined) | `buildBrandVoicePrompt()` uses the `calm` fallback tone. Generation proceeds normally. No error is thrown and no warning is logged. |
| `brandKeywords` is `[]` | `buildBrandVoicePrompt()` returns the tone instruction sentence only. The keywords sentence is omitted entirely. The `{{BRAND_VOICE_FRAGMENT}}` placeholder is replaced with a single-sentence fragment. |
| `brandKeywords` contains strings with special characters | Keywords are interpolated as-is into the keywords sentence. No HTML encoding, no escaping. The string `"AI/ML"` appears in the prompt as `AI/ML`. |
| `POST_CONTENT` (image-prompt input) is an empty string | `generateContent()` throws `TypeError("sourceContent must not be empty")` via the same guard. The `POST /api/outputs/[id]/image-prompt` route catches this and returns `IMAGE_PROMPT_FAILED`. |
