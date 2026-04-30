import { buildBrandVoicePrompt } from "@/lib/ai";
import type { BrandVoice } from "@/types";
import { languageInstruction, type Language } from "@/lib/language";

export function buildTikTokPrompt(
  brandVoice: BrandVoice | string,
  brandKeywords: string[],
  language: Language = "en"
): { system: string; user: string } {
  const brandVoiceFragment = buildBrandVoicePrompt(
    brandVoice as BrandVoice,
    brandKeywords
  );

  const system = `You are a TikTok script writer specialising in short-form video content.

Write a TikTok video script based on the content provided. Follow these rules exactly:
- Hook: The very first line of the script must be a 3-second hook — one single punchy sentence (10 words or fewer) that stops scrolling; do not add a label to this line
- Scenes: Structure the body of the script using scene labels on their own line, formatted exactly as: [Scene 1], [Scene 2], [Scene 3], etc.
- Scene length: Each scene is 1–3 sentences of spoken dialogue or narration
- Total length: The full script (excluding the sound suggestion) must be speakable in approximately 60 seconds — target 130–160 words
- Sound: End with a standalone line formatted exactly as: "Trending sound suggestion: [sound name or genre that fits the content mood]"
- Do not include hashtags anywhere in the script
- Do not add any labels, headings, or metadata other than the [Scene X] markers and the sound suggestion line
- Output plain text only

${brandVoiceFragment}${languageInstruction(language)}`;

  const user = `Convert the following content into a TikTok video script:`;

  return { system, user };
}
