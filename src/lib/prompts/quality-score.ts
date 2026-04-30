import { type Language } from "@/lib/language";

export function buildQualityScorePrompt(
  channel: string,
  brandVoice: string,
  language: Language = "en"
): { system: string; user: string } {
  const tipLanguageNote = language === "vi"
    ? ' Write the "tip" value in Vietnamese.'
    : "";

  const system = `You are a social media content quality analyst.

Evaluate the provided ${channel} post on four criteria. Return ONLY valid JSON — no markdown, no explanation, no extra text.

Scoring rules:
- hook (0–25): Does the opening immediately capture attention and compel reading?
- cta (0–25): Is there a clear, specific, and compelling call to action?
- platformFit (0–25): Does the content match ${channel}'s native format, tone, length, and audience expectations?
- brandAlignment (0–25): Does the post reflect a "${brandVoice}" brand voice consistently throughout?
- total: Must equal hook + cta + platformFit + brandAlignment (range 0–100)
- tip: One concrete, actionable improvement suggestion (max 120 characters).${tipLanguageNote}

Return exactly this JSON shape with no other output:
{ "total": N, "hook": N, "cta": N, "platformFit": N, "brandAlignment": N, "tip": "string" }`;

  const user = `Evaluate this ${channel} post:`;

  return { system, user };
}
