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
  SidebarRight01Icon,
} from "@hugeicons/core-free-icons";

const navItems: Tab[] = ["Home", "Events", "Tasks"];
type Tab = "Home" | "Events" | "Tasks";

type SidebarProps = {
  collapsed: boolean;
  onToggle: () => void;
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
};

export default function Sidebar({
  collapsed,
  onToggle,
  activeTab,
  onTabChange,
}: SidebarProps) {
  const router = useRouter();
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const [displayName, setDisplayName] = useState("User");
  const [email, setEmail] = useState("user@email.com");
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user) return;

      const name =
        user.user_metadata?.name ||
        user.user_metadata?.full_name ||
        user.user_metadata?.preferred_username ||
        "User";
      setDisplayName(name);
      setEmail(user.email ?? "user@email.com");
    };

    loadUser();
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!profileMenuRef.current?.contains(target)) {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  useEffect(() => {
    if (collapsed) {
      setIsProfileMenuOpen(false);
    }
  }, [collapsed]);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await supabase.auth.signOut();
    router.replace("/login");
    setIsSigningOut(false);
  };

  return (
    <aside
      className={`group fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-slate-200 bg-white py-2 text-slate-900 transition-all duration-300 ${
        collapsed ? "w-[70px] px-3" : "w-[260px] px-6"
      }`}
    >
      <div className="relative flex items-center justify-center">
        <div className={`flex items-center gap-3 ${collapsed ? "" : "pr-12"}`}>
          <Image src="/Logo.png" alt="Archr logo" width={44} height={44} />
          {!collapsed && (
            <h2 className="text-2xl font-semibold text-slate-900">Archr</h2>
          )}
        </div>
        <button
          type="button"
          onClick={onToggle}
          className={`absolute right-0 inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 ${
            collapsed ? "opacity-0 group-hover:opacity-100" : "opacity-100"
          }`}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <HugeiconsIcon
            icon={SidebarRight01Icon}
            className={`h-6 w-6 transition-transform ${collapsed ? "" : "rotate-180"}`}
          />
        </button>
      </div>

      <hr className="border-slate-200 mt-4" />

      <nav className="mt-10 flex flex-1 flex-col gap-3 text-base">
        {navItems.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => onTabChange(item)}
            className={`flex items-center gap-4 rounded-xl px-4 py-3.5 text-left text-sm font-medium transition hover:cursor-pointer ${
              item === activeTab
                ? "bg-blue-50 text-blue-600 ring-1 ring-inset ring-blue-200"
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            {item === "Home" ? (
              <HugeiconsIcon icon={Home04Icon} className="h-4 w-4 shrink-0" />
            ) : item === "Events" ? (
              <HugeiconsIcon
                icon={Calendar01Icon}
                className="h-4 w-4 shrink-0"
              />
            ) : (
              <HugeiconsIcon
                icon={TaskDaily02Icon}
                className="h-4 w-4 shrink-0"
              />
            )}
            {!collapsed && item}
          </button>
        ))}
      </nav>

      <div className="relative mb-6" ref={profileMenuRef}>
        {isProfileMenuOpen && (
          <div
            className={`absolute bottom-full mb-2 rounded-xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-200/60 ${
              collapsed ? "left-1/2 w-44 -translate-x-1/2" : "left-0 right-0"
            }`}
          >
            <button
              type="button"
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="w-full rounded-lg px-3 py-2 text-left text-sm text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 hover:cursor-pointer"
            >
              {isSigningOut ? "Logging out..." : "Log out"}
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={() => setIsProfileMenuOpen((prev) => !prev)}
          className={`flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500 transition hover:border-slate-300 hover:bg-slate-100 hover:cursor-pointer ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-semibold text-blue-600 ring-1 ring-blue-200">
            {displayName.trim().charAt(0).toUpperCase()}
          </div>
          {!collapsed && (
            <div className="text-left overflow-hidden">
              <p className="font-medium text-slate-800 truncate">
                {displayName}
              </p>
              <p className="mt-0.5 truncate text-slate-400">{email}</p>
            </div>
          )}
        </button>
      </div>
    </aside>
  );
}
