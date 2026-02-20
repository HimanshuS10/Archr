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
  SidebarRight01Icon
} from "@hugeicons/core-free-icons";


const navItems = ["Home", "Events", "Tasks"];

type SidebarProps = {
  collapsed: boolean;
  onToggle: () => void;
  onHoverOpen: () => void;
  onHoverClose: () => void;
};

export default function Sidebar({
  collapsed,
  onToggle,
  onHoverOpen,
  onHoverClose,
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
      className={`fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-white/10 bg-black py-2 text-white transition-all duration-300 ${
        collapsed ? "w-[70px] px-3" : "w-[260px] px-6"
      }`}
    >
      <div className="relative flex items-center justify-center">
        <div
          className={`flex items-center gap-3 ${collapsed ? "" : "pr-12"}`}
          onMouseEnter={() => collapsed && onHoverOpen()}
          onMouseLeave={() => collapsed && onHoverClose()}
        >
          <Image src="/Logo.png" alt="Archr logo" width={44} height={44} />
          {!collapsed && (
            <div>
              <h2 className="text-2xl font-semibold text-white">Archr</h2>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-0 inline-flex h-8 w-8 items-center justify-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <HugeiconsIcon
            icon={SidebarRight01Icon}
            className={`text-white h-6 w-6 transition-transform ${
              collapsed ? "" : "rotate-180"
            }`}
          />
        </button>
      </div>

      <hr className="border-white/10 mt-4" />

      <nav className="mt-10 flex flex-1 flex-col gap-3 text-base">
        {navItems.map((item, index) => (
          <button
            key={item}
            type="button"
            className={`flex items-center gap-4 rounded-xl px-4 py-3.5 text-left transition ${
              index === 0
                ? "bg-blue-500/15 text-blue-200 ring-1 ring-inset ring-blue-400/30"
                : "text-white/70 hover:bg-white/5 hover:text-white"
            }`}
          >
            {item === "Home" ? (
              <HugeiconsIcon icon={Home04Icon} className="h-4 w-4" />
            ) : item === "Events" ? (
              <HugeiconsIcon icon={Calendar01Icon} className="h-4 w-4" />
            ) : (
              <HugeiconsIcon icon={TaskDaily02Icon} className="h-4 w-4" />
            )}
            {!collapsed && item}
          </button>
        ))}
      </nav>

      <div className="relative mb-6" ref={profileMenuRef}>
        {isProfileMenuOpen && (
          <div
            className={`absolute bottom-full mb-2 rounded-xl border border-white/10 bg-[#0b0d16] p-2 shadow-xl shadow-black/30 ${
              collapsed ? "left-1/2 w-44 -translate-x-1/2" : "left-0 right-0"
            }`}
          >
            <button
              type="button"
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="w-full rounded-lg px-3 py-2 text-left text-sm text-red-300 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-60 hover:cursor-pointer"
            >
              {isSigningOut ? "Logging out..." : "Log out"}
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={() => setIsProfileMenuOpen((prev) => !prev)}
          className={`flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4 text-xs text-white/60 transition hover:border-white/20 hover:bg-white/10 ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-500/20 text-sm font-semibold text-blue-200">
            {displayName.trim().charAt(0).toUpperCase()}
          </div>
          {!collapsed && (
            <div className="text-left">
              <p className="text-white/80">{displayName}</p>
              <p className="mt-1">{email}</p>
            </div>
          )}
        </button>
      </div>
    </aside>
  );
}
