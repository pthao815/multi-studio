import { config } from "dotenv";
config({ path: ".env.local" });

async function main() {
  const { generateContent } = await import("./src/lib/ai");
  const { buildFacebookPrompt } = await import("./src/lib/prompts/facebook");

  const prompt = buildFacebookPrompt("energetic", []);
  const result = await generateContent(
    prompt.system,
    prompt.user + "\n\nTest content about AI"
  );
  console.log(result);
}

main().catch(console.error);
