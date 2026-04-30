export const maxDuration = 60;

import { NextRequest } from "next/server";
import { Client, Account, Query } from "node-appwrite";
import { serverDatabases } from "@/lib/appwrite-server";
import { streamContent, MAX_SOURCE_CONTENT_LENGTH } from "@/lib/ai";
import { buildFacebookPrompt } from "@/lib/prompts/facebook";
import { buildTikTokPrompt } from "@/lib/prompts/tiktok";
import { buildInstagramPrompt } from "@/lib/prompts/instagram";
import { buildLinkedInPrompt } from "@/lib/prompts/linkedin";
import { buildTwitterPrompt } from "@/lib/prompts/twitter";
import { detectLanguage } from "@/lib/language";
import type { Output, Project, Profile, ChannelType } from "@/types";

const DB_ID = process.env.NEXT_PUBLIC_APPWRITE_DB_ID!;
const OUTPUTS_COL = process.env.NEXT_PUBLIC_APPWRITE_OUTPUTS_COLLECTION_ID!;
const PROJECTS_COL = process.env.NEXT_PUBLIC_APPWRITE_PROJECTS_COLLECTION_ID!;
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
    return new Response(JSON.stringify({ error: "Unauthorized", code: "UNAUTHORIZED" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  let userId: string;
  try {
    const account = new Account(getSessionClient(jwt));
    const user = await account.get();
    userId = user.$id;
  } catch {
    return new Response(JSON.stringify({ error: "Unauthorized", code: "UNAUTHORIZED" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  const outputId = params.id;

  let output: Output;
  try {
    output = (await serverDatabases.getDocument(
      DB_ID,
      OUTPUTS_COL,
      outputId
    )) as unknown as Output;
  } catch {
    return new Response(JSON.stringify({ error: "Output not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (output.userId !== userId) {
    return new Response(JSON.stringify({ error: "Unauthorized", code: "UNAUTHORIZED" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  let project: Project;
  try {
    project = (await serverDatabases.getDocument(
      DB_ID,
      PROJECTS_COL,
      output.projectId
    )) as unknown as Project;
  } catch {
    return new Response(JSON.stringify({ error: "Project not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  let brandVoice = "calm";
  let brandKeywords: string[] = [];
  try {
    const profilesResult = await serverDatabases.listDocuments(DB_ID, PROFILES_COL, [
      Query.equal("userId", userId),
    ]);
    if (profilesResult.documents.length > 0) {
      const profile = profilesResult.documents[0] as unknown as Profile;
      const bv = profile.brandVoice as unknown;
      brandVoice = (Array.isArray(bv) ? bv[0] : bv) ?? "calm";
      brandKeywords = profile.brandKeywords ?? [];
    }
  } catch {
    // fall through with defaults
  }

  let sourceContent = project.summarisedContent || project.sourceContent;
  if (sourceContent.length > MAX_SOURCE_CONTENT_LENGTH) {
    sourceContent = sourceContent.slice(0, MAX_SOURCE_CONTENT_LENGTH) + "…[content truncated]";
  }

  const language = detectLanguage(sourceContent);
  const channel = output.channel as ChannelType;
  let systemPrompt: string;
  let userPrompt: string;

  if (channel === "facebook") {
    const p = buildFacebookPrompt(brandVoice, brandKeywords, language);
    systemPrompt = p.system;
    userPrompt = p.user + "\n\n" + sourceContent;
  } else if (channel === "tiktok") {
    const p = buildTikTokPrompt(brandVoice, brandKeywords, language);
    systemPrompt = p.system;
    userPrompt = p.user + "\n\n" + sourceContent;
  } else if (channel === "instagram") {
    const p = buildInstagramPrompt(brandVoice, brandKeywords, language);
    systemPrompt = p.system;
    userPrompt = p.user + "\n\n" + sourceContent;
  } else if (channel === "linkedin") {
    systemPrompt = buildLinkedInPrompt(brandVoice, brandKeywords, language);
    userPrompt = sourceContent;
  } else if (channel === "twitter") {
    systemPrompt = buildTwitterPrompt(brandVoice, brandKeywords, language);
    userPrompt = sourceContent;
  } else {
    return new Response(JSON.stringify({ error: "Unsupported channel" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const aiStream = streamContent(systemPrompt, userPrompt);

  let accumulated = "";
  const decoder = new TextDecoder();

  const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      accumulated += decoder.decode(chunk, { stream: true });
      controller.enqueue(chunk);
    },
    async flush() {
      accumulated += decoder.decode();
      // Read current content after stream closes — do not read before (DEC-22)
      let previousContent = "";
      try {
        const current = await serverDatabases.getDocument(DB_ID, OUTPUTS_COL, outputId);
        previousContent = (current as unknown as { content: string }).content ?? "";
      } catch {}
      serverDatabases
        .updateDocument(DB_ID, OUTPUTS_COL, outputId, {
          content: accumulated,
          previousContent,
          updatedAt: new Date().toISOString(),
        })
        .catch(() => {});
    },
  });

  aiStream.pipeTo(writable).catch(() => {});

  return new Response(readable, {
    headers: { "Content-Type": "text/event-stream" },
  });
}
