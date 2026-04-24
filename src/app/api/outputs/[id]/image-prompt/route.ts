export const maxDuration = 60;

import { NextRequest, NextResponse } from "next/server";
import { Client, Account } from "node-appwrite";
import { serverDatabases } from "@/lib/appwrite-server";
import { generateContent } from "@/lib/ai";
import { buildImagePrompt } from "@/lib/prompts/image-prompt";
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

  const { system, user: userPrompt } = buildImagePrompt();

  let imagePrompt: string;
  try {
    imagePrompt = await generateContent(system, userPrompt + "\n\n" + output.content);
  } catch {
    return NextResponse.json({ error: "Generation failed", code: "GENERATION_FAILED" }, { status: 500 });
  }

  try {
    await serverDatabases.updateDocument(DB_ID, OUTPUTS_COL, outputId, {
      imagePrompt,
      updatedAt: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({ error: "Save failed", code: "SAVE_FAILED" }, { status: 500 });
  }

  return NextResponse.json({ imagePrompt });
}
