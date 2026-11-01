
"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  CheckCircle2,
  Heart,
  HeartHandshake,
  LoaderCircle,
  LockKeyhole,
  Mail,
  MessageCircleHeart,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";

import AppHeader from "@/components/layout/AppHeader";
import BottomNavigation from "@/components/layout/BottomNavigation";

type SubmissionState =
  | { type: "success"; message: string }
  | { type: "error"; message: string }
  | null;

export default function PrayerPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isPrivate, setIsPrivate] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submission, setSubmission] = useState<SubmissionState>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmission(null);

    if (message.trim().length < 10) {
      setSubmission({
        type: "error",
        message: "Please write at least 10 characters in your prayer request.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/prayer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: isAnonymous ? "" : name.trim(),
          email: isAnonymous ? "" : email.trim(),
          subject: subject.trim(),
          message: message.trim(),
          isAnonymous,
          isPrivate,
        }),
      });

      const result: {
        success?: boolean;
        message?: string;
        error?: string;
      } = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.error || "Unable to submit your request. Please try again.",
        );
      }

      setSubmission({
        type: "success",
        message:
          result.message ||
          "Your prayer request has been received. We will keep it in prayer.",
      });

      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
      setIsAnonymous(false);
      setIsPrivate(true);
    } catch (error) {
      setSubmission({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Something went wrong. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <AppHeader />

      <main className="page-shell min-h-screen bg-slate-50 text-slate-900">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-blue-100 bg-white">
          <div
            aria-hidden="true"
            className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-blue-100/70 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="absolute -bottom-24 -left-20 h-64 w-64 rounded-full bg-sky-100/70 blur-3xl"
          />

          <div className="relative mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
            <Link
              href="/"
              className="mb-8 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-blue-200 hover:text-blue-700"
            >
              <ArrowLeft size={16} />
              Back to Home
            </Link>

            <div className="grid items-center gap-10 md:grid-cols-[1.2fr_0.8fr]">
              <div>
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-blue-700">
                  <Heart size={15} />
                  We Believe in the Power of Prayer
                </div>

                <h1 className="max-w-2xl text-4xl font-bold leading-tight tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                  You don&apos;t have to{" "}
                  <span className="text-blue-600">carry it alone.</span>
                </h1>

                <p className="mt-6 max-w-xl text-base leading-8 text-slate-600 sm:text-lg">
                  Whatever you are going through, you can share your prayer
                  request with us. We would be honoured to stand with you in
                  prayer.
                </p>

                <div className="mt-7 flex flex-wrap gap-3 text-sm text-slate-600">
                  <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-sm ring-1 ring-slate-200">
                    <ShieldCheck size={17} className="text-blue-600" />
                    Privacy options
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-sm ring-1 ring-slate-200">
                    <HeartHandshake size={17} className="text-blue-600" />
                    A caring community
                  </span>
                </div>
              </div>

              <div className="relative mx-auto w-full max-w-sm">
                <div className="rounded-[2rem] bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-7 text-white shadow-2xl shadow-blue-900/20 sm:p-9">
                  <div className="mb-7 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20">
                    <MessageCircleHeart size={34} strokeWidth={1.6} />
                  </div>

                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-100">
                    A Word of Encouragement
                  </p>

                  <blockquote className="mt-4 text-2xl font-semibold leading-relaxed">
                    &ldquo;The effectual fervent prayer of a righteous man
                    availeth much.&rdquo;
                  </blockquote>

                  <p className="mt-5 text-sm font-medium text-blue-100">
                    James 5:16 (KJV)
                  </p>

                  <div className="mt-8 flex items-center gap-3 border-t border-white/20 pt-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15">
                      <Sparkles size={19} />
                    </div>
                    <p className="text-sm leading-6 text-blue-50">
                      Come as you are. Your request matters.
                    </p>
                  </div>
                </div>

                <div
                  aria-hidden="true"
                  className="absolute -right-3 -top-3 -z-10 h-full w-full rounded-[2rem] border-2 border-blue-200"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Form and information */}
        <section className="mx-auto grid max-w-5xl gap-8 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[1fr_300px] lg:px-8">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
            <div className="mb-8">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                <HeartHandshake size={25} />
              </div>

              <h2 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                Share Your Prayer Request
              </h2>

              <p className="mt-3 text-sm leading-7 text-slate-500 sm:text-base">
                Share only what you feel comfortable sharing. Fields marked
                with an asterisk are required.
              </p>
            </div>

            {submission && (
              <div
                role={submission.type === "error" ? "alert" : "status"}
                aria-live="polite"
                className={`mb-6 flex gap-3 rounded-2xl border p-4 ${
                  submission.type === "success"
                    ? "border-green-200 bg-green-50 text-green-800"
                    : "border-red-200 bg-red-50 text-red-800"
                }`}
              >
                {submission.type === "success" ? (
                  <CheckCircle2 className="mt-0.5 shrink-0" size={21} />
                ) : (
                  <ShieldCheck className="mt-0.5 shrink-0" size={21} />
                )}

                <p className="text-sm leading-6">{submission.message}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4 sm:p-5">
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(event) => setIsAnonymous(event.target.checked)}
                    className="mt-1 h-4 w-4 shrink-0 accent-blue-600"
                  />

                  <span>
                    <span className="flex items-center gap-2 font-semibold text-slate-900">
                      <LockKeyhole size={17} className="text-blue-700" />
                      Submit anonymously
                    </span>
                    <span className="mt-1 block text-sm leading-6 text-slate-600">
                      Your name, email address, and account ID will not be saved
                      with this request.
                    </span>
                  </span>
                </label>
              </div>

              {!isAnonymous && (
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="prayer-name"
                      className="mb-2 block text-sm font-semibold text-slate-800"
                    >
                      Your name
                    </label>

                    <div className="relative">
                      <UserRound
                        size={18}
                        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <input
                        id="prayer-name"
                        type="text"
                        autoComplete="name"
                        maxLength={80}
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        placeholder="Enter your name"
                        className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="prayer-email"
                      className="mb-2 block text-sm font-semibold text-slate-800"
                    >
                      Email address
                    </label>

                    <div className="relative">
                      <Mail
                        size={18}
                        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <input
                        id="prayer-email"
                        type="email"
                        autoComplete="email"
                        maxLength={254}
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="you@example.com"
                        className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label
                  htmlFor="prayer-subject"
                  className="mb-2 block text-sm font-semibold text-slate-800"
                >
                  Prayer category{" "}
                  <span className="font-normal text-slate-400">(optional)</span>
                </label>

                <select
                  id="prayer-subject"
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                >
                  <option value="">Choose a category</option>
                  <option value="Healing and Health">Healing and Health</option>
                  <option value="Family and Relationships">
                    Family and Relationships
                  </option>
                  <option value="Spiritual Growth">Spiritual Growth</option>
                  <option value="Guidance and Direction">
                    Guidance and Direction
                  </option>
                  <option value="Provision and Finances">
                    Provision and Finances
                  </option>
                  <option value="Thanksgiving">Thanksgiving</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label
                    htmlFor="prayer-message"
                    className="text-sm font-semibold text-slate-800"
                  >
                    Your prayer request *
                  </label>

                  <span className="text-xs text-slate-400">
                    {message.length}/5000
                  </span>
                </div>

                <textarea
                  id="prayer-message"
                  required
                  minLength={10}
                  maxLength={5000}
                  rows={7}
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="Share what you would like us to pray about..."
                  className="w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-7 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />

                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Please avoid including passwords, financial account details,
                  or other information you do not need to share.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 p-4 sm:p-5">
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={isPrivate}
                    onChange={(event) => setIsPrivate(event.target.checked)}
                    className="mt-1 h-4 w-4 shrink-0 accent-blue-600"
                  />

                  <span>
                    <span className="flex items-center gap-2 font-semibold text-slate-900">
                      <ShieldCheck size={17} className="text-blue-700" />
                      Keep my request private
                    </span>
                    <span className="mt-1 block text-sm leading-6 text-slate-600">
                      Keep this request for the authorised prayer team rather
                      than treating it as a request that may be shared publicly.
                    </span>
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-4 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:min-w-52"
              >
                {isSubmitting ? (
                  <>
                    <LoaderCircle size={19} className="animate-spin" />
                    Submitting request...
                  </>
                ) : (
                  <>
                    Submit Prayer Request
                    <ArrowUpRight size={19} />
                  </>
                )}
              </button>

              <p className="text-xs leading-6 text-slate-500">
                Submitting this form does not guarantee an immediate response.
                Please contact emergency services directly if you are in
                immediate danger.
              </p>
            </form>
          </div>

          {/* Supporting information */}
          <aside className="space-y-5">
            <div className="rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-blue-700 shadow-sm">
                <Heart size={24} />
              </div>

              <h3 className="mt-5 text-lg font-bold text-slate-950">
                You Are Not Alone
              </h3>

              <p className="mt-3 text-sm leading-7 text-slate-600">
                Prayer is an opportunity to bring your concerns, hopes, and
                gratitude before God. You are welcome to share at your own pace.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                <LockKeyhole size={23} />
              </div>

              <h3 className="mt-5 text-lg font-bold text-slate-950">
                Your Privacy Matters
              </h3>

              <p className="mt-3 text-sm leading-7 text-slate-600">
                Anonymous submissions omit identifying details from the prayer
                request record. Select the private option if your request should
                remain restricted to authorised team members.
              </p>
            </div>

            <Link
              href="/sermons"
              className="group flex items-center justify-between gap-4 rounded-3xl bg-slate-950 p-6 text-white transition hover:bg-blue-950"
            >
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-blue-300">
                  Need encouragement?
                </p>
                <p className="mt-2 text-lg font-bold">Explore Sermons</p>
                <p className="mt-1 text-sm leading-6 text-slate-300">
                  Spend time in the Word.
                </p>
              </div>

              <ArrowUpRight
                size={23}
                className="shrink-0 transition group-hover:-translate-y-1 group-hover:translate-x-1"
              />
            </Link>
          </aside>
        </section>
      </main>

      <BottomNavigation />
    </>
  );
}