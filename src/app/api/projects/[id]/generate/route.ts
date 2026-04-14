export const maxDuration = 60;

import { NextRequest, NextResponse } from "next/server";
import { Client, Account, ID, Query } from "node-appwrite";
import { serverDatabases } from "@/lib/appwrite-server";
import { generateContent, MAX_SOURCE_CONTENT_LENGTH } from "@/lib/ai";
import { buildFacebookPrompt } from "@/lib/prompts/facebook";
import { buildTikTokPrompt } from "@/lib/prompts/tiktok";
import { buildInstagramPrompt } from "@/lib/prompts/instagram";
import type { Project, Profile } from "@/types";

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

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Auth — derive userId from session cookie only, never from request body (DEC-05)
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

  // Fetch project and verify ownership (DEC-05)
  let project: Project;
  try {
    project = await serverDatabases.getDocument(
      DB_ID,
      PROJECTS_COL,
      projectId
    ) as unknown as Project;
  } catch {
    return NextResponse.json({ error: "Project not found", code: "GENERATION_FAILED" }, { status: 500 });
  }

  if (project.userId !== userId) {
    return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 403 });
  }

  // Set status to processing before calling AI
  await serverDatabases.updateDocument(DB_ID, PROJECTS_COL, projectId, {
    status: "processing",
    updatedAt: new Date().toISOString(),
  });

  // Fetch profile for brand voice and keywords (FR-GEN-06)
  let brandVoice = "calm";
  let brandKeywords: string[] = [];
  try {
    const profilesResult = await serverDatabases.listDocuments(DB_ID, PROFILES_COL, [
      Query.equal("userId", userId),
    ]);
    if (profilesResult.documents.length > 0) {
      const profile = profilesResult.documents[0] as unknown as Profile;
      brandVoice = profile.brandVoice ?? "calm";
      brandKeywords = profile.brandKeywords ?? [];
    }
  } catch {
    // Fall through with calm defaults — generation still proceeds
  }

  // Truncate source content if needed (DEC-15)
  let sourceContent = project.sourceContent;
  if (sourceContent.length > MAX_SOURCE_CONTENT_LENGTH) {
    sourceContent = sourceContent.slice(0, MAX_SOURCE_CONTENT_LENGTH) + "…[content truncated]";
  }

  // Build prompts
  const facebookPrompt = buildFacebookPrompt(brandVoice, brandKeywords);
  const tiktokPrompt = buildTikTokPrompt(brandVoice, brandKeywords);
  const instagramPrompt = buildInstagramPrompt(brandVoice, brandKeywords);

  // Run all 3 AI calls in parallel — sequential calls are forbidden (DEC-11)
  let facebookContent: string;
  let tiktokContent: string;
  let instagramContent: string;

  try {
    [facebookContent, tiktokContent, instagramContent] = await Promise.all([
      generateContent(facebookPrompt.system, facebookPrompt.user + "\n\n" + sourceContent),
      generateContent(tiktokPrompt.system, tiktokPrompt.user + "\n\n" + sourceContent),
      generateContent(instagramPrompt.system, instagramPrompt.user + "\n\n" + sourceContent, { jsonMode: true }),
    ]);
  } catch {
    await serverDatabases.updateDocument(DB_ID, PROJECTS_COL, projectId, {
      status: "failed",
      updatedAt: new Date().toISOString(),
    });
    return NextResponse.json({ error: "Generation failed", code: "GENERATION_FAILED" }, { status: 500 });
  }

  // Validate Instagram JSON structure — no retry (DEC-18)
  let instagramParsed: { slides: string[]; caption: string; hashtags: string[] };
  try {
    instagramParsed = JSON.parse(instagramContent);
    if (instagramParsed.slides.length !== 10 || instagramParsed.hashtags.length !== 30) {
      throw new Error("Instagram structure invalid");
    }
  } catch {
    await serverDatabases.updateDocument(DB_ID, PROJECTS_COL, projectId, {
      status: "failed",
      updatedAt: new Date().toISOString(),
    });
    return NextResponse.json({ error: "Generation failed", code: "GENERATION_FAILED" }, { status: 500 });
  }

  // Write 3 output documents then mark project done
  try {
    const now = new Date().toISOString();
    await Promise.all([
      serverDatabases.createDocument(DB_ID, OUTPUTS_COL, ID.unique(), {
        projectId,
        userId,
        channel: "facebook",
        content: facebookContent,
        createdAt: now,
        updatedAt: now,
      }),
      serverDatabases.createDocument(DB_ID, OUTPUTS_COL, ID.unique(), {
        projectId,
        userId,
        channel: "tiktok",
        content: tiktokContent,
        createdAt: now,
        updatedAt: now,
      }),
      serverDatabases.createDocument(DB_ID, OUTPUTS_COL, ID.unique(), {
        projectId,
        userId,
        channel: "instagram",
        content: instagramContent,
        createdAt: now,
        updatedAt: now,
      }),
    ]);

    await serverDatabases.updateDocument(DB_ID, PROJECTS_COL, projectId, {
      status: "done",
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch {
    await serverDatabases.updateDocument(DB_ID, PROJECTS_COL, projectId, {
      status: "failed",
      updatedAt: new Date().toISOString(),
    });
    return NextResponse.json({ error: "Generation failed", code: "GENERATION_FAILED" }, { status: 500 });
  }
}
