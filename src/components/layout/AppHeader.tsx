"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Bell } from "lucide-react";

export default function AppHeader() {
  const { status } = useSession();
  const [unreadCount, setUnreadCount] = useState(0);

  const loadUnreadCount = useCallback(async () => {
    if (status !== "authenticated") {
      setUnreadCount(0);
      return;
    }

    try {
      const response = await fetch("/api/notifications", {
        cache: "no-store",
      });

      if (!response.ok) return;

      const result = await response.json();
      setUnreadCount(result.unreadCount ?? 0);
    } catch (error) {
      console.error("Unread notification count failed:", error);
    }
  }, [status]);

  useEffect(() => {
    void loadUnreadCount();

    const interval = window.setInterval(loadUnreadCount, 60000);

    return () => window.clearInterval(interval);
  }, [loadUnreadCount]);

  return (
    <header className="sticky top-0 z-40 border-b border-[#1877f2]/10 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] max-w-[480px] items-center justify-between px-5 md:max-w-[768px]">
        <Link
          href="/"
          className="group flex min-w-0 items-center gap-3"
          aria-label="The Word Ministries International home"
        >
          <Image
            src="/icons/icon-512.png"
            alt="The Word Ministries International logo"
            width={44}
            height={44}
            priority
            className="h-11 w-11 shrink-0 rounded-xl object-contain transition-transform duration-300 group-hover:scale-105"
          />

          <div className="min-w-0">
            <p className="truncate text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#1c1e21] transition-colors group-hover:text-[#1877f2]">
              The Word Ministries
            </p>

            <div className="mt-1 flex items-center gap-2">
              <span
                aria-hidden="true"
                className="h-px w-4 bg-[#1877f2]"
              />

              <p className="text-[9px] font-semibold uppercase tracking-[0.24em] text-[#65676b]">
                International
              </p>
            </div>
          </div>
        </Link>

        <Link
          href="/notifications"
          aria-label={
            unreadCount > 0
              ? `Notifications, ${unreadCount} unread`
              : "View notifications"
          }
          className="group relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#e4e6eb] bg-[#f8fafc] text-[#1877f2] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#1877f2]/20 hover:bg-[#e7f3ff] hover:shadow-md"
        >
          <Bell
            size={19}
            strokeWidth={1.8}
            aria-hidden="true"
            className="transition-transform duration-300 group-hover:-rotate-6"
          />

          {unreadCount > 0 && (
            <span
              aria-hidden="true"
              className="absolute -right-1.5 -top-1.5 flex h-[19px] min-w-[19px] items-center justify-center rounded-full border-2 border-white bg-[#e41e3f] px-1 text-[9px] font-extrabold text-white"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
