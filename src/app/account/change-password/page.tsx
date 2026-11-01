import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";

import AppHeader from "@/components/layout/AppHeader";
import BottomNavigation from "@/components/layout/BottomNavigation";
import ChangePasswordForm from "@/components/account/ChangePasswordForm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Change Password",
  description: "Update your account password securely.",
};

export default async function ChangePasswordPage() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    redirect("/login?callbackUrl=%2Faccount%2Fchange-password");
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      isActive: true,
      passwordHash: true,
    },
  });

  if (!user || !user.isActive) {
    redirect("/login?callbackUrl=%2Faccount%2Fchange-password");
  }

  return (
    <div className="page-shell">
      <AppHeader />

      <main className="container-mobile min-h-screen px-5 pb-28 pt-7">
        <Link
          href="/account"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#65676b] transition hover:text-[#1877f2]"
        >
          <ArrowLeft size={16} />
          My Account
        </Link>

        <section className="mb-7 mt-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e7f3ff] text-[#1877f2]">
              <ShieldCheck size={23} />
            </div>

            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-[#1c1e21]">
                Change Password
              </h1>
              <p className="mt-1 text-xs text-[#65676b]">
                Keep your account secure with a strong password.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-[#e4e6eb] bg-white p-5 shadow-sm">
          {user.passwordHash ? (
            <ChangePasswordForm />
          ) : (
            <div className="rounded-xl border border-[#e4e6eb] bg-[#f7f8fa] p-4">
              <p className="text-sm font-bold text-[#1c1e21]">
                Password not yet configured
              </p>
              <p className="mt-2 text-sm leading-6 text-[#65676b]">
                This account does not currently have a password. Please use the
                password reset process to set one.
              </p>
              <Link
                href="/forgot-password"
                className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl bg-[#1877f2] px-5 text-sm font-bold text-white transition hover:bg-[#0866ff]"
              >
                Set a Password
              </Link>
            </div>
          )}
        </section>

        <p className="mt-5 text-center text-xs leading-5 text-[#8a8d91]">
          Never share your password with anyone, including ministry staff.
        </p>
      </main>

      <BottomNavigation />
    </div>
  );
}
