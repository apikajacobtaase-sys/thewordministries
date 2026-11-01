"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AppHeader from "@/components/layout/AppHeader";
import BottomNavigation from "@/components/layout/BottomNavigation";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Church,
  Compass,
  Heart,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
} from "lucide-react";

type Milestone = {
  year?: string;
  date?: string;
  title?: string;
  description?: string;
};

type AboutContent = {
  id: string;
  title: string;
  introduction: string | null;
  story: string;
  mission: string | null;
  vision: string | null;
  beliefs: string | null;
  values: string | null;
  pastorName: string | null;
  pastorTitle: string | null;
  pastorBiography: string | null;
  pastorImage: string | null;
  historyMilestones: Milestone[] | null;
  heroImage: string | null;
  publishedAt: string | null;
  updatedAt: string;
};

function splitContent(value: string | null | undefined) {
  if (!value?.trim()) return [];
  return value
    .split(/\n+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string | null;
}) {
  return (
    <div className="mx-auto max-w-[340px] text-center">
      <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-[#1877f2]">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-[27px] font-extrabold leading-tight tracking-[-0.045em] text-[#1c1e21]">
        {title}
      </h2>
      {description && (
        <p className="mt-3 text-[13px] leading-7 text-[#65676b]">
          {description}
        </p>
      )}
    </div>
  );
}

export default function AboutPage() {
  const [content, setContent] = useState<AboutContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadAbout() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/about", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("We couldn't load the ministry information.");
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(
          result.message || "We couldn't load the ministry information."
        );
      }

      setContent(result.data ?? null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAbout();
  }, []);

  const milestones = Array.isArray(content?.historyMilestones)
    ? content.historyMilestones
    : [];

  return (
    <div className="page-shell min-h-screen bg-[#f0f2f5] pb-24">
      <AppHeader />

      <main className="container-mobile overflow-hidden bg-white">
        <section className="relative overflow-hidden bg-white px-5 pb-10 pt-5">
          <Link
            href="/"
            className="inline-flex min-h-10 items-center gap-2 rounded-xl px-3 text-[12px] font-bold text-[#65676b] transition hover:bg-[#f0f2f5] hover:text-[#1877f2]"
          >
            <ArrowLeft size={16} />
            Back to Home
          </Link>

          {content?.heroImage && !loading && !error && (
            <div className="mt-4 overflow-hidden rounded-2xl">
              <img
                src={content.heroImage}
                alt="The Word Ministries International"
                className="h-52 w-full object-cover"
              />
            </div>
          )}

          <div className="relative mt-7">
            <div
              aria-hidden="true"
              className="absolute -right-16 -top-12 h-40 w-40 rounded-full bg-[#e7f3ff] blur-3xl"
            />

            <div className="relative">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#1877f2]/15 bg-[#e7f3ff] text-[#1877f2]">
                <Church size={23} strokeWidth={1.7} />
              </div>

              <p className="mt-6 text-[10px] font-extrabold uppercase tracking-[0.23em] text-[#1877f2]">
                Our Story  Our Faith  Our Purpose
              </p>

              <h1 className="mt-3 max-w-[390px] text-[35px] font-extrabold leading-[1.08] tracking-[-0.055em] text-[#1c1e21]">
                {content?.title || "Discover Our Ministry"}
              </h1>

              <p className="mt-4 max-w-[390px] text-[14px] leading-7 text-[#65676b]">
                {content?.introduction ||
                  "Discover the story, faith, and purpose of The Word Ministries International. We invite you to know us, grow with us, and journey with us in Christ."}
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/programs"
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#1877f2] px-5 py-3 text-[12px] font-bold text-white shadow-lg shadow-[#1877f2]/15 transition hover:-translate-y-0.5 hover:bg-[#0866ff]"
                >
                  Join a Programme
                  <ArrowRight size={15} />
                </Link>

                <Link
                  href="/prayer"
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#e4e6eb] bg-white px-5 py-3 text-[12px] font-bold text-[#1c1e21] transition hover:bg-[#f0f2f5]"
                >
                  <Heart size={15} />
                  Prayer Request
                </Link>
              </div>
            </div>
          </div>
        </section>

        {loading ? (
          <section className="px-5 py-20 text-center">
            <LoaderCircle
              className="mx-auto animate-spin text-[#1877f2]"
              size={32}
            />
            <p className="mt-4 text-[13px] font-semibold text-[#65676b]">
              Loading our ministry story...
            </p>
          </section>
        ) : error ? (
          <section className="px-5 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e7f3ff] text-[#1877f2]">
              <RefreshCw size={24} />
            </div>
            <h2 className="mt-5 text-xl font-extrabold text-[#1c1e21]">
              We couldn&apos;t load this page
            </h2>
            <p className="mt-2 text-[13px] leading-6 text-[#65676b]">
              {error}
            </p>
            <button
              type="button"
              onClick={() => void loadAbout()}
              className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#1877f2] px-5 text-[12px] font-bold text-white hover:bg-[#0866ff]"
            >
              <RefreshCw size={15} />
              Try Again
            </button>
          </section>
        ) : (
          <>
            {!content && (
              <section className="mx-5 rounded-2xl border border-[#e4e6eb] bg-[#f7faff] p-5">
                <div className="flex items-center gap-2 text-[#1877f2]">
                  <BookOpen size={19} />
                  <h2 className="text-[15px] font-extrabold">
                    Our story is being prepared
                  </h2>
                </div>
                <p className="mt-3 text-[13px] leading-7 text-[#65676b]">
                  We are preparing the official history and testimony of The
                  Word Ministries International. Please return soon to discover
                  more about our journey, leadership, and calling.
                </p>
              </section>
            )}

            {content?.story && (
              <section className="px-5 py-12">
                <SectionHeading
                  eyebrow="Where It All Began"
                  title="Our Story"
                  description="Understanding the journey, the calling, and the faith behind our ministry."
                />

                <div className="mt-7 rounded-2xl border border-[#e4e6eb] bg-white p-5 shadow-sm">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[#e7f3ff] text-[#1877f2]">
                    <BookOpen size={21} />
                  </div>
                  <div className="space-y-4">
                    {splitContent(content.story).map((paragraph, index) => (
                      <p
                        key={`${index}-${paragraph.slice(0, 20)}`}
                        className="whitespace-pre-line text-[13px] leading-7 text-[#444950]"
                      >
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {(content?.mission || content?.vision) && (
              <section className="bg-[#f0f2f5] px-5 py-12">
                <SectionHeading
                  eyebrow="What Guides Us"
                  title="Our Purpose"
                  description="The convictions and direction that shape our ministry."
                />

                <div className="mt-7 grid grid-cols-1 gap-4">
                  {content.mission && (
                    <article className="rounded-2xl border border-[#e4e6eb] bg-white p-5 shadow-sm">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e7f3ff] text-[#1877f2]">
                        <Target size={22} />
                      </div>
                      <h3 className="mt-4 text-[19px] font-extrabold tracking-tight text-[#1c1e21]">
                        Our Mission
                      </h3>
                      <div className="mt-3 space-y-3">
                        {splitContent(content.mission).map((item, index) => (
                          <p
                            key={index}
                            className="text-[13px] leading-7 text-[#65676b]"
                          >
                            {item}
                          </p>
                        ))}
                      </div>
                    </article>
                  )}

                  {content.vision && (
                    <article className="rounded-2xl border border-[#e4e6eb] bg-white p-5 shadow-sm">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e7f3ff] text-[#1877f2]">
                        <Compass size={22} />
                      </div>
                      <h3 className="mt-4 text-[19px] font-extrabold tracking-tight text-[#1c1e21]">
                        Our Vision
                      </h3>
                      <div className="mt-3 space-y-3">
                        {splitContent(content.vision).map((item, index) => (
                          <p
                            key={index}
                            className="text-[13px] leading-7 text-[#65676b]"
                          >
                            {item}
                          </p>
                        ))}
                      </div>
                    </article>
                  )}
                </div>
              </section>
            )}

            {(content?.beliefs || content?.values) && (
              <section className="px-5 py-12">
                <SectionHeading
                  eyebrow="What We Believe"
                  title="Our Foundation"
                  description="The faith and values that inform our worship, service, and everyday living."
                />

                <div className="mt-7 space-y-4">
                  {content.beliefs && (
                    <article className="rounded-2xl border border-[#e4e6eb] bg-white p-5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e7f3ff] text-[#1877f2]">
                          <ShieldCheck size={21} />
                        </div>
                        <h3 className="text-[17px] font-extrabold text-[#1c1e21]">
                          Our Beliefs
                        </h3>
                      </div>
                      <div className="mt-4 space-y-3">
                        {splitContent(content.beliefs).map((item, index) => (
                          <p
                            key={index}
                            className="text-[13px] leading-7 text-[#65676b]"
                          >
                            {item}
                          </p>
                        ))}
                      </div>
                    </article>
                  )}

                  {content.values && (
                    <article className="rounded-2xl border border-[#e4e6eb] bg-white p-5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e7f3ff] text-[#1877f2]">
                          <Sparkles size={21} />
                        </div>
                        <h3 className="text-[17px] font-extrabold text-[#1c1e21]">
                          Our Values
                        </h3>
                      </div>
                      <div className="mt-4 space-y-3">
                        {splitContent(content.values).map((item, index) => (
                          <p
                            key={index}
                            className="text-[13px] leading-7 text-[#65676b]"
                          >
                            {item}
                          </p>
                        ))}
                      </div>
                    </article>
                  )}
                </div>
              </section>
            )}

            {(content?.pastorName ||
              content?.pastorBiography ||
              content?.pastorImage) && (
              <section className="bg-[#f0f2f5] px-5 py-12">
                <SectionHeading
                  eyebrow="Our Leadership"
                  title="Meet Our Pastor"
                  description="Learn about the person and ministry behind our spiritual leadership."
                />

                <article className="mt-7 overflow-hidden rounded-2xl border border-[#e4e6eb] bg-white shadow-sm">
                  {content.pastorImage ? (
                    <img
                      src={content.pastorImage}
                      alt={content.pastorName || "Our pastor"}
                      className="h-64 w-full object-cover object-center"
                    />
                  ) : (
                    <div className="flex h-48 items-center justify-center bg-[#e7f3ff] text-[#1877f2]">
                      <Users size={54} strokeWidth={1.2} />
                    </div>
                  )}

                  <div className="p-5">
                    {content.pastorTitle && (
                      <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#1877f2]">
                        {content.pastorTitle}
                      </p>
                    )}
                    <h3 className="mt-2 text-[24px] font-extrabold tracking-tight text-[#1c1e21]">
                      {content.pastorName || "Our Pastor"}
                    </h3>

                    {content.pastorBiography && (
                      <div className="mt-4 space-y-3">
                        {splitContent(content.pastorBiography).map(
                          (paragraph, index) => (
                            <p
                              key={index}
                              className="text-[13px] leading-7 text-[#65676b]"
                            >
                              {paragraph}
                            </p>
                          )
                        )}
                      </div>
                    )}
                  </div>
                </article>
              </section>
            )}

            {milestones.length > 0 && (
              <section className="px-5 py-12">
                <SectionHeading
                  eyebrow="Our Journey"
                  title="Ministry Milestones"
                  description="Important moments in the history of our ministry."
                />

                <div className="relative mt-8 space-y-4">
                  {milestones.map((milestone, index) => (
                    <article
                      key={`${milestone.year || milestone.date || "milestone"}-${index}`}
                      className="relative rounded-2xl border border-[#e4e6eb] bg-white p-5 shadow-sm"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e7f3ff] text-[#1877f2]">
                          {milestone.year || milestone.date ? (
                            <CalendarDays size={19} />
                          ) : (
                            <CheckCircle2 size={19} />
                          )}
                        </div>
                        <div className="min-w-0">
                          {(milestone.year || milestone.date) && (
                            <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#1877f2]">
                              {milestone.year || milestone.date}
                            </p>
                          )}
                          {milestone.title && (
                            <h3 className="mt-1 text-[16px] font-extrabold text-[#1c1e21]">
                              {milestone.title}
                            </h3>
                          )}
                          {milestone.description && (
                            <p className="mt-2 text-[13px] leading-7 text-[#65676b]">
                              {milestone.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        <section className="relative overflow-hidden border-t border-[#e4e6eb] bg-white px-5 py-12 text-center">
          <div
            aria-hidden="true"
            className="absolute -right-12 top-0 h-36 w-36 rounded-full bg-[#e7f3ff] blur-3xl"
          />

          <div className="relative">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[#1877f2]/15 bg-[#e7f3ff] text-[#1877f2]">
              <Heart size={24} />
            </div>

            <p className="mt-6 text-[10px] font-extrabold uppercase tracking-[0.22em] text-[#1877f2]">
              There Is a Place for You
            </p>
            <h2 className="mt-3 text-[29px] font-extrabold leading-tight tracking-[-0.045em] text-[#1c1e21]">
              Grow With Us.
            </h2>
            <p className="mx-auto mt-4 max-w-[320px] text-[13px] leading-7 text-[#65676b]">
              Take the next step in your faith journey. Join a programme,
              share a prayer request, or explore messages from God&apos;s Word.
            </p>

            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                href="/sermons"
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#1877f2] px-5 py-3 text-[12px] font-bold text-white transition hover:bg-[#0866ff]"
              >
                Explore Sermons
                <ArrowRight size={15} />
              </Link>
              <Link
                href="/programs"
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#e4e6eb] px-5 py-3 text-[12px] font-bold text-[#1c1e21] transition hover:bg-[#f0f2f5]"
              >
                <Users size={15} />
                Our Programmes
              </Link>
            </div>
          </div>
        </section>

        <footer className="border-t border-[#e4e6eb] bg-[#f0f2f5] px-5 py-7 text-center">
          <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl bg-[#1877f2] text-white">
            <Church size={18} />
          </div>
          <p className="mt-3 text-[12px] font-extrabold text-[#1c1e21]">
            The Word Ministries International
          </p>
          <p className="mt-1 text-[11px] text-[#65676b]">
            Growing in the Word. Living by faith.
          </p>
          <Link
            href="/"
            className="mt-4 inline-flex min-h-9 items-center gap-1 text-[11px] font-bold text-[#1877f2] hover:underline"
          >
            Return Home
            <ArrowRight size={13} />
          </Link>
        </footer>
      </main>

      <BottomNavigation />
    </div>
  );
}
