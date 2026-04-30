export const maxDuration = 60;

import { NextRequest, NextResponse } from "next/server";
import { Client, Account } from "node-appwrite";
import { serverDatabases } from "@/lib/appwrite-server";
import { generateContent } from "@/lib/ai";
import { buildSummarizePrompt } from "@/lib/prompts/summarize";
import type { Project } from "@/types";

const DB_ID = process.env.NEXT_PUBLIC_APPWRITE_DB_ID!;
const PROJECTS_COL = process.env.NEXT_PUBLIC_APPWRITE_PROJECTS_COLLECTION_ID!;

function getSessionClient(jwt: string) {
  return new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
    .setJWT(jwt);
}

export async function PUT(
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

  let project: Project;
  try {
    project = await serverDatabases.getDocument(
      DB_ID,
      PROJECTS_COL,
      projectId
    ) as unknown as Project;
  } catch {
    return NextResponse.json({ error: "Project not found", code: "NOT_FOUND" }, { status: 404 });
  }

  if (project.userId !== userId) {
    return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 403 });
  }

  const body = await request.json() as {
    sourceContent?: string;
    title?: string;
    summarisedContent?: string;
  };

  const updatedAt = new Date().toISOString();
  const updates: Record<string, string> = { updatedAt };

  if (body.sourceContent !== undefined) updates.sourceContent = body.sourceContent;
  if (body.title !== undefined) updates.title = body.title;
  if (body.summarisedContent !== undefined) updates.summarisedContent = body.summarisedContent;

  try {
    await serverDatabases.updateDocument(DB_ID, PROJECTS_COL, projectId, updates);
  } catch {
    return NextResponse.json({ error: "Update failed", code: "UPDATE_FAILED" }, { status: 500 });
  }

  return NextResponse.json({
    id: projectId,
    title: body.title ?? project.title,
    sourceContent: body.sourceContent ?? project.sourceContent,
    updatedAt,
  });
}

// POST: Summarise source content and save to summarisedContent field (TASK-66 / DEC-25)
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

  let project: Project;
  try {
    project = await serverDatabases.getDocument(
      DB_ID,
      PROJECTS_COL,
      projectId
    ) as unknown as Project;
  } catch {
    return NextResponse.json({ error: "Project not found", code: "NOT_FOUND" }, { status: 404 });
  }

  if (project.userId !== userId) {
    return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 403 });
  }

  const sourceContent = project.sourceContent;
  console.log("[source/POST] sourceContent length:", sourceContent?.length ?? 0);

  if (!sourceContent || sourceContent.length <= 8000) {
    return NextResponse.json({ error: "Source content is not long enough to summarise", code: "TOO_SHORT" }, { status: 400 });
  }

  // Truncate to 20,000 chars max before sending to AI (safety guard)
  const contentForAI = sourceContent.slice(0, 20000);
  const prompt = buildSummarizePrompt();

  let summarisedContent: string;
  try {
    console.log("[source/POST] calling generateContent…");
    summarisedContent = await generateContent(
      prompt.system,
      prompt.user + "\n\n" + contentForAI,
      { fast: true }
    );
    console.log("[source/POST] summary length:", summarisedContent.length);
  } catch (err) {
    console.error("[source/POST] generateContent failed:", err);
    return NextResponse.json({ error: "Summarisation failed", code: "SUMMARISE_FAILED" }, { status: 500 });
  }

  const updatedAt = new Date().toISOString();
  try {
    await serverDatabases.updateDocument(DB_ID, PROJECTS_COL, projectId, {
      summarisedContent,
      updatedAt,
    });
  } catch (err) {
    console.error("[source/summarise] updateDocument failed:", err);
    return NextResponse.json({ error: "Failed to save summary", code: "SUMMARISE_FAILED" }, { status: 500 });
  }

  return NextResponse.json({
    summarisedContent,
    originalLength: sourceContent.length,
    summarisedLength: summarisedContent.length,
  });
}
