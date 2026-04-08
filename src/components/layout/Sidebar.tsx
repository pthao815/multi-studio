"use client";

import { useRouter } from "next/navigation";
import { account } from "@/lib/appwrite";

export default function Sidebar() {
  const router = useRouter();

  async function handleLogout() {
    await account.deleteSession("current");
    router.push("/login");
  }

  return (
    <aside className="w-56 min-h-screen bg-gray-900 text-white flex flex-col">
      <div className="p-6 text-lg font-bold border-b border-gray-700">
        AI Multi-Studio
      </div>
      <nav className="flex-1 p-4 flex flex-col gap-1">
        <a
          href="/dashboard"
          className="px-3 py-2 rounded-lg text-sm hover:bg-gray-700 transition-colors"
        >
          Dashboard
        </a>
        <a
          href="/dashboard/new"
          className="px-3 py-2 rounded-lg text-sm hover:bg-gray-700 transition-colors"
        >
          New Project
        </a>
        <a
          href="/dashboard/scheduler"
          className="px-3 py-2 rounded-lg text-sm hover:bg-gray-700 transition-colors"
        >
          Scheduler
        </a>
        <a
          href="/dashboard/analytics"
          className="px-3 py-2 rounded-lg text-sm hover:bg-gray-700 transition-colors"
        >
          Analytics
        </a>
        <a
          href="/dashboard/settings"
          className="px-3 py-2 rounded-lg text-sm hover:bg-gray-700 transition-colors"
        >
          Settings
        </a>
      </nav>
      <div className="p-4 border-t border-gray-700">
        <button
          onClick={handleLogout}
          className="w-full px-3 py-2 rounded-lg text-sm text-left hover:bg-gray-700 transition-colors text-gray-300"
        >
          Log out
        </button>
      </div>
    </aside>
  );
}
