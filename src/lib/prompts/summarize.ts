export function buildSummarizePrompt(): { system: string; user: string } {
  const system = `Summarise the following article or transcript for social media content creation.

Preserve: key arguments, statistics, quotes, main thesis, any call to action.
Remove: filler, repetition, boilerplate, metadata, timestamps, speaker labels.
Target length: 2,500–3,000 characters.
Output plain text only — no headings, no bullet points, no markdown.`;

  const user = `Summarise the following content:`;

  return { system, user };
}
