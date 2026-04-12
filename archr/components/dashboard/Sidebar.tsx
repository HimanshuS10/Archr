"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { HugeiconsIcon } from "@hugeicons/react";
import { useRouter } from "next/navigation";
import {
  Home04Icon,
  Calendar01Icon,
  TaskDaily02Icon,
  Flag01Icon,
  SidebarRight01Icon,
  Logout01Icon,
} from "@hugeicons/core-free-icons";

export type Tab = "Home" | "Events" | "Tasks To Do" | "Deadlines";

const NAV_ITEMS: { tab: Tab; label: string; icon: React.ComponentProps<typeof HugeiconsIcon>["icon"] }[] = [
  { tab: "Home",      label: "Home",      icon: Home04Icon      },
  { tab: "Events",    label: "Events",    icon: Calendar01Icon  },
  { tab: "Tasks To Do",     label: "Tasks To Do",     icon: TaskDaily02Icon },
  { tab: "Deadlines", label: "Deadlines", icon: Flag01Icon      },
];

type SidebarProps = {
  collapsed: boolean;
  onToggle: () => void;
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
};

export default function Sidebar({ collapsed, onToggle, activeTab, onTabChange }: SidebarProps) {
  const router = useRouter();
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const [displayName, setDisplayName] = useState("User");
  const [email, setEmail] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const user = data.user;
      if (!user) return;
      setDisplayName(
        user.user_metadata?.name ||
        user.user_metadata?.full_name ||
        user.user_metadata?.preferred_username ||
        "User"
      );
      setEmail(user.email ?? "");
    });
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!profileMenuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => { if (collapsed) setMenuOpen(false); }, [collapsed]);

  const handleSignOut = async () => {
    setSigningOut(true);
    await supabase.auth.signOut();
    router.replace("/login");
  };

  const initials = displayName.trim().charAt(0).toUpperCase();

  return (
    <aside
      className={`group fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-slate-100 bg-white transition-all duration-300 ${
        collapsed ? "w-[56px]" : "w-[200px]"
      }`}
    >
      {/* ── Header ── */}
      <div className={`flex h-14 items-center justify-center border-b border-slate-100 ${collapsed ? "px-0" : "gap-2 px-4"}`}>
        <Image src="/Logo.png" alt="Archr" width={28} height={28} className="shrink-0" />
        {!collapsed && (
          <span className="text-sm font-semibold text-slate-900 tracking-tight">Archr</span>
        )}
      </div>

      {/* ── Nav ── */}
      <nav className={`mt-3 flex flex-1 flex-col gap-0.5 ${collapsed ? "px-2" : "px-3"}`}>
        {!collapsed && (
          <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
            Menu
          </p>
        )}

        {NAV_ITEMS.map(({ tab, label, icon }) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => onTabChange(tab)}
              title={collapsed ? label : undefined}
              className={`flex items-center gap-2.5 rounded-lg px-2 py-2 text-left text-xs font-medium transition-colors hover:cursor-pointer ${
                isActive
                  ? "bg-blue-50 text-blue-600"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
              } ${collapsed ? "justify-center" : ""}`}
            >
              <HugeiconsIcon
                icon={icon}
                className={`h-4 w-4 shrink-0 ${isActive ? "text-blue-500" : "text-slate-400"}`}
              />
              {!collapsed && label}
            </button>
          );
        })}
      </nav>

      {/* ── Collapse toggle ── */}
      <div className={`pb-2 ${collapsed ? "flex justify-center" : "px-3"}`}>
        <button
          type="button"
          onClick={onToggle}
          title={collapsed ? "Expand" : "Collapse"}
          className="flex items-center gap-2 rounded-lg px-2 py-2 text-xs font-medium text-slate-400 transition hover:bg-slate-50 hover:text-slate-700"
        >
          <HugeiconsIcon
            icon={SidebarRight01Icon}
            className={`h-4 w-4 shrink-0 transition-transform duration-300 ${collapsed ? "" : "rotate-180"}`}
          />
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>

      {/* ── Profile ── */}
      <div className={`relative border-t border-slate-100 pb-3 pt-2 ${collapsed ? "px-2" : "px-3"}`} ref={profileMenuRef}>
        {menuOpen && (
          <div
            className={`absolute bottom-full mb-1 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg shadow-slate-200/60 ${
              collapsed ? "left-1/2 w-40 -translate-x-1/2" : "left-3 right-3"
            }`}
          >
            <div className="mb-1.5 px-2 py-1.5">
              <p className="text-xs font-semibold text-slate-800 truncate">{displayName}</p>
              <p className="text-[11px] text-slate-400 truncate">{email}</p>
            </div>
            <hr className="border-slate-100 mb-1" />
            <button
              type="button"
              onClick={handleSignOut}
              disabled={signingOut}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-red-500 transition hover:bg-red-50 disabled:opacity-60"
            >
              <HugeiconsIcon icon={Logout01Icon} className="h-3.5 w-3.5" />
              {signingOut ? "Logging out…" : "Log out"}
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={() => setMenuOpen((p) => !p)}
          className={`flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 transition hover:bg-slate-50 ${collapsed ? "justify-center" : ""}`}
        >
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[11px] font-bold text-blue-600">
            {initials}
          </div>
          {!collapsed && (
            <div className="min-w-0 text-left">
              <p className="text-xs font-medium text-slate-800 truncate leading-tight">{displayName}</p>
            </div>
          )}
        </button>
      </div>
    </aside>
  );
}
