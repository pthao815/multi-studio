import { NextRequest, NextResponse } from "next/server";
import { Client, Account } from "node-appwrite";
import { serverDatabases } from "@/lib/appwrite-server";
import type { Output } from "@/types";

const DB_ID = process.env.NEXT_PUBLIC_APPWRITE_DB_ID!;
const OUTPUTS_COL = process.env.NEXT_PUBLIC_APPWRITE_OUTPUTS_COLLECTION_ID!;

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

  const outputId = params.id;

  // Fetch output and verify ownership (DEC-05)
  let output: Output;
  try {
    output = await serverDatabases.getDocument(
      DB_ID,
      OUTPUTS_COL,
      outputId
    ) as unknown as Output;
  } catch {
    return NextResponse.json({ error: "Output not found", code: "UPDATE_FAILED" }, { status: 500 });
  }

  if (output.userId !== userId) {
    return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 403 });
  }

  const { content } = await request.json() as { content: string };
  const updatedAt = new Date().toISOString();

  // Copy current content → previousContent before overwriting (DEC-22)
  try {
    await serverDatabases.updateDocument(DB_ID, OUTPUTS_COL, outputId, {
      content,
      previousContent: output.content,
      updatedAt,
    });
  } catch {
    return NextResponse.json({ error: "Update failed", code: "UPDATE_FAILED" }, { status: 500 });
  }

  return NextResponse.json({ id: outputId, content, updatedAt });
}
