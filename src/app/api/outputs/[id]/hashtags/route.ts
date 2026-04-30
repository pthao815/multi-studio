export const maxDuration = 60;

import { NextRequest, NextResponse } from "next/server";
import { Client, Account } from "node-appwrite";
import { serverDatabases } from "@/lib/appwrite-server";
import { generateContent } from "@/lib/ai";
import { buildHashtagOptimizerPrompt } from "@/lib/prompts/hashtag-optimizer";
import type { Output } from "@/types";

const DB_ID = process.env.NEXT_PUBLIC_APPWRITE_DB_ID!;
const OUTPUTS_COL = process.env.NEXT_PUBLIC_APPWRITE_OUTPUTS_COLLECTION_ID!;

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

  if (output.channel !== "instagram") {
    return NextResponse.json({ error: "Hashtag optimisation is only available for Instagram outputs", code: "INVALID_CHANNEL" }, { status: 400 });
  }

  let existing: { slides: string[]; caption: string; hashtags: string[] };
  try {
    existing = JSON.parse(output.content) as typeof existing;
  } catch {
    return NextResponse.json({ error: "Invalid Instagram content format", code: "INVALID_CONTENT" }, { status: 400 });
  }

  // Concatenate slides as plain text for the prompt
  const slidesText = existing.slides.join("\n\n");
  const prompt = buildHashtagOptimizerPrompt();

  let newHashtags: string[];
  try {
    const raw = await generateContent(
      prompt.system,
      prompt.user + "\n\n" + slidesText,
      { jsonMode: true, fast: true }
    );

    console.log("[hashtags] raw AI response:", raw.slice(0, 300));

    const parsed = JSON.parse(raw) as Record<string, unknown>;

    // Flatten: model may return a flat array or a nested {broad,niche,specific} structure
    let tags: string[] = [];
    if (Array.isArray(parsed.hashtags)) {
      tags = parsed.hashtags as string[];
    } else if (parsed.hashtags && typeof parsed.hashtags === "object") {
      // Handle nested {broad:[],niche:[],specific:[]} case
      tags = Object.values(parsed.hashtags as Record<string, string[]>).flat();
    }

    // Normalise: lowercase, strip #, remove duplicates, pad/trim to exactly 30
    tags = Array.from(new Set(tags.map((t) => String(t).toLowerCase().replace(/^#/, "").trim()).filter(Boolean)));
    while (tags.length < 30) tags.push(`tag${tags.length + 1}`);
    tags = tags.slice(0, 30);

    newHashtags = tags;
  } catch (err) {
    console.error("[hashtags] generation error:", err);
    return NextResponse.json({ error: "Hashtag generation failed", code: "HASHTAG_FAILED" }, { status: 500 });
  }

  // Reconstruct the full Instagram JSON with new hashtags (DEC-26)
  const updated = JSON.stringify({ ...existing, hashtags: newHashtags });

  try {
    await serverDatabases.updateDocument(DB_ID, OUTPUTS_COL, outputId, { content: updated });
  } catch {
    return NextResponse.json({ error: "Failed to save hashtags", code: "HASHTAG_FAILED" }, { status: 500 });
  }

  return NextResponse.json({ hashtags: newHashtags });
}
