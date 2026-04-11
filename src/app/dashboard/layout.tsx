import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Client, Account, Databases, Query, ID } from "node-appwrite";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";

const ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!;
const PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!;
const API_KEY = process.env.APPWRITE_API_KEY!;
const DB_ID = process.env.NEXT_PUBLIC_APPWRITE_DB_ID!;
const PROFILES_COL = process.env.NEXT_PUBLIC_APPWRITE_PROFILES_COLLECTION_ID!;

async function getSessionUser() {
  const cookieStore = cookies();
  const jwt = cookieStore.get("appwrite-jwt")?.value;

  if (!jwt) redirect("/login");

  const client = new Client()
    .setEndpoint(ENDPOINT)
    .setProject(PROJECT_ID)
    .setJWT(jwt);

  try {
    const account = new Account(client);
    return await account.get();
  } catch {
    redirect("/login");
  }
}

async function getOrCreateProfile(userId: string) {
  const serverClient = new Client()
    .setEndpoint(ENDPOINT)
    .setProject(PROJECT_ID)
    .setKey(API_KEY);

  const db = new Databases(serverClient);

  const result = await db.listDocuments(DB_ID, PROFILES_COL, [
    Query.equal("userId", userId),
  ]);

  if (result.documents.length > 0) {
    return result.documents[0];
  }

  return await db.createDocument(DB_ID, PROFILES_COL, ID.unique(), {
    userId,
    displayName: "",
    avatarUrl: "",
    brandVoice: "energetic",
    brandKeywords: [],
    createdAt: new Date().toISOString(),
  });
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  const profile = await getOrCreateProfile(user.$id);

  return (
    <div className="flex min-h-screen bg-base">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar displayName={profile.displayName as string} />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
