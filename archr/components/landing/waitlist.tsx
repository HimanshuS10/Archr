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
        throw new Error("Failed to add email");
      }

      setSuccess("Email added to waitlist!");
      setEmail("");
    } catch (err) {
      console.error(err);
      setError("Failed to add email to waitlist");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="w-full bg-white py-24 px-4 md:px-8 flex justify-center">
      <div className="w-full max-w-lg bg-white rounded-[2rem] p-8 md:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col items-center">

        {/* Badge */}
        <div className="w-fit px-4 py-1.5 bg-white border border-gray-200 rounded-full shadow-sm mb-6">
          <span className="text-gray-500 text-sm font-medium tracking-tight">
            Waitlist
          </span>
        </div>

        {/* Heading */}
        <h2 className="text-4xl md:text-5xl font-medium tracking-tight text-center mb-10 text-gray-900">
          Join the Waitlist
        </h2>

        {/* Form */}
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-6">

          <div>
            <label className="block text-gray-600 text-sm mb-2">
              Email
            </label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#FAFAFC] border border-gray-100 rounded-xl px-4 py-3.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all"
              required
            />
          </div>

          <div className="mt-4 flex justify-center">
            <button
              type="submit"
              disabled={loading}
              className={`bg-[#333333] hover:bg-black text-white px-12 py-3.5 rounded-full font-medium transition-all shadow-md hover:shadow-lg ${
                loading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {loading ? "Submitting..." : "Join Waitlist"}
            </button>
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}
          {success && (
            <p className="text-green-500 text-sm text-center">{success}</p>
          )}

        </form>
      </div>
    </section>
  );
}