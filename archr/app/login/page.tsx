"use client";

import { supabase } from "@/lib/supabase";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setIsLoading(false);

    if (error) console.log(error);
    else router.push("/dashboard");
  };

  const handleGoogleSignIn = async () => {
    const redirectTo = `${window.location.origin}/auth/callback?next=/dashboard`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        scopes: "https://www.googleapis.com/auth/calendar",
        queryParams: {
          access_type: "offline",
          prompt: "consent",
          include_granted_scopes: "true",
        },
      },
    });

    if (error) {
      console.error("Google sign-in error:", error.message);
    }
  };

  return (
    <div className="max-h-screen w-full bg-white text-slate-900 flex items-center justify-center overflow-hidden">
      <div className="grid h-full w-full max-w-6xl grid-cols-1 gap-6 px-6 py-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-stretch">
        <div className="relative flex h-full flex-col items-center justify-center rounded-3xl border border-slate-100 bg-slate-50 p-8 overflow-hidden text-center max-[992px]:hidden">
          {/* Background layers */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_120%,rgba(59,130,246,0.15),transparent_55%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.15),transparent_55%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(148,163,184,0.1)_1px,transparent_1px)] bg-size-[18px_18px]" />

          {/* Foreground content */}
          <div className="relative flex flex-col items-center justify-center gap-4">
            {/* Logo */}
            <div className="inline-flex items-center gap-3 rounded-full px-4 py-2">
              <Image src="/Logo.png" alt="Archr logo" width={55} height={55} />
              <span className="text-2xl font-semibold text-slate-900">Archr</span>
            </div>

            {/* Welcome text */}
            <h1 className="mt-4 text-2xl font-bold text-slate-900 sm:text-3xl">
              Welcome back!
            </h1>
            <p className="mt-2 max-w-xs text-sm text-slate-600 sm:text-base">
              Pick up right where you left off. Your AI-powered schedule is
              waiting for you.
            </p>
          </div>
        </div>

        <div className="flex h-full items-center justify-center text-slate-900">
          <div className="h-full w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-xl lg:max-w-none">
            <h2 className="text-2xl font-semibold text-slate-900">Log In</h2>
            <p className="mt-1 text-sm text-slate-500">
              Sign in to your account to continue.
            </p>

            <div className="mt-6 grid gap-2">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-900 hover:cursor-pointer shadow-sm"
              >
                <Image
                  src="/Google.png"
                  alt="Google logo"
                  width={18}
                  height={18}
                />
                Continue with Google
              </button>
            </div>

            <div className="my-6 flex items-center gap-3 text-xs text-slate-400">
              <span className="h-px flex-1 bg-slate-200" /> or{" "}
              <span className="h-px flex-1 bg-slate-200" />
            </div>

            <form onSubmit={handleLogin} className="grid gap-4">
              <div className="grid gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  required
                />
              </div>
              <div className="grid gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Password
                  </label>
                  <a
                    href="#"
                    className="text-xs text-blue-600 transition hover:text-blue-500"
                  >
                    Forgot password?
                  </a>
                </div>
                <input
                  type="password"
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`mt-2 rounded-full bg-linear-to-b from-blue-500 via-blue-600 to-blue-700 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 ring-1 ring-inset ring-white/20 transition hover:from-blue-400 hover:via-blue-500 hover:to-blue-600 hover:cursor-pointer ${isLoading ? "opacity-60 cursor-not-allowed" : ""
                  }`}
              >
                {isLoading ? "Signing in..." : "Log in"}
              </button>
            </form>

            <p className="mt-6 text-center text-xs text-slate-500">
              Don&apos;t have an account?{" "}
              <a className="font-semibold text-blue-600 hover:text-blue-500" href="/signup">
                Sign up
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
