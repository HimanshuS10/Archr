import Image from "next/image";

const navItems = [
  "Overview",
  "Calendar",
  "Tasks",
  "Courses",
  "Insights",
  "Settings",
];

export default function Sidebar() {
  return (
    <aside className="flex h-full w-full max-w-[260px] flex-col border-r border-white/10 bg-black px-6 py-8 text-white">
      <div className="flex items-center gap-3">
        <Image src="/Logo.png" alt="Archr logo" width={36} height={36} />
        <div>
          <h2 className="text-lg font-semibold text-white">Archr</h2>
        </div>
      </div>

      <nav className="mt-10 flex flex-1 flex-col gap-2 text-sm">
        {navItems.map((item, index) => (
          <button
            key={item}
            type="button"
            className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left transition ${
              index === 0
                ? "bg-blue-500/15 text-blue-200 ring-1 ring-inset ring-blue-400/30"
                : "text-white/70 hover:bg-white/5 hover:text-white"
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-blue-400/70" />
            {item}
          </button>
        ))}
      </nav>

      <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-xs text-white/60">
        <p className="text-white/80">Placeholder</p>
        <p className="mt-1">Upgrade or add widgets here.</p>
      </div>
    </aside>
  );
}