"use client";

import { useState } from "react";


export default function Waitlist() {

  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email) {
      setError("Email is required");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      if (!response.ok) {
        throw new Error("Failed to add email to waitlist");
      }
      setSuccess("Email added to waitlist");
    } catch (error) {
      setError("Failed to add email to waitlist");
      console.error(error);
    } finally {
      setLoading(false);
    }

  };



  return (
    <section
      id="waitlist"
      className="relative bg-[#060b1a] px-6 pb-32 text-white z-30"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.25),transparent_55%)]" />
        <div className="absolute inset-x-0 top-0 h-40 bg-linear-to-b from-[#060b1a] to-transparent" />
      </div>

      <div className="relative mx-auto w-full max-w-4xl text-center">
        <p className="text-xs uppercase tracking-[0.4em] text-white/50">
          Waitlist
        </p>
        <h2 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">
          Get early access to Archr.
        </h2>
        <p className="mt-4 text-base text-white/70 sm:text-lg">
          Join the waitlist and be the first to try AI-powered scheduling for
          students.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-8 flex w-full flex-col items-center gap-3 sm:flex-row sm:justify-center"
        >
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full max-w-md rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm text-white placeholder:text-white/40 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className={`w-full max-w-[200px] rounded-full bg-linear-to-b from-blue-400 via-blue-500 to-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 ring-1 ring-inset ring-white/20 transition hover:from-blue-300 hover:via-blue-400 hover:to-blue-500 [box-shadow:inset_0_2px_6px_rgba(255,255,255,0.25),inset_0_-6px_10px_rgba(0,0,0,0.25),0_12px_30px_rgba(59,130,246,0.35)] ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {loading ? "Adding to waitlist..." : "Join waitlist"}
          </button>
        </form>
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        {success && <p className="text-green-500 text-sm mt-2">{success}</p>}
      </div>
    </section>
  );
}
