import { NextRequest, NextResponse } from "next/server";
import { Client, Account, Storage, ID } from "node-appwrite";
import { InputFile } from "node-appwrite/file";

const ALLOWED_MIME_TYPES = ["audio/mpeg", "audio/wav", "audio/x-m4a", "audio/mp4"];
const ALLOWED_EXTENSIONS = [".mp3", ".wav", ".m4a"];
const MAX_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

function getSessionClient(jwt: string) {
  return new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
    .setJWT(jwt);
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

  // Parse multipart form data
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data.", code: "UPLOAD_FAILED" }, { status: 500 });
  }

  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No file provided.", code: "UPLOAD_FAILED" }, { status: 400 });
  }

  // Validate MIME type — fall back to extension check for clients that send application/octet-stream
  const ext = "." + file.name.split(".").pop()?.toLowerCase();
  const mimeOk = ALLOWED_MIME_TYPES.includes(file.type);
  const extOk = ALLOWED_EXTENSIONS.includes(ext);
  if (!mimeOk && !extOk) {
    return NextResponse.json(
      { error: "Unsupported file type. Please upload an MP3, WAV, or M4A file.", code: "UNSUPPORTED_FILE_TYPE" },
      { status: 400 }
    );
  }

  // Validate size
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json(
      { error: "File exceeds the 25 MB limit.", code: "FILE_TOO_LARGE" },
      { status: 413 }
    );
  }

  // Upload to Appwrite Storage using server SDK (DEC-01)
  try {
    const serverClient = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
      .setKey(process.env.APPWRITE_API_KEY!);

    const storage = new Storage(serverClient);
    const buffer = Buffer.from(await file.arrayBuffer());
    const inputFile = InputFile.fromBuffer(buffer, file.name);

    const uploaded = await storage.createFile(
      process.env.NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID!,
      ID.unique(),
      inputFile
    );

    return NextResponse.json({ fileId: uploaded.$id });
  } catch (err) {
    console.error("[upload] storage.createFile failed:", err);
    return NextResponse.json(
      { error: "Upload failed. Please try again.", code: "UPLOAD_FAILED" },
      { status: 500 }
    );
  }
}
