import { NextRequest, NextResponse } from "next/server";
import { Client, Account, ID } from "node-appwrite";
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

  // Create duplicate — outputs are NOT copied (DEC-23)
  const now = new Date().toISOString();
  const newDoc: Record<string, unknown> = {
    userId,
    title: `${project.title} (copy)`,
    sourceType: project.sourceType,
    sourceContent: project.sourceContent,
    audioFileId: "",
    transcription: "",
    status: "pending",
    createdAt: now,
    updatedAt: now,
  };

  if (project.summarisedContent) {
    newDoc.summarisedContent = project.summarisedContent;
  }

  let newProject: { $id: string };
  try {
    newProject = await serverDatabases.createDocument(
      DB_ID,
      PROJECTS_COL,
      ID.unique(),
      newDoc
    ) as unknown as { $id: string };
  } catch {
    return NextResponse.json({ error: "Duplicate failed", code: "DUPLICATE_FAILED" }, { status: 500 });
  }

  return NextResponse.json({ newProjectId: newProject.$id });
}
