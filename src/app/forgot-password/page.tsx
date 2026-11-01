
"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, LoaderCircle } from "lucide-react";
import { useState, type FormEvent } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/password-reset/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
        }),
      });

      const data = (await response.json()) as {
        message?: string;
        error?: string;
      };

      if (!response.ok) {
        setError(
          data.error ??
            "We couldn't process your request. Please try again later.",
        );
        return;
      }

      setSubmitted(true);
    } catch {
      setError("A network error occurred. Please check your connection.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md">
        <Link
          href="/login"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-blue-700"
        >
          <ArrowLeft size={17} />
          Back to Sign In
        </Link>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-7 text-center">
            <Image src="/icons/icon-512.png" alt="The Word Ministries International logo" width={72} height={72} priority className="mx-auto mb-4 h-[72px] w-[72px] rounded-2xl object-contain" />

            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
              {submitted ? "Check your email" : "Forgot your password?"}
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              {submitted
                ? "If an eligible account exists for that email, a password-reset link will be sent."
                : "Enter the email address associated with your Word Ministries account. We'll send you instructions to reset your password."}
            </p>
          </div>

          {submitted ? (
            <div className="space-y-5">
              <div
                role="status"
                className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm leading-6 text-green-800"
              >
                Check your inbox and spam folder for the reset email. If you
                don't receive it, verify the address and try again later.
              </div>

              <button
                type="button"
                onClick={() => {
                  setSubmitted(false);
                  setError("");
                }}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                Try another email
              </button>

              <Link
                href="/login"
                className="flex w-full items-center justify-center rounded-xl bg-blue-700 px-4 py-3.5 text-sm font-bold text-white transition hover:bg-blue-800"
              >
                Return to Sign In
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="mb-1.5 block text-sm font-semibold text-slate-700"
                >
                  Email address
                </label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  maxLength={254}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              {error && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700"
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-3.5 text-sm font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting && (
                  <LoaderCircle size={18} className="animate-spin" />
                )}
                {isSubmitting ? "Sending request..." : "Send Reset Link"}
              </button>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-slate-600">
            Remember your password?{" "}
            <Link
              href="/login"
              className="font-bold text-blue-700 hover:text-blue-900"
            >
              Sign in
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
