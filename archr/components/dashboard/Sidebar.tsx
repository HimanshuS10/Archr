"use client";

import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Home04Icon,
  Calendar01Icon,
  TaskDaily02Icon,
} from "@hugeicons/core-free-icons";

const navItems = ["Home", "Calendar", "Tasks"];

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-[260px] flex-col border-r border-white/10 bg-black px-6 py-8 text-white">
      <div className="flex items-center gap-3 mx-auto mb-5">
        <Image src="/Logo.png" alt="Archr logo" width={55} height={55} />
        <div>
          <h2 className="text-3xl font-semibold text-white">Archr</h2>
        </div>
      </div>

      <hr className="border-white/10" />

      <nav className="mt-10 flex flex-1 flex-col gap-3 text-base">
        {navItems.map((item, index) => (
          <button
            key={item}
            type="button"
            className={`flex items-center gap-4 rounded-xl px-5 py-3.5 text-left transition ${
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
            {item}
          </button>
        ))}
      </nav>

      <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-xs text-white/60">
        <p className="text-white/80">User Name</p>
        <p className="mt-1">user@email.com</p>
      </div>
    </aside>
  );
}
