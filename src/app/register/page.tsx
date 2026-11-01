
"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  LoaderCircle,
  Mail,
  ShieldCheck,
  MessageCircle,
  Clock,
} from "lucide-react";

type RegistrationStage = "register" | "verify";

const RESEND_COOLDOWN_SECONDS = 60;

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [code, setCode] = useState("");
  const [stage, setStage] = useState<RegistrationStage>("register");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);

  useEffect(() => {
    if (resendCountdown <= 0) return;

    const timer = window.setTimeout(() => {
      setResendCountdown((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [resendCountdown]);

  async function handleRegistration(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");

    if (password !== confirmPassword) {
      setError("Your passwords do not match.");
      return;
    }

    if (password.length < 12 || password.length > 128) {
      setError("Your password must contain between 12 and 128 characters.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error ?? "Registration failed. Please try again.");
        if (response.status === 429 && result.retryAfterSeconds) {
          setNotice(
            `Please wait ${result.retryAfterSeconds} seconds before trying again.`,
          );
        }
        return;
      }

      setStage("verify");
      setCode("");
      setResendCountdown(RESEND_COOLDOWN_SECONDS);
      setNotice(
        "Check your email for the six-digit verification code. WhatsApp delivery is not yet configured.",
      );
    } catch {
      setError(
        "Unable to connect. Check your internet connection and try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleVerification(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");

    if (!/^\d{6}$/.test(code)) {
      setError("Enter the six-digit verification code.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/verification/email/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          code,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error ?? "Verification failed. Please try again.");
        return;
      }

      router.push("/login?registered=true");
    } catch {
      setError(
        "Unable to connect. Check your internet connection and try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResendCode() {
    if (resendCountdown > 0 || isResending || isSubmitting) return;

    setError("");
    setNotice("");
    setIsResending(true);

    try {
      const response = await fetch("/api/verification/email/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        const retryAfter = Number(result.retryAfterSeconds);

        if (response.status === 429 && retryAfter > 0) {
          setResendCountdown(retryAfter);
          setError(
            result.error ?? "Too many requests. Please wait before retrying.",
          );
        } else {
          setError(
            result.error ?? "Unable to resend the code. Please try again.",
          );
        }
        return;
      }

      setResendCountdown(RESEND_COOLDOWN_SECONDS);
      setCode("");
      setNotice(
        "If your registration is still eligible, a new verification code has been requested. Check your email and spam folder.",
      );
    } catch {
      setError("Unable to connect. Please try again.");
    } finally {
      setIsResending(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-blue-700"
        >
          <ArrowLeft size={17} />
          Back to Home
        </Link>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-7 text-center">
            <Image src="/icons/icon-512.png" alt="The Word Ministries International logo" width={72} height={72} priority className="mx-auto mb-4 h-[72px] w-[72px] rounded-2xl object-contain" />

            {stage === "register" ? (
              <>
                <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
                  Create your account
                </h1>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Join The Word Ministries International community.
                </p>
              </>
            ) : (
              <>
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-700">
                  <Mail size={24} />
                </div>
                <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
                  Verify your email
                </h1>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Enter the six-digit code sent to{" "}
                  <span className="font-semibold text-slate-800">{email}</span>.
                </p>
              </>
            )}
          </div>

          {stage === "register" ? (
            <form onSubmit={handleRegistration} className="space-y-5">
              <div>
                <label
                  htmlFor="name"
                  className="mb-1.5 block text-sm font-semibold text-slate-700"
                >
                  Full name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  minLength={2}
                  maxLength={80}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Enter your full name"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                />
              </div>

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

              <div>
                <label
                  htmlFor="phone"
                  className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-slate-700"
                >
                  <MessageCircle size={16} />
                  WhatsApp phone number
                </label>
                <div className="flex overflow-hidden rounded-xl border border-slate-300 focus-within:border-blue-600 focus-within:ring-4 focus-within:ring-blue-100">
                  <span className="flex items-center border-r border-slate-300 bg-slate-50 px-3 text-sm font-semibold text-slate-700">
                    +233
                  </span>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel-national"
                    required
                    maxLength={14}
                    value={phone}
                    onChange={(event) =>
                      setPhone(event.target.value.replace(/[^\d\s()-]/g, ""))
                    }
                    placeholder="241234567"
                    aria-describedby="phone-help"
                    className="min-w-0 flex-1 px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400"
                  />
                </div>
                <p id="phone-help" className="mt-1.5 text-xs text-slate-500">
                  Enter your nine-digit number after +233, or enter your local
                  number starting with 0.
                </p>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-1.5 block text-sm font-semibold text-slate-700"
                >
                  Password
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
                    placeholder="At least 12 characters"
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
                  Use at least 12 characters.
                </p>
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-1.5 block text-sm font-semibold text-slate-700"
                >
                  Confirm password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  minLength={12}
                  maxLength={128}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Enter your password again"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              {error && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                  {error}
                </div>
              )}

              {notice && (
                <div
                  role="status"
                  className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800"
                >
                  {notice}
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
                {isSubmitting ? "Sending verification code..." : "Continue"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerification} className="space-y-5">
              <div>
                <label
                  htmlFor="code"
                  className="mb-1.5 block text-sm font-semibold text-slate-700"
                >
                  Six-digit verification code
                </label>
                <input
                  id="code"
                  name="code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]{6}"
                  minLength={6}
                  maxLength={6}
                  required
                  value={code}
                  onChange={(event) =>
                    setCode(event.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  placeholder="000000"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-center text-2xl font-bold tracking-[0.5em] text-slate-900 outline-none transition placeholder:text-slate-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                />
                <p className="mt-2 text-xs text-slate-500">
                  The code expires after 10 minutes.
                </p>
              </div>

              {error && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                  {error}
                </div>
              )}

              {notice && (
                <div
                  role="status"
                  className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800"
                >
                  {notice}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-3.5 text-sm font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? (
                  <LoaderCircle size={18} className="animate-spin" />
                ) : (
                  <ShieldCheck size={18} />
                )}
                {isSubmitting ? "Verifying..." : "Verify email and create account"}
              </button>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-800">
                  Didn't receive your code?
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-600">
                  Check your inbox and spam folder. You can request another
                  code when the countdown finishes.
                </p>

                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={
                    isSubmitting ||
                    isResending ||
                    resendCountdown > 0
                  }
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-white px-4 py-3 text-sm font-bold text-blue-700 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isResending ? (
                    <LoaderCircle size={17} className="animate-spin" />
                  ) : resendCountdown > 0 ? (
                    <Clock size={17} />
                  ) : (
                    <Mail size={17} />
                  )}

                  {isResending
                    ? "Requesting new code..."
                    : resendCountdown > 0
                      ? `Resend code in ${resendCountdown}s`
                      : "Resend verification code"}
                </button>
              </div>

              <button
                type="button"
                disabled={isSubmitting || isResending}
                onClick={() => {
                  setStage("register");
                  setCode("");
                  setError("");
                  setNotice("");
                  setResendCountdown(0);
                }}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
              >
                Back to registration
              </button>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-slate-600">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-bold text-blue-700 hover:text-blue-900"
            >
              Sign in
            </Link>
          </p>
        </section>

        <p className="mt-5 text-center text-xs leading-5 text-slate-500">
          Creating an account does not automatically grant verified church
          membership or administrative privileges.
        </p>
      </div>
    </main>
  );
}
