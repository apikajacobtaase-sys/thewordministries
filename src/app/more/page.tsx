import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  ChevronRight,
  Church,
  CircleHelp,
  Heart,
  LogIn,
  LogOut,
  Mail,
  Newspaper,
  ShieldCheck,
  UserRound,
  Users,
  Bookmark,
  HandHeart,
  LayoutDashboard,
} from "lucide-react";

import AppHeader from "@/components/layout/AppHeader";
import BottomNavigation from "@/components/layout/BottomNavigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/prisma";
import { logout } from "@/app/account/actions";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "More",
  description:
    "Explore The Word Ministries International, access church resources, and manage your account.",
};

type MenuItem = {
  label: string;
  description: string;
  href: string;
  icon: typeof Church;
};

function MenuSection({
  title,
  items,
}: {
  title: string;
  items: MenuItem[];
}) {
  return (
    <section className="mt-7">
      <h2 className="mb-3 text-sm font-extrabold text-[#1c1e21]">
        {title}
      </h2>

      <div className="overflow-hidden rounded-2xl border border-[#e4e6eb] bg-white shadow-sm">
        {items.map((item, index) => {
          const Icon = item.icon;

          return (
            <div key={item.href}>
              {index > 0 && (
                <div className="mx-4 border-t border-[#e4e6eb]" />
              )}

              <Link
                href={item.href}
                className="group flex min-h-[72px] items-center justify-between gap-3 px-4 transition-colors hover:bg-[#f5f9ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#1877f2]"
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e7f3ff] text-[#1877f2] transition-transform group-hover:scale-105">
                    <Icon size={19} strokeWidth={1.8} />
                  </span>

                  <span className="min-w-0">
                    <span className="block text-sm font-bold text-[#1c1e21]">
                      {item.label}
                    </span>
                    <span className="mt-1 block text-xs text-[#65676b]">
                      {item.description}
                    </span>
                  </span>
                </span>

                <ChevronRight
                  size={18}
                  className="shrink-0 text-[#8a8d91] transition-transform group-hover:translate-x-0.5 group-hover:text-[#1877f2]"
                />
              </Link>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default async function MorePage() {
  const session = await auth();
  const userId = session?.user?.id;

  const user = userId
    ? await db.user.findUnique({
        where: { id: userId },
        select: {
          name: true,
          email: true,
          role: true,
          isActive: true,
        },
      })
    : null;

  const isMember = Boolean(user?.isActive);
  const displayName = user?.name?.trim() || "Member";

  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");

  const churchItems: MenuItem[] = [
    {
      label: "About Our Ministry",
      description: "Our story, vision, mission and leadership",
      href: "/about",
      icon: Church,
    },
    {
      label: "Ministry News",
      description: "Updates, announcements and testimonies",
      href: "/news",
      icon: Newspaper,
    },
    {
      label: "Programs & Events",
      description: "Discover upcoming ministry gatherings",
      href: "/programs",
      icon: CalendarDays,
    },
  ];

  const resourceItems: MenuItem[] = [
    {
      label: "The Word",
      description: "Explore sermons and biblical teachings",
      href: "/sermons",
      icon: BookOpen,
    },
    {
      label: "Prayer Requests",
      description: "Share your prayer needs with us",
      href: "/prayer",
      icon: HandHeart,
    },
  ];

  const accountItems: MenuItem[] = [
    {
      label: "My Account",
      description: "View your personal account",
      href: "/account",
      icon: UserRound,
    },
    {
      label: "Saved Sermons",
      description: "Return to your saved teachings",
      href: "/account/saved-sermons",
      icon: Bookmark,
    },
    {
      label: "Edit Profile",
      description: "Update your personal information",
      href: "/account/edit",
      icon: Users,
    },
    {
      label: "Account Security",
      description: "Manage your password and security",
      href: "/account/change-password",
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="page-shell">
      <AppHeader />

      <main className="container-mobile min-h-screen px-5 pb-32 pt-7">
        <section>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#1877f2]">
            Discover More
          </p>

          <h1 className="mt-2 text-[28px] font-extrabold tracking-tight text-[#1c1e21]">
            Explore & Connect
          </h1>

          <p className="mt-2 max-w-[340px] text-sm leading-6 text-[#65676b]">
            Everything you need to stay connected with The Word Ministries
            International.
          </p>
        </section>

        {isMember ? (
          <section className="relative mt-7 overflow-hidden rounded-2xl border border-[#1877f2]/10 bg-white p-5 shadow-sm">
            <div
              aria-hidden="true"
              className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-[#e7f3ff] blur-2xl"
            />

            <div className="relative flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#e7f3ff] text-lg font-extrabold text-[#1877f2]">
                {initials || <UserRound size={24} />}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#1877f2]">
                  Welcome back
                </p>

                <h2 className="mt-1 truncate text-lg font-extrabold text-[#1c1e21]">
                  {displayName}
                </h2>

                <p className="mt-1 truncate text-xs text-[#65676b]">
                  {user?.email}
                </p>
              </div>

              <Link
                href="/account"
                aria-label="View my account"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f0f6ff] text-[#1877f2] transition hover:bg-[#e7f3ff]"
              >
                <ArrowUpRight size={19} />
              </Link>
            </div>
          </section>
        ) : (
          <section className="relative mt-7 overflow-hidden rounded-2xl bg-[#1877f2] p-5 text-white shadow-lg shadow-[#1877f2]/15">
            <div
              aria-hidden="true"
              className="absolute -right-12 -top-16 h-44 w-44 rounded-full border-[28px] border-white/10"
            />

            <div className="relative">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15">
                <Church size={23} />
              </div>

              <h2 className="mt-5 text-xl font-extrabold">
                You Belong Here.
              </h2>

              <p className="mt-2 max-w-[290px] text-xs leading-6 text-white/85">
                Join our community and stay connected to the Word, prayer,
                fellowship and the work of God.
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href="/login"
                   className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-white px-4 text-xs font-bold !text-[#1877f2] transition hover:bg-[#e7f3ff]"
                >
                  <LogIn size={15} />
                  Sign In
                </Link>

                <Link
                  href="/register"
                  className="inline-flex min-h-10 items-center justify-center rounded-xl border border-white/40 px-4 text-xs font-bold text-white transition hover:bg-white/10"
                >
                  Create Account
                  <ArrowRight size={14} className="ml-2" />
                </Link>
              </div>
            </div>
          </section>
        )}

        <MenuSection title="Our Church" items={churchItems} />

        <MenuSection title="Faith & Resources" items={resourceItems} />

        {isMember && (
          <MenuSection title="My Account" items={accountItems} />
        )}

        {isMember &&
          (user?.role === "ADMIN" || user?.role === "SUPER_ADMIN") && (
            <section className="mt-7">
              <Link
                href="/admin"
                className="flex min-h-[68px] items-center justify-between rounded-2xl border border-[#1877f2]/15 bg-[#e7f3ff] px-4 transition hover:bg-[#dcecff]"
              >
                <span className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#1877f2]">
                    <LayoutDashboard size={19} />
                  </span>

                  <span>
                    <span className="block text-sm font-bold text-[#1c1e21]">
                      Administration
                    </span>
                    <span className="mt-1 block text-xs text-[#65676b]">
                      Manage ministry content and services
                    </span>
                  </span>
                </span>

                <ChevronRight size={19} className="text-[#1877f2]" />
              </Link>
            </section>
          )}

        <section className="mt-7 rounded-2xl border border-[#e4e6eb] bg-white p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e7f3ff] text-[#1877f2]">
              <Heart size={19} />
            </span>

            <div className="min-w-0">
              <h2 className="text-sm font-extrabold text-[#1c1e21]">
                We Are Here for You
              </h2>

              <p className="mt-1 text-xs leading-5 text-[#65676b]">
                Whether you need prayer, spiritual guidance or want to learn
                more about the ministry, you are welcome.
              </p>

              <Link
                href="/prayer"
                className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-[#1877f2] hover:underline"
              >
                Connect with us
                <ArrowUpRight size={14} />
              </Link>
            </div>
          </div>
        </section>

        {isMember ? (
          <form action={logout} className="mt-7">
            <button
              type="submit"
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 text-sm font-bold text-red-600 transition hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
            >
              <LogOut size={17} />
              Sign Out
            </button>
          </form>
        ) : (
          <Link
            href="/login"
            className="mt-7 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-[#e4e6eb] bg-white text-sm font-bold text-[#65676b] transition hover:border-[#1877f2]/30 hover:text-[#1877f2]"
          >
            <LogIn size={17} />
            Member Sign In
          </Link>
        )}

        <div className="mt-8 border-t border-[#e4e6eb] pt-5 text-center">
          <div className="flex items-center justify-center gap-2 text-[#1877f2]">
            <Church size={17} />
            <span className="text-xs font-extrabold">
              The Word Ministries International
            </span>
          </div>

          <p className="mt-2 text-[10px] text-[#8a8d91]">
            Your salvation, our priority.
          </p>
        </div>
      </main>

      <BottomNavigation />
    </div>
  );
}
