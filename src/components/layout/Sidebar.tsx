"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, PlusCircle, Calendar, Settings, LogOut } from "lucide-react";
import { account } from "@/lib/appwrite";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/new", label: "New Project", icon: PlusCircle },
  { href: "/dashboard/scheduler", label: "Scheduler", icon: Calendar },
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
    <aside className="flex flex-col w-14 md:w-60 h-full bg-surface border-r border-white/[0.06] shrink-0 overflow-y-auto">
      {/* Logo — matches TopBar height */}
      <div className="h-16 flex items-center justify-center md:justify-start md:px-5 border-b border-white/[0.06] shrink-0">
        <span className="hidden md:inline text-xl font-bold bg-gradient-to-r from-violet-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
          AI Multi-Studio
        </span>
        <div className="md:hidden w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 via-blue-500 to-cyan-500 flex items-center justify-center shrink-0">
          <span className="text-white text-xs font-bold">M</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-1.5 md:px-3 py-4 flex flex-col gap-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              title={label}
              className={
                active
                  ? "flex items-center justify-center md:justify-start gap-0 md:gap-3 px-2.5 md:px-3 py-2.5 rounded-xl text-white text-sm font-medium bg-white/[0.08] border border-white/[0.06]"
                  : "flex items-center justify-center md:justify-start gap-0 md:gap-3 px-2.5 md:px-3 py-2.5 rounded-xl text-slate-400 text-sm font-medium transition-all duration-150 hover:text-white hover:bg-white/[0.05]"
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="hidden md:inline">{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-1.5 md:px-3 py-4 border-t border-white/[0.06]">
        <button
          onClick={handleLogout}
          title="Log out"
          className="flex items-center justify-center md:justify-start gap-0 md:gap-3 w-full px-2.5 md:px-3 py-2.5 rounded-xl text-slate-400 text-sm transition-all duration-150 hover:text-red-400 hover:bg-red-500/[0.05]"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span className="hidden md:inline">Log out</span>
        </button>
      </div>
    </aside>
  );
}
