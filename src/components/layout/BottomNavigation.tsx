
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  House,
  BookOpen,
  CalendarDays,
  HandHeart,
  Menu,
} from "lucide-react";

const navigationItems = [
  {
    label: "Home",
    href: "/",
    icon: House,
  },
  {
    label: "The Word",
    href: "/sermons",
    icon: BookOpen,
  },
  {
    label: "Programs",
    href: "/programs",
    icon: CalendarDays,
  },
  {
    label: "Prayer",
    href: "/prayer",
    icon: HandHeart,
  },
  {
    label: "More",
    href: "/more",
    icon: Menu,
  },
];

export default function BottomNavigation() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main navigation"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-[#1877f2]/10 bg-white/95 shadow-[0_-8px_30px_rgba(28,30,33,0.07)] backdrop-blur-2xl"
    >
      <div
        className="mx-auto grid max-w-[480px] grid-cols-5 px-2 pt-2 md:max-w-[768px] md:px-5"
        style={{
          paddingBottom: "max(8px, env(safe-area-inset-bottom))",
        }}
      >
        {navigationItems.map((item) => {
          const Icon = item.icon;

          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href ||
                pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={`group relative flex min-h-[62px] flex-col items-center justify-center gap-1.5 rounded-2xl px-1 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1877f2] focus-visible:ring-offset-2 ${
                isActive
                  ? "text-[#1877f2]"
                  : "text-[#65676b] hover:text-[#1877f2]"
              }`}
            >
              {isActive && (
                <span
                  aria-hidden="true"
                  className="absolute -top-2 h-[3px] w-8 rounded-full bg-[#1877f2] shadow-[0_0_10px_rgba(24,119,242,0.25)]"
                />
              )}

              <span
                className={`flex h-9 w-12 items-center justify-center rounded-xl transition-all duration-300 ${
                  isActive
                    ? "bg-[#e7f3ff]"
                    : "bg-transparent group-hover:bg-[#f0f6ff]"
                }`}
              >
                <Icon
                  size={21}
                  strokeWidth={isActive ? 2.2 : 1.7}
                  aria-hidden="true"
                  className={`transition-transform duration-300 ${
                    isActive ? "-translate-y-0.5 scale-105" : "group-hover:-translate-y-0.5"
                  }`}
                />
              </span>

              <span
                className={`text-[9px] leading-none transition-all duration-300 ${
                  isActive
                    ? "font-extrabold tracking-[0.01em]"
                    : "font-medium"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}