"use client";

import { useEffect, useRef, useState } from "react";

export default function Waitlist() {
  const [email, setEmail] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSocials, setShowSocials] = useState(false);
  const loadedAt = useRef(Date.now());

  useEffect(() => {
    loadedAt.current = Date.now();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!email) {
      setError("Email is required");
      return;
    }

    // Silently reject if honeypot filled (bot)
    if (honeypot) {
      setShowSocials(true);
      setEmail("");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          _t: Date.now() - loadedAt.current,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to add email");
      }

      setEmail("");
      setShowSocials(true);
    } catch (err: any) {
      setError(err.message ?? "Failed to add email to waitlist");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="waitlist" className="w-full bg-white pb-15 px-4 md:px-8 flex justify-center">
      <div className="w-full max-w-lg bg-white rounded-[2rem] p-8 md:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col items-center">

        <div className="w-fit px-4 py-1.5 bg-white border border-gray-200 rounded-full shadow-sm mb-6">
          <span className="text-gray-500 text-sm font-medium tracking-tight">
            Waitlist
          </span>
        </div>

        <h2 className="text-4xl md:text-5xl font-medium tracking-tight text-center mb-10 text-gray-900">
          Join the Waitlist
        </h2>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-6">

          <div>
            <label className="block text-gray-600 text-sm mb-2">Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#FAFAFC] border border-gray-100 rounded-xl px-4 py-3.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all"
              required
            />
          </div>

          {/* Honeypot -- invisible to real users, bots auto-fill it */}
          <input
            type="text"
            name="company_url"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="absolute -left-[9999px] h-0 w-0 overflow-hidden opacity-0"
          />

          <div className="mt-4 flex justify-center">
            <button
              type="submit"
              disabled={loading}
              className={`bg-[#333333] hover:bg-black hover:cursor-pointer text-white px-12 py-3.5 rounded-full font-medium transition-all shadow-md hover:shadow-lg ${
                loading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {loading ? "Submitting..." : "Join Waitlist"}
            </button>
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}
        </form>
      </div>

      {/* ── Social media popup after successful submit ── */}
      {showSocials && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-gray-100 bg-white p-8 shadow-xl text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-50">
              <svg className="h-7 w-7 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <h3 className="text-xl font-semibold text-gray-900">You&apos;re on the list!</h3>
            <p className="mt-2 text-sm text-gray-500">
              Follow us for updates and behind the scenes content!
            </p>

            <div className="mt-6 flex items-center justify-center gap-4">
              {/* TikTok */}
              <a
                href="https://www.tiktok.com/@codewithheman"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex h-12 w-12 items-center justify-center rounded-full border border-gray-200 bg-white transition hover:border-gray-900 hover:bg-gray-900"
              >
                <svg className="h-5 w-5 text-gray-700 group-hover:text-white transition" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.75a8.18 8.18 0 004.76 1.52V6.84a4.84 4.84 0 01-1-.15z" />
                </svg>
              </a>

              {/* Instagram */}
              <a
                href="https://www.instagram.com/codewithheman_/"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex h-12 w-12 items-center justify-center rounded-full border border-gray-200 bg-white transition hover:border-gray-900 hover:bg-gray-900"
              >
                <svg className="h-5 w-5 text-gray-700 group-hover:text-white transition" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
              </a>
            </div>

            <button
              type="button"
              onClick={() => setShowSocials(false)}
              className="mt-6 rounded-full bg-gray-900 px-8 py-2.5 text-sm font-medium text-white transition hover:bg-black"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </section>
  );
}