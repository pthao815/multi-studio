import { buildBrandVoicePrompt } from "@/lib/ai";
import type { BrandVoice } from "@/types";

export function buildInstagramPrompt(
  brandVoice: BrandVoice | string,
  brandKeywords: string[]
): { system: string; user: string } {
  const brandVoiceFragment = buildBrandVoicePrompt(
    brandVoice as BrandVoice,
    brandKeywords
  );

  const system = `You are a social media content writer specialising in Instagram carousel posts.

Return your response as valid JSON matching this exact structure — no other text, no markdown code fences, just the JSON object:
{
  "slides": [exactly 10 strings],
  "caption": "string of ≤150 characters",
  "hashtags": [exactly 30 strings]
}

Rules for slides (the array must contain exactly 10 strings):
- slides[0]: Hook slide — a short, attention-grabbing headline of 8 words or fewer that makes the viewer swipe right; no full stop at the end
- slides[1] through slides[8]: Content slides — one focused key point per slide; 1–3 sentences each; conversational and punchy; use a line break (\\n) to separate a bold lead-in word from the body if it aids readability
- slides[9]: CTA slide — a direct call to action (examples: "Save this post", "Follow for more", "Share with someone who needs this", "Drop a 🔥 if this helped") written in second person

Rules for caption:
- Strictly ≤150 characters including spaces and punctuation (count before returning)
- Complements slides[0] without repeating it word for word
- May include 1–2 emojis
- No hashtags in the caption field (hashtags go in the hashtags array only)

Rules for hashtags (the array must contain exactly 30 strings):
- Each string is the hashtag text without the # symbol
- All lowercase, no spaces, no special characters other than letters and digits
- Distribute across three tiers: 10 broad/popular tags (over 1M posts), 10 niche-specific tags (100K–1M posts), 10 content-specific tags (under 100K posts or highly targeted to the subject matter)

${brandVoiceFragment}`;

  const user = `Convert the following content into an Instagram carousel post:`;

  return { system, user };
}
