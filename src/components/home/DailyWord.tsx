
import Link from "next/link";
import { ArrowUpRight, BookOpen, Sparkles } from "lucide-react";

export default function DailyWord() {
  return (
    <section className="bg-[#f0f2f5] px-5 py-10">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.24em] text-[#1877f2]">
            Spiritual Growth
          </p>

          <h2 className="display-font text-[27px] font-semibold tracking-[-0.04em] text-[#1c1e21]">
            Your Daily Word
          </h2>

          <p className="mt-2 text-xs leading-5 text-[#65676b]">
            Take a moment to reflect on God&apos;s Word.
          </p>
        </div>

        <div className="mb-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#1877f2]/15 bg-[#e7f3ff] text-[#1877f2] shadow-sm">
          <BookOpen size={21} strokeWidth={1.7} aria-hidden="true" />
        </div>
      </div>

      <article className="relative overflow-hidden rounded-[24px] border border-[#1877f2]/10 bg-white p-6 shadow-sm sm:p-7">
        <div
          aria-hidden="true"
          className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-[#e7f3ff] blur-3xl"
        />

        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#1877f2]/10 bg-[#e7f3ff] px-3 py-2">
            <Sparkles
              size={13}
              className="text-[#1877f2]"
              aria-hidden="true"
            />
            <span className="text-[9px] font-bold uppercase tracking-[0.17em] text-[#1877f2]">
              A Moment in the Word
            </span>
          </div>

          <div
            aria-hidden="true"
            className="display-font mt-5 text-5xl leading-none text-[#1877f2]/20"
          >
            &ldquo;
          </div>

          <blockquote className="display-font -mt-1 text-[23px] leading-[1.5] tracking-[-0.025em] text-[#1c1e21] sm:text-[26px]">
            Your word is a lamp to my feet and a light to my path.
          </blockquote>

          <div className="mt-5 flex items-center gap-3">
            <div className="h-px w-8 bg-[#1877f2]" />
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#1877f2]">
              Psalm 119:105
            </p>
          </div>

          <p className="mt-5 text-[12px] leading-7 text-[#65676b]">
            Make room for God&apos;s Word every day. Let it guide your decisions,
            strengthen your faith, and shape the way you live.
          </p>

          <div className="mt-6 border-t border-[#e4e6eb] pt-5">
            <Link
              href="/more"
              className="group inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#1877f2] px-5 py-3 text-[11px] font-bold text-white shadow-md shadow-[#1877f2]/15 transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#0866ff] hover:shadow-lg"
            >
              Explore More
              <ArrowUpRight
                size={15}
                aria-hidden="true"
                className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </Link>
          </div>
        </div>
      </article>
    </section>
  );
}