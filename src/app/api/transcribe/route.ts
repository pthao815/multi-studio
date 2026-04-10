import { NextRequest, NextResponse } from "next/server";
import { Client, Account, Tokens } from "node-appwrite";
import { submitTranscriptionJob } from "@/lib/assemblyai";

const ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!;
const PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!;
const API_KEY = process.env.APPWRITE_API_KEY!;
const BUCKET_ID = process.env.NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID!;

function getSessionClient(jwt: string) {
  return new Client().setEndpoint(ENDPOINT).setProject(PROJECT_ID).setJWT(jwt);
}

function getServerClient() {
  return new Client().setEndpoint(ENDPOINT).setProject(PROJECT_ID).setKey(API_KEY);
}

export async function POST(request: NextRequest) {
  // Auth check (DEC-05)
  const jwt = request.cookies.get("appwrite-jwt")?.value;
  if (!jwt) {
    return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  }

  try {
    const account = new Account(getSessionClient(jwt));
    await account.get();
  } catch {
    return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  }

  let fileId: string;
  try {
    const body = await request.json();
    fileId = body?.fileId ?? "";
  } catch {
    return NextResponse.json({ error: "Invalid request body.", code: "TRANSCRIPTION_SUBMIT_FAILED" }, { status: 500 });
  }

  if (!fileId) {
    return NextResponse.json({ error: "fileId is required.", code: "TRANSCRIPTION_SUBMIT_FAILED" }, { status: 500 });
  }

  try {
    const serverClient = getServerClient();

    // Generate a temporary token so AssemblyAI can fetch the private file (DEC-01)
    const tokens = new Tokens(serverClient);
    const expire = new Date(Date.now() + 600_000).toISOString(); // 600s TTL
    const token = await tokens.createFileToken(BUCKET_ID, fileId, expire);

    const signedUrl = `${ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${fileId}/download?project=${PROJECT_ID}&token=${token.secret}`;

    const transcriptId = await submitTranscriptionJob(signedUrl);
    return NextResponse.json({ transcriptId });
  } catch (err) {
    console.error("[transcribe] failed:", err);
    return NextResponse.json(
      { error: "Failed to submit transcription job.", code: "TRANSCRIPTION_SUBMIT_FAILED" },
      { status: 500 }
    );
  }
}
