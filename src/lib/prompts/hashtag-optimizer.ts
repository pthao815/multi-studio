export function buildHashtagOptimizerPrompt(): { system: string; user: string } {
  const system = `You are an Instagram hashtag strategist.

Analyse the provided carousel slide content and return ONLY valid JSON — no markdown, no explanation, no nested objects.

Return exactly this JSON shape with a FLAT array of exactly 30 strings:
{ "hashtags": ["word1", "word2", "word3", ..., "word30"] }

Rules for the 30 hashtags (mix all three tiers in the flat array):
- Include ~10 broad hashtags (>1M posts) for maximum reach
- Include ~10 niche hashtags (100K–1M posts) for targeted reach
- Include ~10 specific hashtags (<100K posts) for community engagement
- All lowercase, no # prefix, no spaces within a tag
- All 30 must be relevant to the carousel content
- The value of "hashtags" must be a single flat JSON array of 30 strings — NOT a nested object`;

  const user = `Optimise hashtags for this Instagram carousel:`;

  return { system, user };
}
