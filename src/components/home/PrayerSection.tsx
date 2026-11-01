
import Link from "next/link";
import {
  ArrowUpRight,
  HeartHandshake,
  Sparkles,
} from "lucide-react";

export default function PrayerSection() {
  return (
    <section className="bg-[#f0f2f5] px-5 py-10">
      <div className="relative overflow-hidden rounded-[26px] border border-[#1877f2]/10 bg-white shadow-sm transition-shadow duration-300 hover:shadow-lg">
        <div
          aria-hidden="true"
          className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[#1877f2]/[0.07] blur-3xl"
        />

        <div
          aria-hidden="true"
          className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-[#e7f3ff] blur-3xl"
        />

        <div className="relative p-6 sm:p-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#1877f2]/15 bg-[#e7f3ff] text-[#1877f2] shadow-sm">
            <HeartHandshake
              size={27}
              strokeWidth={1.6}
              aria-hidden="true"
            />
          </div>

          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-[#1877f2]/10 bg-[#e7f3ff]/80 px-3 py-2">
            <Sparkles
              size={13}
              className="text-[#1877f2]"
              aria-hidden="true"
            />
            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#1877f2]">
              You Are Not Alone
            </span>
          </div>

          <h2 className="display-font mt-4 max-w-[330px] text-[32px] leading-[1.12] tracking-[-0.04em] text-[#1c1e21] sm:text-[36px]">
            Let Us Stand With You in Prayer.
          </h2>

          <p className="mt-4 max-w-[340px] text-[12px] leading-7 text-[#65676b]">
            Whatever you are facing, you do not have to face it alone. Share
            what is on your heart with our ministry, and let us join you in
            prayer.
          </p>

          <div className="mt-5 flex items-start gap-3 rounded-xl border border-[#e4e6eb] bg-[#f8fafc] p-4">
            <HeartHandshake
              size={17}
              className="mt-0.5 shrink-0 text-[#1877f2]"
              aria-hidden="true"
            />
            <p className="text-[11px] leading-6 text-[#65676b]">
              Your prayer request deserves care and respect. Please review the
              privacy information on the prayer form before submitting.
            </p>
          </div>

          <Link
            href="/prayer"
            className="group mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#1877f2] px-5 py-3 text-[11px] font-bold text-white shadow-lg shadow-[#1877f2]/20 transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#0866ff] hover:shadow-xl"
          >
            Submit a Prayer Request
            <ArrowUpRight
              size={16}
              aria-hidden="true"
              className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </Link>
        </div>
      </div>
    </section>
  );
}
