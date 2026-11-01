import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, UserRound } from "lucide-react";

import AppHeader from "@/components/layout/AppHeader";
import BottomNavigation from "@/components/layout/BottomNavigation";
import ProfileForm from "@/components/account/ProfileForm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Edit Profile",
  description: "Update your personal account information.",
};

export default async function EditProfilePage() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    redirect("/login?callbackUrl=%2Faccount%2Fedit");
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      email: true,
      phone: true,
      isActive: true,
    },
  });

  if (!user || !user.isActive) {
    redirect("/login?callbackUrl=%2Faccount%2Fedit");
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
              <UserRound size={23} />
            </div>

            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-[#1c1e21]">
                Edit Profile
              </h1>
              <p className="mt-1 text-xs text-[#65676b]">
                Keep your personal information up to date.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-[#e4e6eb] bg-white p-5 shadow-sm">
          <ProfileForm
            name={user.name || ""}
            email={user.email}
            phone={user.phone || ""}
          />
        </section>

        <p className="mt-5 text-center text-xs leading-5 text-[#8a8d91]">
          Your personal information is protected by your account authentication.
        </p>
      </main>

      <BottomNavigation />
    </div>
  );
}
