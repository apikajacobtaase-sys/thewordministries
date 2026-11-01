 import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Newspaper,
  Sparkles,
} from "lucide-react";

import { db } from "@/lib/prisma";
import AppHeader from "@/components/layout/AppHeader";
import BottomNavigation from "@/components/layout/BottomNavigation";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  const { slug } = await params;
  const now = new Date();

  const announcement = await db.announcement.findFirst({
    where: {
      slug,
      status: "PUBLISHED",
      publishedAt: { lte: now },
      OR: [{ expiresAt: null }, { expiresAt: { gte: now } }],
    },
    select: {
      title: true,
      summary: true,
    },
  });

  if (!announcement) {
    return {
      title: "News Not Found | The Word Ministries International",
    };
  }

  return {
    title: `${announcement.title} | The Word Ministries International`,
    description:
      announcement.summary ||
      `Read the latest news from The Word Ministries International.`,
  };
}

function formatDate(date: Date | null) {
  if (!date) return "Latest update";

  return new Intl.DateTimeFormat("en-GH", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Africa/Accra",
  }).format(date);
}

export default async function NewsDetailPage({ params }: Props) {
  const { slug } = await params;
  const now = new Date();

  const announcement = await db.announcement.findFirst({
    where: {
      slug,
      status: "PUBLISHED",
      publishedAt: { lte: now },
      OR: [{ expiresAt: null }, { expiresAt: { gte: now } }],
    },
  });

  if (!announcement) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#f0f2f5] pb-24 font-sans text-[#1c1e21]">
      <AppHeader />

      <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-sm font-medium text-[#65676b]">
          <Link
            href="/"
            className="transition-colors hover:text-[#1877f2]"
          >
            Home
          </Link>

          <span aria-hidden="true">/</span>

          <Link
            href="/news"
            className="transition-colors hover:text-[#1877f2]"
          >
            News
          </Link>

          <span aria-hidden="true">/</span>

          <span className="max-w-[45%] truncate text-[#1c1e21]">
            {announcement.title}
          </span>
        </nav>

        {/* Article */}
        <article className="overflow-hidden rounded-2xl border border-[#e4e6eb] bg-white shadow-sm">
          {/* Article header */}
          <div className="px-5 pb-6 pt-7 sm:px-10 sm:pb-9 sm:pt-10">
            <Link
              href="/news"
              className="mb-7 inline-flex items-center gap-2 rounded-full bg-[#e7f3ff] px-4 py-2 text-sm font-semibold text-[#0866ff] transition-colors hover:bg-[#d8eaff]"
            >
              <ArrowLeft size={16} />
              Back to news
            </Link>

            <div className="mb-5 flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e7f3ff] text-[#1877f2]">
                <Newspaper size={19} />
              </span>

              <span className="text-sm font-bold tracking-wide text-[#1877f2]">
                CHURCH NEWS & ANNOUNCEMENTS
              </span>
            </div>

            <h1 className="max-w-4xl text-3xl font-extrabold leading-tight tracking-tight text-[#1c1e21] sm:text-4xl sm:leading-tight lg:text-5xl">
              {announcement.title}
            </h1>

            {announcement.summary && (
              <p className="mt-5 max-w-3xl text-base leading-7 text-[#65676b] sm:text-lg sm:leading-8">
                {announcement.summary}
              </p>
            )}

            <div className="mt-7 flex flex-wrap items-center gap-3 border-t border-[#e4e6eb] pt-5">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e7f3ff] text-[#1877f2]">
                <CalendarDays size={18} />
              </span>

              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-[#65676b]">
                  Published
                </p>

                <p className="mt-0.5 text-sm font-semibold text-[#1c1e21]">
                  {formatDate(announcement.publishedAt)}
                </p>
              </div>
            </div>
          </div>

          {/* Featured image */}
          {announcement.image && (
            <div className="border-y border-[#e4e6eb] bg-[#f0f2f5]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={announcement.image}
                alt={announcement.title}
                className="max-h-[560px] w-full object-cover"
              />
            </div>
          )}

          {/* Article content */}
          <div className="px-5 py-7 sm:px-10 sm:py-10">
            <div className="mb-6 flex items-center gap-2 text-sm font-bold text-[#1877f2]">
              <Sparkles size={17} />
              <span>THE WORD MINISTRIES INTERNATIONAL</span>
            </div>

            <div className="whitespace-pre-wrap break-words text-base leading-8 text-[#344054] sm:text-[17px] sm:leading-9">
              {announcement.content}
            </div>

            <div className="mt-10 rounded-2xl border border-[#dbeafe] bg-[#e7f3ff] p-5 sm:p-7">
              <h2 className="text-xl font-extrabold tracking-tight text-[#1c1e21] sm:text-2xl">
                Stay connected with us
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#65676b] sm:text-base">
                Keep up with church announcements, upcoming programmes,
                and opportunities to grow in the Word.
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href="/news"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1877f2] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#0866ff]"
                >
                  More news
                  <ArrowRight size={17} />
                </Link>

                <Link
                  href="/programs"
                  className="inline-flex items-center justify-center rounded-xl border border-[#ccd0d5] bg-white px-5 py-3 text-sm font-bold text-[#1c1e21] transition-colors hover:bg-[#f7f8fa]"
                >
                  Explore programmes
                </Link>
              </div>
            </div>
          </div>
        </article>

        {/* Footer note */}
        <p className="mt-6 text-center text-xs leading-5 text-[#65676b]">
          The Word Ministries International · Faith, the Word, and
          Transformation
        </p>
      </div>

      <BottomNavigation />
    </main>
  );
}