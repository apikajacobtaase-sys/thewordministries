import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { auth } from "@/lib/auth";
import { db } from "@/lib/prisma";
import PrayerManager from "./PrayerManager";

export const dynamic = "force-dynamic";

export default async function AdminPrayerPage() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    redirect("/login?callbackUrl=%2Fadmin%2Fprayer");
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      role: true,
      isActive: true,
    },
  });

  if (!user || !user.isActive) {
    redirect("/login?callbackUrl=%2Fadmin%2Fprayer");
  }

  if (
    user.role !== UserRole.ADMIN &&
    user.role !== UserRole.SUPER_ADMIN
  ) {
    redirect("/");
  }

  return <PrayerManager />;
}
