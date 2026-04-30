export const maxDuration = 60;

import { NextRequest, NextResponse } from "next/server";
import { Client, Account, Query } from "node-appwrite";
import { serverDatabases } from "@/lib/appwrite-server";
import { generateContent } from "@/lib/ai";
import { buildQualityScorePrompt } from "@/lib/prompts/quality-score";
import { detectLanguage } from "@/lib/language";
import type { Output, Profile } from "@/types";

const DB_ID = process.env.NEXT_PUBLIC_APPWRITE_DB_ID!;
const OUTPUTS_COL = process.env.NEXT_PUBLIC_APPWRITE_OUTPUTS_COLLECTION_ID!;
const PROFILES_COL = process.env.NEXT_PUBLIC_APPWRITE_PROFILES_COLLECTION_ID!;

function getSessionClient(jwt: string) {
  return new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
    .setJWT(jwt);
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const jwt = request.cookies.get("appwrite-jwt")?.value;
  if (!jwt) {
    return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 403 });
  }

  let userId: string;
  try {
    const account = new Account(getSessionClient(jwt));
    const user = await account.get();
    userId = user.$id;
  } catch {
    return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 403 });
  }

  const outputId = params.id;

  let output: Output;
  try {
    output = await serverDatabases.getDocument(
      DB_ID,
      OUTPUTS_COL,
      outputId
    ) as unknown as Output;
  } catch {
    return NextResponse.json({ error: "Output not found", code: "NOT_FOUND" }, { status: 404 });
  }

  if (output.userId !== userId) {
    return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 403 });
  }

  // Fetch brand voice from profile
  let brandVoice = "calm";
  try {
    const profilesResult = await serverDatabases.listDocuments(DB_ID, PROFILES_COL, [
      Query.equal("userId", userId),
    ]);
    if (profilesResult.documents.length > 0) {
      const profile = profilesResult.documents[0] as unknown as Profile;
      const bv = profile.brandVoice as unknown;
      brandVoice = (Array.isArray(bv) ? bv[0] : bv) ?? "calm";
    }
  } catch {
    // Fall through with calm default
  }

  const language = detectLanguage(output.content);
  const prompt = buildQualityScorePrompt(output.channel, brandVoice, language);

  let qualityScore: string;
  try {
    const raw = await generateContent(
      prompt.system,
      prompt.user + "\n\n" + output.content,
      { jsonMode: true, fast: true }
    );

    const parsed = JSON.parse(raw) as {
      total: number;
      hook: number;
      cta: number;
      platformFit: number;
      brandAlignment: number;
      tip: string;
    };

    if (
      typeof parsed.hook !== "number" ||
      typeof parsed.cta !== "number" ||
      typeof parsed.platformFit !== "number" ||
      typeof parsed.brandAlignment !== "number"
    ) {
      return NextResponse.json({ error: "Invalid score format", code: "SCORE_FAILED" }, { status: 500 });
    }

    // Enforce total === sum of sub-scores (DEC-21)
    parsed.total = parsed.hook + parsed.cta + parsed.platformFit + parsed.brandAlignment;
    qualityScore = JSON.stringify(parsed);
  } catch {
    return NextResponse.json({ error: "Score generation failed", code: "SCORE_FAILED" }, { status: 500 });
  }

  try {
    await serverDatabases.updateDocument(DB_ID, OUTPUTS_COL, outputId, { qualityScore });
  } catch {
    return NextResponse.json({ error: "Failed to save score", code: "SCORE_FAILED" }, { status: 500 });
  }

  return NextResponse.json({ qualityScore });
}
