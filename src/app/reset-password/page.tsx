
"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  LoaderCircle,
  ShieldCheck,
} from "lucide-react";
import { Suspense, useEffect, useRef, useState, type FormEvent } from "react";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const [token] = useState(() => searchParams.get("token") ?? "");

  useEffect(() => {
    if (!token) return;

    const url = new URL(window.location.href);
    url.searchParams.delete("token");

    window.history.replaceState(
      window.history.state,
      "",
      `${url.pathname}${url.search}${url.hash}`,
    );
  }, [token]);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submissionStarted = useRef(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submissionStarted.current) return;
    setError("");

    if (!token) {
      setError(
        "Your reset link is missing its token. Please request a new password-reset link.",
      );
      return;
    }

    if (password.length < 12 || password.length > 128) {
      setError("Your password must be between 12 and 128 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Your passwords do not match.");
      return;
    }

    submissionStarted.current = true;
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/password-reset/confirm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, password }),
      });

      const data = (await response.json()) as {
        message?: string;
        error?: string;
      };

      if (!response.ok) {
        setError(
          data.error ??
            "Unable to reset your password. Please request a new reset link.",
        );
        return;
      }

      setSuccess(true);
      setPassword("");
      setConfirmPassword("");
    } catch {
      setError("A network error occurred. Please try again.");
    } finally {
      submissionStarted.current = false;
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
              {success ? "Password reset successful" : "Create a new password"}
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              {success
                ? "Your password has been updated. You can now sign in with your new password."
                : "Choose a new password for your Word Ministries account."}
            </p>
          </div>

          {success ? (
            <div className="space-y-5">
              <div
                role="status"
                className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm leading-6 text-green-800"
              >
                Your password has been changed successfully. Your reset link
                can no longer be used.
              </div>

              <Link
                href="/login"
                className="flex w-full items-center justify-center rounded-xl bg-blue-700 px-4 py-3.5 text-sm font-bold text-white transition hover:bg-blue-800"
              >
                Continue to Sign In
              </Link>
            </div>
          ) : !token ? (
            <div className="space-y-5">
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700"
              >
                This reset link is missing its token. Request a new link to
                continue.
              </div>

              <Link
                href="/forgot-password"
                className="flex w-full items-center justify-center rounded-xl bg-blue-700 px-4 py-3.5 text-sm font-bold text-white transition hover:bg-blue-800"
              >
                Request a New Reset Link
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="password"
                  className="mb-1.5 block text-sm font-semibold text-slate-700"
                >
                  New password
                </label>

                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    minLength={12}
                    maxLength={128}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your new password"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute inset-y-0 right-0 flex items-center px-4 text-slate-500 hover:text-blue-700"
                  >
                    {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                  </button>
                </div>

                <p className="mt-1.5 text-xs text-slate-500">
                  Use between 12 and 128 characters.
                </p>
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-1.5 block text-sm font-semibold text-slate-700"
                >
                  Confirm new password
                </label>

                <div className="relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    minLength={12}
                    maxLength={128}
                    value={confirmPassword}
                    onChange={(event) =>
                      setConfirmPassword(event.target.value)
                    }
                    placeholder="Re-enter your new password"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword((current) => !current)
                    }
                    aria-label={
                      showConfirmPassword
                        ? "Hide confirmation password"
                        : "Show confirmation password"
                    }
                    className="absolute inset-y-0 right-0 flex items-center px-4 text-slate-500 hover:text-blue-700"
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={19} />
                    ) : (
                      <Eye size={19} />
                    )}
                  </button>
                </div>
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
                {isSubmitting ? "Resetting password..." : "Reset Password"}
              </button>
            </form>
          )}

          {!success && (
            <p className="mt-6 text-center text-sm text-slate-600">
              Remember your password?{" "}
              <Link
                href="/login"
                className="font-bold text-blue-700 hover:text-blue-900"
              >
                Sign in
              </Link>
            </p>
          )}
        </section>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
          <p className="text-sm text-slate-600">Loading password reset...</p>
        </main>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
