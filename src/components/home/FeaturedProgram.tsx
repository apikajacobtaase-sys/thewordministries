
import Link from "next/link";
import {
  ArrowUpRight,
  CalendarDays,
  Clock,
  MapPin,
  Sparkles,
} from "lucide-react";

export default function FeaturedProgram() {
  return (
    <section className="bg-[#f0f2f5] px-5 py-10">
      <div className="mb-5 flex items-end justify-between gap-3">
        <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[#1877f2]">
            Gather in Faith
          </p>

          <h2 className="display-font text-[27px] tracking-[-0.04em] text-[#1c1e21]">
            Church Programs
          </h2>

          <p className="mt-2 max-w-[280px] text-[12px] leading-6 text-[#65676b]">
            Find a place to worship, grow, and connect with our community.
          </p>
        </div>

        <div className="mb-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#1877f2]/15 bg-[#e7f3ff] text-[#1877f2]">
          <CalendarDays size={21} aria-hidden="true" />
        </div>
      </div>

      <article className="relative overflow-hidden rounded-[25px] border border-[#1877f2]/10 bg-white shadow-sm transition-shadow duration-300 hover:shadow-lg">
        <div className="relative overflow-hidden bg-gradient-to-br from-[#0d3b78] via-[#1458a5] to-[#1877f2] px-6 py-7 text-white">
          <div
            aria-hidden="true"
            className="absolute -right-10 -top-14 h-48 w-48 rounded-full border border-white/15"
          />

          <div
            aria-hidden="true"
            className="absolute -right-2 -top-6 h-36 w-36 rounded-full border border-white/10"
          />

          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-2 backdrop-blur-sm">
              <Sparkles size={13} aria-hidden="true" />
              <span className="text-[9px] font-bold uppercase tracking-[0.18em]">
                Worship · Fellowship · Growth
              </span>
            </div>

            <h3 className="display-font mt-5 max-w-[300px] text-[30px] leading-tight tracking-[-0.035em] sm:text-[34px]">
              There Is a Place for You Here.
            </h3>

            <p className="mt-3 max-w-[290px] text-[12px] leading-6 text-white/80">
              Join us as we gather to worship God, study His Word, and grow
              together in faith.
            </p>
          </div>
        </div>

        <div className="p-5 sm:p-6">
          <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#1877f2]">
            Join Our Community
          </p>

          <h3 className="display-font mt-2 text-[22px] text-[#1c1e21]">
            Come Worship With Us
          </h3>

          <p className="mt-3 text-[12px] leading-7 text-[#65676b]">
            Explore our programs to learn about gathering times, locations,
            and opportunities to participate.
          </p>

          <div className="mt-5 space-y-3">
            <div className="flex items-center gap-3 rounded-xl bg-[#f0f2f5] p-3">
              <CalendarDays
                size={17}
                className="shrink-0 text-[#1877f2]"
                aria-hidden="true"
              />
              <span className="text-[11px] text-[#444950]">
                View upcoming church programs
              </span>
            </div>

            <div className="flex items-center gap-3 rounded-xl bg-[#f0f2f5] p-3">
              <Clock
                size={17}
                className="shrink-0 text-[#1877f2]"
                aria-hidden="true"
              />
              <span className="text-[11px] text-[#444950]">
                Check program dates and times
              </span>
            </div>

            <div className="flex items-center gap-3 rounded-xl bg-[#f0f2f5] p-3">
              <MapPin
                size={17}
                className="shrink-0 text-[#1877f2]"
                aria-hidden="true"
              />
              <span className="text-[11px] text-[#444950]">
                Find gathering locations
              </span>
            </div>
          </div>

          <Link
            href="/programs"
            className="group mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#1877f2] px-5 py-3 text-[11px] font-bold text-white shadow-md shadow-[#1877f2]/15 transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#0866ff] hover:shadow-lg"
          >
            Explore Church Programs
            <ArrowUpRight
              size={15}
              aria-hidden="true"
              className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </Link>
        </div>
      </article>
    </section>
  );
}