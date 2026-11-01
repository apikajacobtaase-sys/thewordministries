 import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/prisma";
import {
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  Clock3,
  MapPin,
  Sparkles,
} from "lucide-react";

import AppHeader from "@/components/layout/AppHeader";
import BottomNavigation from "@/components/layout/BottomNavigation";

export const metadata: Metadata = {
  title: "Church Programs",
  description:
    "Discover upcoming services, gatherings, and special programs at The Word Ministries International.",
};

export const dynamic = "force-dynamic";

function formatEventDate(date: Date) {
  return new Intl.DateTimeFormat("en-GH", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Africa/Accra",
  }).format(date);
}

function formatEventTime(date: Date) {
  return new Intl.DateTimeFormat("en-GH", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Africa/Accra",
  }).format(date);
}

export default async function ProgramsPage() {
  const now = new Date();

  const events = await db.event.findMany({
    where: {
      status: "PUBLISHED",
      OR: [{ endDate: null }, { endDate: { gte: now } }],
    },
    orderBy: {
      startDate: "asc",
    },
  });

  return (
    <div className="page-shell">
      <AppHeader />

      <main className="container-mobile min-h-screen pb-28">
        <section className="px-5 pb-7 pt-7">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-medium text-[#65676b] transition-colors hover:text-[#1877f2]"
          >
            <ArrowLeft size={15} aria-hidden="true" />
            Back to Home
          </Link>

          <div className="mt-7 flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#1877f2]/15 bg-[#e7f3ff] text-[#1877f2]">
              <CalendarDays
                size={23}
                strokeWidth={1.7}
                aria-hidden="true"
              />
            </div>

            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-[#1877f2]">
                Gather · Worship · Grow
              </p>

              <h1 className="display-font mt-1 text-[30px] leading-tight text-[#1c1e21]">
                Church Programs
              </h1>
            </div>
          </div>

          <p className="mt-4 max-w-md text-[12px] leading-7 text-[#65676b]">
            Find a place to worship, connect with others, and grow in your
            understanding of God&apos;s Word. Explore the upcoming programs
            of The Word Ministries International.
          </p>
        </section>

        <section className="px-5 pb-5">
          <div className="relative overflow-hidden rounded-[26px] bg-gradient-to-br from-[#0866ff] via-[#1877f2] to-[#0b4db8] p-6 text-white shadow-lg shadow-[#1877f2]/15">
            <div
              aria-hidden="true"
              className="absolute -right-10 -top-12 h-40 w-40 rounded-full border-[24px] border-white/[0.08]"
            />

            <div className="relative">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/20 bg-white/10">
                <Sparkles size={22} aria-hidden="true" />
              </div>

              <p className="mt-5 text-[9px] font-bold uppercase tracking-[0.22em] text-blue-100">
                There Is a Place for You
              </p>

              <h2 className="display-font mt-2 max-w-xs text-[27px] leading-tight">
                Let&apos;s Gather in Faith.
              </h2>

              <p className="mt-3 max-w-xs text-[12px] leading-6 text-blue-50">
                Stay connected with the life of our church and discover
                opportunities to worship, learn, and fellowship together.
              </p>
            </div>
          </div>
        </section>

        <section className="px-5 pb-8 pt-5">
          <div className="mb-5 flex items-end justify-between gap-3">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#1877f2]">
                Your Next Gathering
              </p>

              <h2 className="display-font mt-1 text-2xl text-[#1c1e21]">
                Upcoming Programs
              </h2>
            </div>

            <span className="shrink-0 rounded-full border border-[#e4e6eb] bg-white px-3 py-1.5 text-[10px] font-semibold text-[#65676b]">
              {events.length} {events.length === 1 ? "event" : "events"}
            </span>
          </div>

          {events.length > 0 ? (
            <div className="space-y-4">
              {events.map((event) => (
                <article
                  key={event.id}
                  className="overflow-hidden rounded-[22px] border border-[#e4e6eb] bg-white shadow-sm transition-shadow duration-300 hover:shadow-md"
                >
                  {event.image ? (
                    <div className="aspect-[16/8] overflow-hidden bg-[#e7f3ff]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={event.image}
                        alt={event.title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex aspect-[16/5] items-center justify-center bg-gradient-to-br from-[#e7f3ff] to-white">
                      <CalendarDays
                        size={35}
                        strokeWidth={1.4}
                        className="text-[#1877f2]"
                        aria-hidden="true"
                      />
                    </div>
                  )}

                  <div className="p-5">
                    <div className="inline-flex items-center gap-2 rounded-full bg-[#e7f3ff] px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.12em] text-[#1877f2]">
                      <CalendarDays size={12} aria-hidden="true" />
                      {formatEventDate(event.startDate)}
                    </div>

                    <h3 className="display-font mt-4 text-[22px] leading-snug text-[#1c1e21]">
                      {event.title}
                    </h3>

                    <p className="mt-3 whitespace-pre-line text-[12px] leading-7 text-[#65676b]">
                      {event.description}
                    </p>

                    <div className="mt-4 space-y-3 border-t border-[#e4e6eb] pt-4">
                      <div className="flex items-start gap-3 text-[11px] text-[#65676b]">
                        <Clock3
                          size={16}
                          className="mt-0.5 shrink-0 text-[#1877f2]"
                          aria-hidden="true"
                        />

                        <div>
                          <p className="font-semibold text-[#1c1e21]">
                            {formatEventTime(event.startDate)}
                          </p>

                          {event.endDate && (
                            <p className="mt-1">
                              Ends {formatEventDate(event.endDate)}
                              {` · ${formatEventTime(event.endDate)}`}
                            </p>
                          )}
                        </div>
                      </div>

                      {event.location && (
                        <div className="flex items-start gap-3 text-[11px] text-[#65676b]">
                          <MapPin
                            size={16}
                            className="mt-0.5 shrink-0 text-[#1877f2]"
                            aria-hidden="true"
                          />

                          <span>{event.location}</span>
                        </div>
                      )}
                    </div>

                    {event.registrationRequired && (
                      <div className="mt-5 rounded-xl border border-[#e4e6eb] bg-[#f8fafc] p-3 text-[11px] leading-5 text-[#65676b]">
                        Registration is required for this program. Please
                        contact the ministry for registration details.
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-[24px] border border-[#e4e6eb] bg-white px-6 py-12 text-center shadow-sm">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[#1877f2]/10 bg-[#e7f3ff] text-[#1877f2]">
                <CalendarDays
                  size={25}
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
              </div>

              <h3 className="display-font mt-5 text-2xl text-[#1c1e21]">
                New Gatherings Are on the Way
              </h3>

              <p className="mx-auto mt-3 max-w-xs text-[12px] leading-7 text-[#65676b]">
                There are no upcoming published programs to display right
                now. Please check back for updates from the ministry.
              </p>

              <Link
                href="/sermons"
                className="group mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#1877f2] px-5 py-3 text-[11px] font-bold text-white transition-colors hover:bg-[#0866ff]"
              >
                Explore Sermons
                <ArrowUpRight
                  size={15}
                  aria-hidden="true"
                  className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                />
              </Link>
            </div>
          )}
        </section>
      </main>

      <BottomNavigation />
    </div>
  );
}