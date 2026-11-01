import { redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Bookmark,
  UserRound,
  ShieldCheck,
  LogOut,
  ChevronRight,
  Mail,
  Phone,
} from "lucide-react";

import AppHeader from "@/components/layout/AppHeader";
import BottomNavigation from "@/components/layout/BottomNavigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/prisma";
import { logout } from "./actions";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "My Account",
  description: "Manage your account at The Word Ministries International.",
};

export default async function AccountPage() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    redirect("/login?callbackUrl=%2Faccount");
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      image: true,
      role: true,
      isActive: true,
      createdAt: true,
      churchPosition: {
        select: {
          name: true,
          isExecutive: true,
          isActive: true,
        },
      },
    },
  });

  if (!user || !user.isActive) {
    redirect("/login?callbackUrl=%2Faccount");
  }

  const displayName = user.name?.trim() || "Member";
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");

  return (
    <div className="page-shell">
      <AppHeader />

      <main className="container-mobile min-h-screen px-5 pb-28 pt-7">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#65676b] transition hover:text-[#1877f2]"
        >
          <ArrowLeft size={16} />
          Home
        </Link>

        <section className="mb-7 mt-6">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#1877f2]">
            Member Area
          </p>

          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-[#1c1e21]">
            My Account
          </h1>

          <p className="mt-1 text-sm text-[#65676b]">
            Your personal ministry account.
          </p>
        </section>

        <section className="rounded-2xl border border-[#e4e6eb] bg-white p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#e7f3ff] text-xl font-extrabold text-[#1877f2]">
              {initials || <UserRound size={27} />}
            </div>

            <div className="min-w-0">
              <h2 className="truncate text-lg font-extrabold text-[#1c1e21]">
                {displayName}
              </h2>

              <p className="mt-1 text-xs font-semibold text-[#1877f2]">
                {user.role.replaceAll("_", " ")}
              </p>

              {user.churchPosition?.isActive && (
                <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[#e7f3ff] px-3 py-1 text-xs font-bold text-[#1877f2]">
                  <ShieldCheck size={13} />
                  {user.churchPosition.name}
                  {user.churchPosition.isExecutive && "  Executive"}
                </div>
              )}

              <p className="mt-1 text-[11px] text-[#65676b]">
                Member since{" "}
                {user.createdAt.toLocaleDateString("en-GH", {
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-4 border-t border-[#e4e6eb] pt-5">
            <div className="flex items-center gap-3">
              <Mail size={17} className="shrink-0 text-[#1877f2]" />
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#65676b]">
                  Email address
                </p>
                <p className="truncate text-sm font-medium text-[#1c1e21]">
                  {user.email}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Phone size={17} className="shrink-0 text-[#1877f2]" />
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#65676b]">
                  Phone number
                </p>
                <p className="text-sm font-medium text-[#1c1e21]">
                  {user.phone || "Not provided"}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6">
          <h2 className="mb-3 text-sm font-extrabold text-[#1c1e21]">
            Account & Library
          </h2>

          <div className="overflow-hidden rounded-2xl border border-[#e4e6eb] bg-white">
            <Link
              href="/account/saved-sermons"
              className="flex min-h-[68px] items-center justify-between px-4 transition hover:bg-[#f5f9ff]"
            >
              <span className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e7f3ff] text-[#1877f2]">
                  <Bookmark size={19} />
                </span>

                <span>
                  <span className="block text-sm font-bold text-[#1c1e21]">
                    Saved Sermons
                  </span>
                  <span className="mt-1 block text-xs text-[#65676b]">
                    Revisit your saved teachings
                  </span>
                </span>
              </span>

              <ChevronRight size={19} className="text-[#8a8d91]" />
            </Link>

            <div className="mx-4 border-t border-[#e4e6eb]" />

            <Link
              href="/account/edit"
              className="flex min-h-[68px] items-center justify-between px-4 transition hover:bg-[#f5f9ff]"
            >
              <span className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e7f3ff] text-[#1877f2]">
                  <UserRound size={19} />
                </span>

                <span>
                  <span className="block text-sm font-bold text-[#1c1e21]">
                    Profile Information
                  </span>
                  <span className="mt-1 block text-xs text-[#65676b]">
                    Manage your personal details
                  </span>
                </span>
              </span>

              <ChevronRight size={19} className="text-[#8a8d91]" />
            </Link>

            <div className="mx-4 border-t border-[#e4e6eb]" />

            <Link
              href="/account/change-password"
              className="flex min-h-[68px] items-center justify-between px-4 transition hover:bg-[#f5f9ff]"
            >
              <span className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e7f3ff] text-[#1877f2]">
                  <ShieldCheck size={19} />
                </span>

                <span>
                  <span className="block text-sm font-bold text-[#1c1e21]">
                    Account Security
                  </span>
                  <span className="mt-1 block text-xs text-[#65676b]">
                    Password and security settings
                  </span>
                </span>
              </span>

              <ChevronRight size={19} className="text-[#8a8d91]" />
            </Link>
          </div>
        </section>

        <form action={logout} className="mt-7">
          <button
            type="submit"
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 text-sm font-bold text-red-600 transition hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </form>

        <p className="mt-5 text-center text-[11px] text-[#8a8d91]">
          The Word Ministries International
        </p>
      </main>

      <BottomNavigation />
    </div>
  );
}
