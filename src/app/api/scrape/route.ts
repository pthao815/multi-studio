import { NextRequest, NextResponse } from "next/server";
import { Client, Account } from "node-appwrite";
import { scrapeUrl } from "@/lib/cheerio";

function getSessionClient(jwt: string) {
  return new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
    .setJWT(jwt);
}

export async function POST(request: NextRequest) {
  // Auth check (DEC-05) — verify session cookie before doing any work
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

  // Validate request body
  let url: string;
  try {
    const body = await request.json();
    url = body?.url ?? "";
  } catch {
    return NextResponse.json({ error: "Invalid request body", code: "INVALID_URL" }, { status: 400 });
  }

  if (!url || !url.startsWith("http://") && !url.startsWith("https://")) {
    return NextResponse.json(
      { error: "URL must begin with http:// or https://", code: "INVALID_URL" },
      { status: 400 }
    );
  }

  // Scrape
  try {
    const { title, content } = await scrapeUrl(url);

    if (!content) {
      return NextResponse.json(
        { error: "No readable content found at this URL. Try pasting the text manually.", code: "NO_CONTENT" },
        { status: 400 }
      );
    }

    return NextResponse.json({ title, text: content });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";

    if (message.includes("extract enough text") || message.includes("NO_CONTENT")) {
      return NextResponse.json(
        { error: "No readable content found at this URL. Try pasting the text manually.", code: "NO_CONTENT" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch or parse the URL.", code: "SCRAPE_FAILED" },
      { status: 500 }
    );
  }
}
