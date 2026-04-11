"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, PlusCircle, Calendar, BarChart2, Settings, LogOut } from "lucide-react";
import { account } from "@/lib/appwrite";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/new", label: "New Project", icon: PlusCircle },
  { href: "/dashboard/scheduler", label: "Scheduler", icon: Calendar },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart2 },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await account.deleteSession("current");
    router.push("/login");
  }

  return (
    <aside className="flex flex-col w-60 min-h-screen bg-surface border-r border-white/[0.06] shrink-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/[0.06]">
        <span className="text-xl font-bold bg-gradient-to-r from-violet-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
          AI Multi-Studio
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={
                active
                  ? "flex items-center gap-3 px-3 py-2.5 rounded-xl text-white text-sm font-medium bg-white/[0.08] border border-white/[0.06]"
                  : "flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 text-sm font-medium transition-all duration-150 hover:text-white hover:bg-white/[0.05]"
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-white/[0.06]">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-slate-400 text-sm transition-all duration-150 hover:text-red-400 hover:bg-red-500/[0.05]"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Log out
        </button>
      </div>
    </aside>
  );
}
