import Image from "next/image";

export default function Footer() {
  return (
    <footer className="relative bg-[#060b1a] px-6 pb-10 text-white z-30">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-0 top-0 h-24 bg-linear-to-b from-[#060b1a] to-transparent" />
      </div>

      <div className="relative mx-auto w-full max-w-6xl border-t border-white/10 pt-10">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <Image src="/Logo.png" alt="Archr" width={40} height={40} />
            <span className="text-2xl font-bold">Archr</span>
          </div>

          <p className="text-xs text-white/50">
            © {new Date().getFullYear()} Archr. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
