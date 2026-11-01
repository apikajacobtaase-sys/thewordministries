
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Headphones,
  Play,
  Sparkles,
} from "lucide-react";

import SectionHeading from "@/components/ui/SectionHeading";

export default function FeaturedSermon() {
  return (
    <section className="section-spacing">
      <SectionHeading
        eyebrow="Feed Your Spirit"
        title="The Word"
        description="Messages to strengthen your faith and deepen your understanding of Scripture."
        href="/sermons"
        linkLabel="Explore"
      />

      <article className="overflow-hidden rounded-[26px] border border-[#1877f2]/10 bg-white shadow-sm transition-shadow duration-300 hover:shadow-lg">
        <div className="relative flex min-h-[230px] items-end overflow-hidden bg-gradient-to-br from-[#dcecff] via-[#eef5ff] to-white p-6 sm:min-h-[260px] sm:p-7">
          <div
            aria-hidden="true"
            className="absolute -right-12 -top-16 h-64 w-64 rounded-full border border-[#1877f2]/10"
          />

          <div
            aria-hidden="true"
            className="absolute -right-3 -top-7 h-48 w-48 rounded-full border border-[#1877f2]/15"
          />

          <div
            aria-hidden="true"
            className="absolute right-12 top-12 h-24 w-24 rounded-full bg-[#1877f2]/5 blur-2xl"
          />

          <div className="relative z-10 max-w-[340px]">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#1877f2]/10 bg-white/80 px-3 py-2 text-[#1877f2] shadow-sm backdrop-blur-sm">
              <BookOpen size={14} aria-hidden="true" />
              <span className="text-[9px] font-bold uppercase tracking-[0.17em]">
                Scripture | Faith | Growth
              </span>
            </div>

            <h3 className="display-font text-[32px] leading-[1.1] tracking-[-0.04em] text-[#1c1e21] sm:text-[38px]">
              Discover Messages
              <br />
              <span className="italic text-[#1877f2]">That Transform.</span>
            </h3>

            <p className="mt-4 max-w-[270px] text-[12px] leading-6 text-[#4b5563]">
              Biblical teaching to inspire your faith and strengthen your walk
              with God.
            </p>
          </div>

          <div className="absolute right-5 top-5 flex h-12 w-12 items-center justify-center rounded-full border border-white bg-white/90 text-[#1877f2] shadow-lg backdrop-blur-sm transition-transform duration-300 hover:scale-105">
            <Play size={17} fill="currentColor" aria-hidden="true" />
          </div>

          <div className="absolute bottom-5 right-5 hidden items-center gap-2 text-[#1877f2]/60 sm:flex">
            <Sparkles size={15} aria-hidden="true" />
            <span className="text-[9px] font-bold uppercase tracking-[0.16em]">
              Grow in the Word
            </span>
          </div>
        </div>

        <div className="p-5 sm:p-6">
          <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#1877f2]">
            Explore the Library
          </p>

          <h3 className="display-font mt-2 text-[24px] tracking-[-0.025em] text-[#1c1e21]">
            Listen. Learn. Grow.
          </h3>

          <p className="mt-3 text-[12px] leading-7 text-[#65676b]">
            Explore published sermons by topic, Scripture, or speaker. Check
            each message for available audio or video.
          </p>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <Link
              href="/sermons"
              className="gold-button group w-full justify-center gap-2 shadow-md shadow-[#1877f2]/15 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
            >
              <Play size={14} fill="currentColor" aria-hidden="true" />
              Watch
              <ArrowUpRight
                size={14}
                aria-hidden="true"
                className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </Link>

            <Link
              href="/sermons"
              className="outline-button group w-full justify-center gap-2 transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#e7f3ff]"
            >
              <Headphones size={16} aria-hidden="true" />
              Listen
              <ArrowUpRight
                size={14}
                aria-hidden="true"
                className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </Link>
          </div>

          <Link
            href="/sermons"
            className="mt-5 flex min-h-10 items-center justify-center gap-2 text-[11px] font-semibold text-[#65676b] transition-colors hover:text-[#1877f2]"
          >
            Browse all sermons
            <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </div>
      </article>
    </section>
  );
}