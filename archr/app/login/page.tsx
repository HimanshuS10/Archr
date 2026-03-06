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
        queryParams: { access_type: "offline" },
      },
    });

    if (error) {
      console.error("Google sign-in error:", error.message);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-[#f5f5f5]">
      {/* Left panel — decorative */}
      <div className="relative hidden w-[55%] overflow-hidden lg:flex lg:flex-col lg:items-center lg:justify-center">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(59,130,246,0.08),transparent_60%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(99,102,241,0.06),transparent_50%)]" />

        <div className="relative z-10 flex flex-col items-center gap-8 px-12 text-center">
          <a href="/" className="inline-flex items-center gap-3">
            <Image src="/Logo.png" alt="Archr" width={48} height={48} />
            <span className="text-3xl font-semibold tracking-tight text-black">
              Archr
            </span>
          </a>

          <h1 className="max-w-md text-4xl leading-tight font-semibold tracking-tight text-black">
            Pick up right
            <br />
            <span className="text-blue-600">where you left off.</span>
          </h1>

          <p className="max-w-sm text-base leading-relaxed text-black/55">
            Your AI-powered schedule is waiting. Sign in to keep your
            productivity on track.
          </p>

          {/* Activity card */}
          <div className="mt-4 w-full max-w-xs rounded-2xl border border-black/5 bg-white p-5 shadow-[0_12px_40px_rgba(0,0,0,0.06)]">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-medium text-black/40">
                This week
              </span>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">
                +12% focus time
              </span>
            </div>
            <div className="flex items-end gap-1.5">
              {[40, 65, 50, 80, 72, 90, 60].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t-md bg-blue-100 transition"
                  style={{ height: `${h}px` }}
                >
                  {i === 5 && (
                    <div
                      className="rounded-t-md bg-blue-500"
                      style={{ height: `${h}px` }}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="mt-2 flex justify-between text-[10px] text-black/30">
              {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                <span key={i} className="flex-1 text-center">
                  {d}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="flex w-full items-center justify-center px-6 py-12 lg:w-[45%]">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <Image src="/Logo.png" alt="Archr" width={32} height={32} />
            <span className="text-xl font-semibold text-black">Archr</span>
          </div>

          <h2 className="text-3xl font-semibold tracking-tight text-black">
            Welcome back
          </h2>
          <p className="mt-2 text-sm text-black/50">
            Log in to your account to continue.
          </p>

          {/* Google */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="mt-8 flex w-full cursor-pointer items-center justify-center gap-3 rounded-2xl border border-black/10 bg-white px-4 py-3.5 text-sm font-medium text-black/80 shadow-sm transition hover:border-black/20 hover:shadow-md"
          >
            <Image src="/Google.png" alt="Google" width={18} height={18} />
            Continue with Google
          </button>

          {/* Divider */}
          <div className="my-6 flex items-center gap-4">
            <span className="h-px flex-1 bg-black/10" />
            <span className="text-xs text-black/35">or continue with email</span>
            <span className="h-px flex-1 bg-black/10" />
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-black/50">
                Email
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm text-black placeholder:text-black/30 shadow-sm transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                required
              />
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-xs font-medium text-black/50">
                  Password
                </label>
                <a
                  href="#"
                  className="text-xs text-blue-600 transition hover:text-blue-700"
                >
                  Forgot password?
                </a>
              </div>
              <input
                type="password"
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm text-black placeholder:text-black/30 shadow-sm transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full cursor-pointer rounded-xl bg-black px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-black/85 ${
                isLoading ? "cursor-not-allowed opacity-60" : ""
              }`}
            >
              {isLoading ? "Signing in…" : "Log in"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-black/40">
            Don&apos;t have an account?{" "}
            <a
              className="font-medium text-blue-600 transition hover:text-blue-700"
              href="/signup"
            >
              Sign up
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
