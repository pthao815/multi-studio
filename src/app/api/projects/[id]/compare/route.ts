export const maxDuration = 60;

import { NextRequest, NextResponse } from "next/server";
import { Client, Account, Query } from "node-appwrite";
import { serverDatabases } from "@/lib/appwrite-server";
import { generateContent, MAX_SOURCE_CONTENT_LENGTH } from "@/lib/ai";
import { buildFacebookPrompt } from "@/lib/prompts/facebook";
import { buildTikTokPrompt } from "@/lib/prompts/tiktok";
import { buildInstagramPrompt } from "@/lib/prompts/instagram";
import { buildLinkedInPrompt } from "@/lib/prompts/linkedin";
import { buildTwitterPrompt } from "@/lib/prompts/twitter";
import type { Project, Output, Profile, BrandVoice, ChannelType } from "@/types";

const DB_ID = process.env.NEXT_PUBLIC_APPWRITE_DB_ID!;
const PROJECTS_COL = process.env.NEXT_PUBLIC_APPWRITE_PROJECTS_COLLECTION_ID!;
const OUTPUTS_COL = process.env.NEXT_PUBLIC_APPWRITE_OUTPUTS_COLLECTION_ID!;
const PROFILES_COL = process.env.NEXT_PUBLIC_APPWRITE_PROFILES_COLLECTION_ID!;

function getSessionClient(jwt: string) {
  return new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
    .setJWT(jwt);
}

function buildChannelPrompt(
  channel: ChannelType,
  toneA: BrandVoice,
  keywords: string[]
): { system: string; user: string } | string {
  switch (channel) {
    case "facebook": return buildFacebookPrompt(toneA, keywords);
    case "tiktok": return buildTikTokPrompt(toneA, keywords);
    case "instagram": return buildInstagramPrompt(toneA, keywords);
    case "linkedin": return buildLinkedInPrompt(toneA, keywords);
    case "twitter": return buildTwitterPrompt(toneA, keywords);
  }
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

  const projectId = params.id;
  const { outputId, toneA, toneB } = await request.json() as {
    outputId: string;
    toneA: BrandVoice;
    toneB: BrandVoice;
  };

  // Verify project ownership (DEC-05)
  let project: Project;
  try {
    project = await serverDatabases.getDocument(DB_ID, PROJECTS_COL, projectId) as unknown as Project;
  } catch {
    return NextResponse.json({ error: "Project not found", code: "NOT_FOUND" }, { status: 404 });
  }

  if (project.userId !== userId) {
    return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 403 });
  }

  // Verify output ownership (DEC-05)
  let output: Output;
  try {
    output = await serverDatabases.getDocument(DB_ID, OUTPUTS_COL, outputId) as unknown as Output;
  } catch {
    return NextResponse.json({ error: "Output not found", code: "NOT_FOUND" }, { status: 404 });
  }

  if (output.userId !== userId) {
    return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 403 });
  }

  // Fetch brand keywords from profile
  let brandKeywords: string[] = [];
  try {
    const profilesResult = await serverDatabases.listDocuments(DB_ID, PROFILES_COL, [
      Query.equal("userId", userId),
    ]);
    if (profilesResult.documents.length > 0) {
      const profile = profilesResult.documents[0] as unknown as Profile;
      brandKeywords = profile.brandKeywords ?? [];
    }
  } catch {
    // Fall through with empty keywords
  }

  // Use summarisedContent if present (DEC-25)
  let sourceContent = project.summarisedContent || project.sourceContent;
  if (sourceContent.length > MAX_SOURCE_CONTENT_LENGTH) {
    sourceContent = sourceContent.slice(0, MAX_SOURCE_CONTENT_LENGTH) + "…[content truncated]";
  }

  const channel = output.channel;

  // Build prompts for both tones
  const promptA = buildChannelPrompt(channel, toneA, brandKeywords);
  const promptB = buildChannelPrompt(channel, toneB, brandKeywords);

  function callGenerate(prompt: { system: string; user: string } | string): Promise<string> {
    if (typeof prompt === "string") {
      return generateContent(prompt, sourceContent);
    }
    const isJson = channel === "instagram";
    return generateContent(prompt.system, prompt.user + "\n\n" + sourceContent, isJson ? { jsonMode: true } : undefined);
  }

  // Fire both comparisons in parallel — nothing is saved to DB (DEC-24)
  let contentA: string;
  let contentB: string;
  try {
    [contentA, contentB] = await Promise.all([
      callGenerate(promptA),
      callGenerate(promptB),
    ]);
  } catch {
    return NextResponse.json({ error: "Comparison generation failed", code: "COMPARE_FAILED" }, { status: 500 });
  }

  return NextResponse.json({ contentA, contentB });
}
