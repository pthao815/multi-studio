import { NextRequest, NextResponse } from "next/server";
import { Client, Account } from "node-appwrite";
import { serverDatabases } from "@/lib/appwrite-server";
import type { Project } from "@/types";

const DB_ID = process.env.NEXT_PUBLIC_APPWRITE_DB_ID!;
const PROJECTS_COL = process.env.NEXT_PUBLIC_APPWRITE_PROJECTS_COLLECTION_ID!;

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
  // Auth — derive userId from session JWT (DEC-05)
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

  // Fetch project; return 404 if not found
  let project: Project;
  try {
    project = await serverDatabases.getDocument(
      DB_ID,
      PROJECTS_COL,
      projectId
    ) as unknown as Project;
  } catch (err: unknown) {
    const appwriteErr = err as { code?: number };
    if (appwriteErr?.code === 404) {
      return NextResponse.json({ error: "Project not found", code: "PROJECT_NOT_FOUND" }, { status: 404 });
    }
    return NextResponse.json({ error: "Project not found", code: "PROJECT_NOT_FOUND" }, { status: 404 });
  }

  // Verify ownership (DEC-05)
  if (project.userId !== userId) {
    return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 403 });
  }

  return NextResponse.json({ status: project.status });
}
