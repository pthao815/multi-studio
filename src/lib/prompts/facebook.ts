import { buildBrandVoicePrompt } from "@/lib/ai";
import type { BrandVoice } from "@/types";
import { languageInstruction, type Language } from "@/lib/language";

export function buildFacebookPrompt(
  brandVoice: BrandVoice | string,
  brandKeywords: string[],
  language: Language = "en"
): { system: string; user: string } {
  const brandVoiceFragment = buildBrandVoicePrompt(
    brandVoice as BrandVoice,
    brandKeywords
  );

  const system = `You are a social media content writer specialising in Facebook posts.

Write a Facebook post based on the content provided. Follow these rules exactly:
- Length: 400–600 words (strictly enforced — count before returning)
- Structure: 3–5 paragraphs; do not use bullet points or numbered lists
- Opening: Begin with a storytelling hook — a single compelling sentence that draws the reader in emotionally or through curiosity; do not start with the subject's name or a generic greeting
- Emojis: Use 3–8 emojis distributed naturally throughout the post; do not cluster them at the end
- Closing: End with a clear call to action that invites the reader to comment, share, click a link, or take one specific next step
- Do not include hashtags
- Do not include a title, heading, or subject line
- Output plain text only — no markdown formatting

${brandVoiceFragment}${languageInstruction(language)}`;

  const user = `Convert the following content into a Facebook post:`;

  return { system, user };
}
