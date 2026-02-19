"use client";

import { supabase } from "@/lib/supabase";
import { useState } from "react";
import Image from "next/image";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });

    setIsLoading(false);

    if (error) console.log(error);
    else console.log("User was created");
  };

  const handleGoogleSignIn = async () => {
    const redirectTo = `${window.location.origin}/onboarding`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        scopes: "https://www.googleapis.com/auth/calendar",
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });

    if (error) {
      console.error("Google Error sign in");
    }
  };

  return (
    <div className="h-screen w-full bg-[#05060f] text-white flex items-center justify-center overflow-hidden">
      <div className="grid h-full w-full max-w-6xl grid-cols-1 gap-6 px-6 py-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-stretch">
        <div className="relative flex h-full flex-col items-center justify-center rounded-3xl border border-white/10 bg-[#0a0b12] p-8 overflow-hidden text-center max-[992px]:hidden">
          {/* Background layers */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_120%,rgba(59,130,246,0.25),transparent_55%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.25),transparent_55%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(148,163,184,0.18)_1px,transparent_1px)] bg-size-[18px_18px] opacity-40" />
          <div className="absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent" />

          {/* Foreground content */}
          <div className="relative flex flex-col items-center justify-center gap-4">
            {/* Logo */}
            <div className="inline-flex items-center gap-3 rounded-full px-4 py-2">
              <Image src="/Logo.png" alt="Archr logo" width={55} height={55} />
              <span className="text-2xl font-semibold text-white">Archr</span>
            </div>

            {/* Welcome text */}
            <h1 className="mt-4 text-2xl font-bold text-white sm:text-3xl">
              Welcome to Archr!
            </h1>
            <p className="mt-2 max-w-xs text-sm text-white/70 sm:text-base">
              Take control of your time and let our AI-powered assistant
              organize your schedule effortlessly.
            </p>
          </div>
        </div>

        {/* Right Sign Up Form */}
        <div className="flex h-full items-center justify-center">
          <div className="h-full w-full max-w-md rounded-3xl border border-white/10 bg-[#0b0d16] p-6 backdrop-blur-md lg:max-w-none">
            <h2 className="text-2xl font-semibold">Sign Up</h2>
            <p className="mt-1 text-sm text-white/60">
              Create your account to get early access.
            </p>

            <div className="mt-4 grid gap-2">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/80 transition hover:border-white/30 hover:cursor-pointer"
              >
                <Image
                  src="/Google.png"
                  alt="Archr logo"
                  width={17}
                  height={17}
                />
                Continue with Google
              </button>
            </div>

            <div className="my-4 flex items-center gap-3 text-xs text-white/40">
              <span className="h-px flex-1 bg-white/10" /> or{" "}
              <span className="h-px flex-1 bg-white/10" />
            </div>

            <form onSubmit={handleSignUp} className="grid gap-3">
              <div className="grid gap-1">
                <label className="text-xs uppercase tracking-[0.3em] text-white/50">
                  Name
                </label>
                <input
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="rounded-full border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  required
                />
              </div>
              <div className="grid gap-1">
                <label className="text-xs uppercase tracking-[0.3em] text-white/50">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-full border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  required
                />
              </div>
              <div className="grid gap-1">
                <label className="text-xs uppercase tracking-[0.3em] text-white/50">
                  Password
                </label>
                <input
                  type="password"
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="rounded-full border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`rounded-full bg-linear-to-b from-blue-400 via-blue-500 to-blue-600 px-6 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 ring-1 ring-inset ring-white/20 transition hover:from-blue-300 hover:via-blue-400 hover:to-blue-500 hover:cursor-pointer ${
                  isLoading ? "opacity-60 cursor-not-allowed" : ""
                }`}
              >
                {isLoading ? "Creating account..." : "Sign up"}
              </button>
            </form>

            <p className="mt-4 text-center text-xs text-white/50">
              Already have an account?{" "}
              <a className="text-blue-300 hover:text-blue-200" href="/login">
                Log in
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
