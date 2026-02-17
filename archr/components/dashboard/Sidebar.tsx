"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Home04Icon,
  Calendar01Icon,
  TaskDaily02Icon,
  SidebarLeft01Icon,
  SidebarRight01Icon
} from "@hugeicons/core-free-icons";


const navItems = ["Home", "Calendar", "Tasks"];

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
  const [displayName, setDisplayName] = useState("User");
  const [email, setEmail] = useState("user@email.com");

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

  return (
    <aside
      className={`fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-white/10 bg-black py-8 text-white transition-all duration-300 ${
        collapsed ? "w-[70px] px-3" : "w-[260px] px-6"
      }`}
    >
      <div className="flex items-center justify-between">
        <div
          className="flex items-center gap-3"
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
          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <HugeiconsIcon icon={SidebarRight01Icon} className="text-white h-6 w-6" /> : <HugeiconsIcon icon={SidebarLeft01Icon} className="text-white h-6 w-6" />}
        </button>
      </div>

      <hr className="border-white/10" />

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
            ) : item === "Calendar" ? (
              <HugeiconsIcon icon={Calendar01Icon} className="h-4 w-4" />
            ) : (
              <HugeiconsIcon icon={TaskDaily02Icon} className="h-4 w-4" />
            )}
            {!collapsed && item}
          </button>
        ))}
      </nav>

      <div
        className={`flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4 text-xs text-white/60 ${
          collapsed ? "justify-center" : ""
        }`}
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-500/20 text-sm font-semibold text-blue-200">
          {displayName.trim().charAt(0).toUpperCase()}
        </div>
        {!collapsed && (
          <div>
            <p className="text-white/80">{displayName}</p>
            <p className="mt-1">{email}</p>
          </div>
        )}
      </div>
    </aside>
  );
}
