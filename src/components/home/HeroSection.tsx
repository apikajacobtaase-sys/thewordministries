
"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";

import {
  ArrowDown,
  ArrowUpRight,
  Play,
  Sparkles,
} from "lucide-react";

export default function HeroSection() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="relative isolate flex min-h-[570px] flex-col justify-end overflow-hidden bg-[#e7f3ff] sm:min-h-[620px]">
      {/* Background image */}

      <div
        aria-hidden="true"
        className="absolute inset-0 -z-20 bg-cover bg-center"
          style={{
  backgroundImage:
    "url('https://images.unsplash.com/photo-1438032005730-c779502df39b?auto=format&fit=crop&w=1800&q=85')",
}}
      />

  {/* Soft overlay for readable text and visual depth */}
<div
  aria-hidden="true"
  className="absolute inset-0 -z-10 bg-gradient-to-b from-white/20 via-white/45 to-white"
/>

<div
  aria-hidden="true"
  className="absolute inset-0 -z-10 bg-gradient-to-r from-white/95 via-white/80 to-white/20"
/>
      <motion.div
        initial={
          shouldReduceMotion
            ? false
            : {
                opacity: 0,
                y: 20,
              }
        }
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.7,
          ease: "easeOut",
        }}
        className="mx-auto w-full max-w-[480px] px-5 pb-10 pt-16 md:max-w-[768px] md:pb-14"
      >
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#1877f2]/15 bg-white/90 px-3 py-2 shadow-sm backdrop-blur-md">
          <Sparkles
            size={13}
            className="text-[#1877f2]"
            aria-hidden="true"
          />

          <span className="text-[9px] font-bold uppercase tracking-[0.19em] text-[#1877f2]">
           Faith | The Word | Transformation
          </span>
        </div>

        <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.24em] text-[#65676b]">
          Welcome to
        </p>

          <h1 className="display-font max-w-[420px] text-[48px] leading-[1.02] tracking-[-0.045em] text-[#1c1e21] sm:text-[64px]">
  The Word
  <br />
  <span className="gold-gradient italic">Ministries</span>
  <br />
  <span className="text-[32px] font-normal tracking-[-0.02em] text-[#343a40] sm:text-[44px]">
    International
  </span>
</h1>
        <p className="mt-6 max-w-[310px] text-[13px] leading-7 text-[#444950]">
          Discover the Word. Grow in faith. Experience a community devoted to
          knowing God and transforming lives.
        </p>
           <div className="mt-8 flex flex-col gap-3 sm:flex-row">
  <Link
    href="/sermons"
    className="gold-button group w-full justify-center gap-2 shadow-lg shadow-[#1877f2]/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl sm:w-auto"
  >
    <Play size={15} fill="currentColor" aria-hidden="true" />
    Watch the Word
    <ArrowUpRight
      size={14}
      aria-hidden="true"
      className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
    />
  </Link>

  <Link
    href="/programs"
    className="outline-button group w-full justify-center gap-2 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#e7f3ff] sm:w-auto"
  >
    Explore Programs
    <ArrowUpRight
      size={15}
      aria-hidden="true"
      className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
    />
  </Link>
</div>
        <Link
          href="/prayer"
          className="mt-6 inline-flex items-center gap-2 text-[11px] text-[#65676b] transition-colors hover:text-[#1877f2]"
        >
          We would love to pray with you.
          <ArrowUpRight size={13} aria-hidden="true" />
        </Link>
      </motion.div>

      <div className="pointer-events-none absolute right-5 top-1/2 hidden -translate-y-1/2 flex-col items-center gap-3 text-[#65676b] md:flex">
        <span className="text-[9px] uppercase tracking-[0.25em] [writing-mode:vertical-rl]">
          A life in the Word
        </span>

        <div className="h-16 w-px bg-gradient-to-b from-[#1877f2] to-transparent" />
      </div>

      <div className="absolute bottom-4 right-5 flex items-center gap-2 text-[9px] uppercase tracking-[0.15em] text-[#65676b]">
        <ArrowDown size={13} aria-hidden="true" />
        Discover
      </div>
    </section>
  );
}


