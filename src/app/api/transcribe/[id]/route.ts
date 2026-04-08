import { NextRequest, NextResponse } from "next/server";
import { Client, Account } from "node-appwrite";
import { getTranscriptionStatus } from "@/lib/assemblyai";

function getSessionClient(jwt: string) {
  return new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
    .setJWT(jwt);
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

  try {
    const result = await getTranscriptionStatus(params.id);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[transcribe/status] failed:", err);
    return NextResponse.json(
      { error: "Failed to get transcription status.", code: "TRANSCRIPTION_POLL_FAILED" },
      { status: 500 }
    );
  }
}
