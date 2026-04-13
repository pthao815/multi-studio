import { GoogleGenerativeAI } from "@google/generative-ai";
import type { BrandVoice } from "@/types";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

export const MAX_SOURCE_CONTENT_LENGTH = 12000;

const DEFAULT_TEMPERATURE = 0.7;
const INSTAGRAM_TEMPERATURE = 0.4;
const MAX_OUTPUT_TOKENS = 1500;

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
];

export class AIEmptyResponseError extends Error {
  constructor() {
    super("AI returned an empty response");
    this.name = "AIEmptyResponseError";
  }
}

export class AIRefusalError extends Error {
  constructor(response: string) {
    super(`AI refused the request: ${response.slice(0, 100)}`);
    this.name = "AIRefusalError";
  }
}

export function buildBrandVoicePrompt(
  brandVoice: BrandVoice | null | undefined,
  brandKeywords: string[]
): string {
  const toneMap: Record<string, string> = {
    energetic:
      "Write with an energetic, high-energy tone: use short punchy sentences, active verbs, and enthusiastic language that excites and motivates the reader; convey momentum and a sense of possibility in every line.",
    educational:
      "Write with an educational, informative tone: prioritise clarity, logical structure, and accessible explanation; teach the reader something useful without being condescending, and back up key points with concrete examples or analogies.",
    funny:
      "Write with a funny, lighthearted tone: use wit, wordplay, and relatable humour where it fits naturally; keep the comedy clever rather than forced — the humour should emerge from the content, not be inserted as standalone jokes.",
    calm: "Write with a calm, measured tone: use gentle pacing, reassuring language, and a composed voice that puts the reader at ease; avoid urgency, hype, or exclamation-heavy sentences.",
  };

  const tone = (brandVoice && toneMap[brandVoice]) ?? toneMap.calm;

  if (brandKeywords.length === 0) {
    return tone;
  }

  const keywordsList = brandKeywords.join(", ");
  return `${tone}\nNaturally weave the following keywords into the content where relevant, without forcing them: ${keywordsList}.`;
}

export async function generateContent(
  systemPrompt: string,
  userContent: string,
  options?: { jsonMode?: boolean }
): Promise<string> {
  if (!userContent.trim()) {
    throw new TypeError("sourceContent must not be empty");
  }

  const generationConfig = {
    temperature: options?.jsonMode ? INSTAGRAM_TEMPERATURE : DEFAULT_TEMPERATURE,
    maxOutputTokens: MAX_OUTPUT_TOKENS,
    ...(options?.jsonMode && { responseMimeType: "application/json" }),
  };

  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: systemPrompt,
    generationConfig,
  });

  const result = await model.generateContent(userContent);
  const text = result.response.text();

  if (!text || text.trim() === "") {
    throw new AIEmptyResponseError();
  }

  const trimmedLower = text.trim().toLowerCase();
  for (const prefix of REFUSAL_PREFIXES) {
    if (trimmedLower.startsWith(prefix)) {
      throw new AIRefusalError(text);
    }
  }

  return text;
}

export function streamContent(
  systemPrompt: string,
  userContent: string
): ReadableStream {
  if (!userContent.trim()) {
    throw new TypeError("sourceContent must not be empty");
  }

  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: systemPrompt,
    generationConfig: {
      temperature: DEFAULT_TEMPERATURE,
      maxOutputTokens: MAX_OUTPUT_TOKENS,
    },
  });

  return new ReadableStream({
    async start(controller) {
      try {
        const result = await model.generateContentStream(userContent);
        for await (const chunk of result.stream) {
          const chunkText = chunk.text();
          if (chunkText) {
            controller.enqueue(new TextEncoder().encode(chunkText));
          }
        }
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });
}
