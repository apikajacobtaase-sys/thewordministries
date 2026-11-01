 import AppHeader from "@/components/layout/AppHeader";
import BottomNavigation from "@/components/layout/BottomNavigation";

import HeroSection from "@/components/home/HeroSection";
import FeaturedProgram from "@/components/home/FeaturedProgram";
import FeaturedSermon from "@/components/home/FeaturedSermon";
import PrayerSection from "@/components/home/PrayerSection";
import DailyWord from "@/components/home/DailyWord";

import { ArrowUpRight, Heart } from "lucide-react";

export default function HomePage() {
  return (
    <div className="page-shell">
      <AppHeader />

      <main className="container-mobile">
        <HeroSection />

        <FeaturedProgram />

        <FeaturedSermon />

        <PrayerSection />

        <DailyWord />
        
<section className="relative overflow-hidden bg-white px-5 pb-12 pt-10">
  <div
    aria-hidden="true"
    className="absolute -right-16 -top-12 h-40 w-40 rounded-full bg-[#e7f3ff] blur-3xl"
  />

  <div className="relative border-t border-[#e4e6eb] pt-8 text-center">
    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[#1877f2]/15 bg-[#e7f3ff] text-[#1877f2] shadow-sm">
      <Heart size={23} strokeWidth={1.6} aria-hidden="true" />
    </div>

    <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.24em] text-[#1877f2]">
      A Place to Belong
    </p>

    <h2 className="display-font mt-3 text-[29px] leading-tight tracking-[-0.04em] text-[#1c1e21] sm:text-[34px]">
      You Are Welcome Here.
    </h2>

    <p className="mx-auto mt-4 max-w-[320px] text-[12px] leading-7 text-[#65676b]">
      Come discover the truth of God&apos;s Word, grow in faith, and experience
      a community committed to prayer, worship, and transforming lives through
      Jesus Christ.
    </p>

    <a
      href="/about"
      className="group mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#1877f2] px-5 py-3 text-[11px] font-bold text-white shadow-lg shadow-[#1877f2]/15 transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#0866ff] hover:shadow-xl"
    >
      Discover Our Ministry
      <ArrowUpRight
        size={15}
        aria-hidden="true"
        className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
      />
    </a>
  </div>
</section>
      </main>

      <BottomNavigation />
    </div>
  );
}