
import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Bell,
  CalendarDays,
  Newspaper,
  Sparkles,
} from "lucide-react";

import { db } from "@/lib/prisma";
import AppHeader from "@/components/layout/AppHeader";
import BottomNavigation from "@/components/layout/BottomNavigation";

export const metadata: Metadata = {
  title: "News & Announcements",
  description:
    "Discover the latest church news, announcements, ministry updates, and upcoming activities from The Word Ministries International.",
};

export const dynamic = "force-dynamic";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Africa/Accra",
  }).format(date);
}

function getExcerpt(content: string, summary?: string | null) {
  const text = (summary || content).trim();

  if (text.length <= 180) {
    return text;
  }

  return `${text.slice(0, 177).trimEnd()}...`;
}

export default async function NewsPage() {
  const now = new Date();

  const announcements = await db.announcement.findMany({
    where: {
      status: "PUBLISHED",
      publishedAt: {
        lte: now,
      },
      OR: [{ expiresAt: null }, { expiresAt: { gte: now } }],
    },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
  });

  const featured = announcements[0];
  const otherAnnouncements = announcements.slice(1);

  return (
    <>
      <AppHeader />

      <main className="page-shell min-h-screen bg-slate-50">
        {/* Page introduction */}
        <section className="relative overflow-hidden border-b border-blue-100 bg-white">
          <div
            aria-hidden="true"
            className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-blue-100/70 blur-3xl"
          />

          <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
            <Link
              href="/"
              className="mb-8 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-blue-200 hover:text-blue-700"
            >
              <ArrowLeft size={16} />
              Back to Home
            </Link>

            <div className="max-w-3xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-blue-700">
                <Bell size={15} />
                Stay Connected
              </div>

              <h1 className="text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                Church News &{" "}
                <span className="text-blue-600">Announcements</span>
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
                Stay informed about what is happening in our ministry. Find
                important announcements, ministry updates, and news from our
                church community.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700">
                <Newspaper size={18} className="text-blue-600" />
                Ministry updates
              </div>

              <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700">
                <CalendarDays size={18} className="text-blue-600" />
                Church announcements
              </div>
            </div>
          </div>
        </section>

        {/* Announcements */}
        <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="section-eyebrow">From Our Ministry</p>
              <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                Latest Updates
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                The latest published news and announcements.
              </p>
            </div>

            <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600">
              {announcements.length}{" "}
              {announcements.length === 1 ? "announcement" : "announcements"}
            </span>
          </div>

          {announcements.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white px-5 py-14 text-center shadow-sm sm:px-10">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <Newspaper size={30} />
              </div>

              <h3 className="mt-6 text-xl font-bold text-slate-950">
                No announcements just yet
              </h3>

              <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-slate-600">
                There are no published announcements available right now.
                Please check back soon for ministry updates and church news.
              </p>

              <Link
                href="/programs"
                className="mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
              >
                Explore Church Programs
                <ArrowRight size={18} />
              </Link>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Featured announcement */}
              {featured && (
                <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
                  <div className="grid md:grid-cols-2">
                    <div className="relative min-h-64 overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-900 md:min-h-80">
                      {featured.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={featured.image}
                          alt=""
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center p-8">
                          <div className="flex h-24 w-24 items-center justify-center rounded-3xl border border-white/20 bg-white/10 text-white">
                            <Sparkles size={46} strokeWidth={1.5} />
                          </div>
                        </div>
                      )}

                      {featured.image && (
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 via-transparent to-transparent" />
                      )}

                      <span className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-bold text-blue-700 shadow-sm">
                        <Sparkles size={14} />
                        Featured Announcement
                      </span>
                    </div>

                    <div className="flex flex-col justify-center p-6 sm:p-8 lg:p-10">
                      <div className="flex items-center gap-2 text-sm font-medium text-blue-600">
                        <CalendarDays size={17} />
                        {formatDate(
                          featured.publishedAt || featured.createdAt,
                        )}
                      </div>

                      <h3 className="mt-5 text-2xl font-bold leading-tight tracking-tight text-slate-950 sm:text-3xl">
                        {featured.title}
                      </h3>

                      <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">
                        {getExcerpt(featured.content, featured.summary)}
                      </p>

                      <Link
                        href={`/news/${featured.slug}`}
                        className="mt-7 inline-flex min-h-12 w-fit items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
                      >
                        Read Announcement
                        <ArrowUpRight size={18} />
                      </Link>
                    </div>
                  </div>
                </article>
              )}

              {/* Remaining announcements */}
              {otherAnnouncements.length > 0 && (
                <div>
                  <h3 className="mb-5 text-xl font-bold text-slate-950">
                    More Updates
                  </h3>

                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {otherAnnouncements.map((announcement) => (
                      <article
                        key={announcement.id}
                        className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                      >
                        <div className="relative flex h-44 items-center justify-center overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100">
                          {announcement.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={announcement.image}
                              alt=""
                              className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
                            />
                          ) : (
                            <Newspaper
                              size={38}
                              strokeWidth={1.4}
                              className="text-blue-500"
                            />
                          )}
                        </div>

                        <div className="flex flex-1 flex-col p-5">
                          <p className="flex items-center gap-2 text-xs font-semibold text-blue-600">
                            <CalendarDays size={15} />
                            {formatDate(
                              announcement.publishedAt ||
                                announcement.createdAt,
                            )}
                          </p>

                          <h4 className="mt-3 text-lg font-bold leading-snug text-slate-950">
                            {announcement.title}
                          </h4>

                          <p className="mt-3 flex-1 text-sm leading-7 text-slate-600">
                            {getExcerpt(
                              announcement.content,
                              announcement.summary,
                            )}
                          </p>

                          <Link
                            href={`/news/${announcement.slug}`}
                            className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-blue-600 transition group-hover:text-blue-800"
                          >
                            Read more
                            <ArrowRight size={17} />
                          </Link>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Closing call to action */}
        <section className="mx-auto max-w-6xl px-4 pb-12 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-5 rounded-3xl bg-slate-950 p-6 text-white sm:flex-row sm:items-center sm:p-9">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-300">
                Stay Connected
              </p>
              <h2 className="mt-3 text-2xl font-bold sm:text-3xl">
                Be part of our church community.
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-7 text-slate-300">
                Discover our programs, grow through the Word, and stay connected
                with ministry activities.
              </p>
            </div>

            <Link
              href="/programs"
              className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-500"
            >
              Explore Programs
              <ArrowUpRight size={18} />
            </Link>
          </div>
        </section>
      </main>

      <BottomNavigation />
    </>
  );
}