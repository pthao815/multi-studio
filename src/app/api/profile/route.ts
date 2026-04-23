import { NextRequest, NextResponse } from "next/server";
import { Client, Account, Query } from "node-appwrite";
import { serverDatabases } from "@/lib/appwrite-server";

const DB_ID = process.env.NEXT_PUBLIC_APPWRITE_DB_ID!;
const PROFILES_COL = process.env.NEXT_PUBLIC_APPWRITE_PROFILES_COLLECTION_ID!;

function getSessionClient(jwt: string) {
  return new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
    .setJWT(jwt);
}

export async function PUT(request: NextRequest) {
  const jwt = request.cookies.get("appwrite-jwt")?.value;
  if (!jwt) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  let userId: string;
  try {
    const account = new Account(getSessionClient(jwt));
    const user = await account.get();
    userId = user.$id;
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { displayName, brandVoice, brandKeywords } = await request.json() as {
    displayName: string;
    brandVoice: string;
    brandKeywords: string[];
  };

  let profileId: string;
  let existingCreatedAt: string;
  try {
    const profiles = await serverDatabases.listDocuments(DB_ID, PROFILES_COL, [
      Query.equal("userId", userId),
    ]);
    if (profiles.documents.length === 0) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }
    profileId = profiles.documents[0].$id;
    existingCreatedAt = (profiles.documents[0].createdAt as string) || new Date().toISOString();
  } catch (err) {
    console.error("profile fetch error:", err);
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }

  // Sanitise keywords — ensure every item is a non-empty string ≤ 50 chars
  const safeKeywords = (Array.isArray(brandKeywords) ? brandKeywords : [])
    .map((k) => String(k).trim().slice(0, 50))
    .filter((k) => k.length > 0);

  const payload: Record<string, unknown> = {
    userId,
    displayName: displayName ?? "",
    brandVoice: [brandVoice ?? "energetic"],
    createdAt: existingCreatedAt,
    ...(safeKeywords.length > 0 && { brandKeywords: safeKeywords }),
  };

  try {
    await serverDatabases.updateDocument(DB_ID, PROFILES_COL, profileId, payload);
  } catch (err) {
    console.error("profile update error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
