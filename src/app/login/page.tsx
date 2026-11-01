"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { ArrowLeft, Eye, EyeOff, LoaderCircle } from "lucide-react";
import { Suspense, useState, type FormEvent } from "react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const registered = searchParams.get("registered") === "true";
  const passwordChanged = searchParams.get("passwordChanged") === "1";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const requestedCallback = searchParams.get("callbackUrl");

      const callbackUrl =
        requestedCallback &&
        requestedCallback.startsWith("/") &&
        !requestedCallback.startsWith("//")
          ? requestedCallback
          : "/";

      const result = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        callbackUrl,
        redirect: false,
      });

      if (!result || result.error) {
        setError("Invalid email or password. Please try again.");
        return;
      }

      router.replace(callbackUrl);
      router.refresh();
    } catch {
      setError("Unable to sign in right now. Please try again.");
    } finally {
      setIsSubmitting(false);
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

            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
              Welcome back
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Sign in to your Word Ministries account.
            </p>
          </div>

          {registered && (
  <div
    role="status"
    className="mb-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800"
  >
    Your email has been verified and your account created successfully.
    You can now sign in.
  </div>
)}

          {passwordChanged && (
            <div
              role="status"
              className="mb-5 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800"
            >
              Your password has been changed successfully. Please sign in with
              your new password.
            </div>
          )}

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
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
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

              <div className="mt-2 flex justify-end">
                <Link
                  href="/forgot-password"
                  className="text-sm font-semibold text-blue-700 transition hover:text-blue-900"
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            {error && (


              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
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
              {isSubmitting ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-bold text-blue-700 hover:text-blue-900"
            >
              Create one
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
          <p className="text-sm text-slate-600">Loading sign-in...</p>
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}


