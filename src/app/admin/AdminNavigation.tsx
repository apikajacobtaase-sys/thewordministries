"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Church,
  Newspaper,
  CalendarDays,
  Video,
  HeartHandshake,
  Bell,
  ArrowLeft,
} from "lucide-react";

const navigation = [
  { label: "Overview", href: "/admin", icon: LayoutDashboard },
  { label: "About Ministry", href: "/admin/about", icon: Church },
  { label: "News", href: "/admin/news", icon: Newspaper },
  { label: "Programs", href: "/admin/programs", icon: CalendarDays },
  { label: "Sermons", href: "/admin/sermons", icon: Video },
  { label: "Prayer Requests", href: "/admin/prayer", icon: HeartHandshake },
  { label: "Notifications", href: "/admin/notifications", icon: Bell },
];

function ChurchLogo({ size = 44 }: { size?: number }) {
  return (
    <Image
      src="/icons/icon-512.png"
      alt="The Word Ministries International logo"
      width={size}
      height={size}
      priority
      className="shrink-0 rounded-xl object-contain"
    />
  );
}

export default function AdminNavigation() {
  const pathname = usePathname();

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[250px] flex-col border-r border-[#e4e6eb] bg-white lg:flex">
        <div className="border-b border-[#e4e6eb] px-5 py-6">
          <Link href="/admin" className="flex items-center gap-3">
            <ChurchLogo size={44} />
            <span>
              <span className="block text-sm font-extrabold text-[#1c1e21]">
                The Word Ministries
              </span>
              <span className="mt-1 block text-[10px] font-bold uppercase tracking-wider text-[#1877f2]">
                Admin Panel
              </span>
            </span>
          </Link>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          <p className="mb-3 px-3 text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#8a8d91]">
            Workspace
          </p>

          {navigation.map((item) => {
            const Icon = item.icon;
            const active =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-bold transition ${
                  active
                    ? "bg-[#e7f3ff] text-[#1877f2]"
                    : "text-[#65676b] hover:bg-[#f0f2f5] hover:text-[#1c1e21]"
                }`}
              >
                <Icon size={19} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-[#e4e6eb] p-4">
          <Link
            href="/more"
            className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-bold text-[#65676b] transition hover:bg-[#f0f2f5]"
          >
            <ArrowLeft size={18} />
            Back to Website
          </Link>
        </div>
      </aside>

      <header className="sticky top-0 z-40 border-b border-[#e4e6eb] bg-white lg:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/admin" className="flex items-center gap-2">
            <ChurchLogo size={38} />
            <span>
              <span className="block text-sm font-extrabold text-[#1c1e21]">
                The Word Ministries
              </span>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-[#1877f2]">
                Admin Panel
              </span>
            </span>
          </Link>

          <Link
            href="/more"
            aria-label="Back to website"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f0f2f5] text-[#65676b]"
          >
            <ArrowLeft size={18} />
          </Link>
        </div>

        <nav className="flex gap-2 overflow-x-auto px-4 pb-3">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex shrink-0 items-center gap-2 rounded-full px-3 py-2 text-xs font-bold transition ${
                  active
                    ? "bg-[#1877f2] text-white"
                    : "bg-[#f0f2f5] text-[#65676b]"
                }`}
              >
                <Icon size={15} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>
    </>
  );
}


