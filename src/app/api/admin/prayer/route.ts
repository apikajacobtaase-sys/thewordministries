import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { auth } from "@/lib/auth";
import { db } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return {
      error: NextResponse.json(
        { success: false, message: "Authentication required." },
        { status: 401 },
      ),
    };
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { role: true, isActive: true },
  });

  if (
    !user ||
    !user.isActive ||
    (user.role !== UserRole.ADMIN &&
      user.role !== UserRole.SUPER_ADMIN)
  ) {
    return {
      error: NextResponse.json(
        { success: false, message: "Administrator access required." },
        { status: 403 },
      ),
    };
  }

  return { authorized: true };
}

export async function GET() {
  const access = await requireAdmin();

  if (access.error) return access.error;

  try {
    const [requests, total, pending, inProgress, answered, archived] =
      await Promise.all([
        db.prayerRequest.findMany({
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            name: true,
            email: true,
            subject: true,
            message: true,
            isAnonymous: true,
            isPrivate: true,
            status: true,
            createdAt: true,
            updatedAt: true,
          },
        }),
        db.prayerRequest.count(),
        db.prayerRequest.count({ where: { status: "PENDING" } }),
        db.prayerRequest.count({ where: { status: "IN_PROGRESS" } }),
        db.prayerRequest.count({ where: { status: "ANSWERED" } }),
        db.prayerRequest.count({ where: { status: "ARCHIVED" } }),
      ]);

    const safeRequests = requests.map((request) => ({
      ...request,
      name: request.isAnonymous ? null : request.name,
      email: request.isAnonymous ? null : request.email,
    }));

    return NextResponse.json(
      {
        success: true,
        data: safeRequests,
        stats: {
          total,
          pending,
          inProgress,
          answered,
          archived,
        },
      },
      {
        headers: { "Cache-Control": "no-store" },
      },
    );
  } catch (error) {
    console.error("Admin prayer GET failed:", error);

    return NextResponse.json(
      { success: false, message: "Unable to retrieve prayer requests." },
      { status: 500 },
    );
  }
}
