"use client";

import { supabase } from "@/lib/supabase";
import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });

    setIsLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    router.push("/onboarding");
  };

  const handleGoogleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/onboarding`,
        scopes: "https://www.googleapis.com/auth/calendar",
        queryParams: {
          access_type: "offline",
          prompt: "consent",
          include_granted_scopes: "true",
        },
      },
    });
    if (error) setError(error.message);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 px-4 py-12">
      {/* Subtle background */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.06),transparent_50%)]" />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(59,130,246,0.06),transparent_50%)]" />

      <div className="relative w-full max-w-sm">
        {/* Card */}
        <div className="rounded-2xl border border-slate-200/80 bg-white px-8 py-10 shadow-xl shadow-slate-200/60">
          {/* Logo mark */}
          <div className="flex flex-col items-center gap-3 mb-8">
            <Image src="/Logo.png" alt="Archr" width={45} height={45} />
            <div className="text-center">
              <h1 className="text-xl font-semibold text-slate-900">
                Create your account
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Start organizing your schedule with AI.
              </p>
            </div>
          </div>

          {/* Google */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 hover:border-slate-300 hover:cursor-pointer active:scale-[0.98]"
          >
            <Image src="/Google.png" alt="Google" width={17} height={17} />
            Continue with Google
          </button>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <span className="h-px flex-1 bg-slate-200" />
            <span className="text-xs text-slate-400">
              or sign up with email
            </span>
            <span className="h-px flex-1 bg-slate-200" />
          </div>

          {/* Form */}
          <form onSubmit={handleSignUp} className="flex flex-col gap-4">
            {/* Name */}
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center">
                <svg
                  className="h-4 w-4 text-slate-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.75}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                  />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-400/20 transition"
                required
              />
            </div>

            {/* Email */}
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center">
                <svg
                  className="h-4 w-4 text-slate-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.75}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                  />
                </svg>
              </div>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-400/20 transition"
                required
              />
            </div>

            {/* Password */}
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center">
                <svg
                  className="h-4 w-4 text-slate-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.75}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                  />
                </svg>
              </div>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-400/20 transition"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600 transition"
                tabIndex={-1}
              >
                {showPassword ? (
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.75}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                    />
                  </svg>
                ) : (
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.75}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                )}
              </button>
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-xs text-red-600">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="mt-1 w-full rounded-xl bg-linear-to-b from-blue-400 via-blue-500 to-blue-600 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 active:scale-[0.98] disabled:opacity-60 hover:cursor-pointer disabled:cursor-not-allowed"
            >
              {isLoading ? "Creating account…" : "Create account"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-500">
            Already have an account?{" "}
            <a
              href="/login"
              className="font-semibold text-blue-600 hover:text-blue-500 transition"
            >
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
