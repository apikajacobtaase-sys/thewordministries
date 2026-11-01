import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function getAuthenticatedUser() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) return null;

  return db.user.findFirst({
    where: {
      id: userId,
      isActive: true,
    },
    select: { id: true },
  });
}

export async function GET() {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Authentication required." },
        { status: 401 },
      );
    }

    const notifications = await db.notification.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        reads: {
          where: { userId: user.id },
          select: { id: true, readAt: true },
          take: 1,
        },
      },
    });

    const data = notifications.map((notification) => {
      const read = notification.reads[0] ?? null;

      return {
        id: notification.id,
        title: notification.title,
        message: notification.message,
        url: notification.url,
        createdAt: notification.createdAt,
        isRead: Boolean(read),
        readAt: read?.readAt ?? null,
      };
    });

    const unreadCount = data.filter(
      (notification) => !notification.isRead,
    ).length;

    return NextResponse.json(
      {
        success: true,
        data,
        unreadCount,
      },
      {
        headers: { "Cache-Control": "no-store" },
      },
    );
  } catch (error) {
    console.error("Notifications GET failed:", error);

    return NextResponse.json(
      { success: false, message: "Unable to retrieve notifications." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Authentication required." },
        { status: 401 },
      );
    }

    let parsed: unknown;

    try {
      parsed = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid JSON body." },
        { status: 400 },
      );
    }

    if (
      !parsed ||
      typeof parsed !== "object" ||
      Array.isArray(parsed)
    ) {
      return NextResponse.json(
        { success: false, message: "A JSON object is required." },
        { status: 400 },
      );
    }

    const body = parsed as Record<string, unknown>;

    for (const key of Object.keys(body)) {
      if (!["notificationId", "markAll"].includes(key)) {
        return NextResponse.json(
          { success: false, message: `Unsupported field: ${key}` },
          { status: 400 },
        );
      }
    }

    if (body.markAll === true) {
      await db.notificationRead.createMany({
        data: (
          await db.notification.findMany({
            select: { id: true },
          })
        ).map((notification) => ({
          notificationId: notification.id,
          userId: user.id,
        })),
        skipDuplicates: true,
      });

      return NextResponse.json({
        success: true,
        message: "All notifications marked as read.",
      });
    }

    if (
      typeof body.notificationId !== "string" ||
      !body.notificationId.trim()
    ) {
      return NextResponse.json(
        { success: false, message: "A valid notificationId or markAll flag is required." },
        { status: 400 },
      );
    }

    const notification = await db.notification.findUnique({
      where: { id: body.notificationId },
      select: { id: true },
    });

    if (!notification) {
      return NextResponse.json(
        { success: false, message: "Notification not found." },
        { status: 404 },
      );
    }

    await db.notificationRead.upsert({
      where: {
        notificationId_userId: {
          notificationId: notification.id,
          userId: user.id,
        },
      },
      create: {
        notificationId: notification.id,
        userId: user.id,
      },
      update: {},
    });

    return NextResponse.json({
      success: true,
      message: "Notification marked as read.",
    });
  } catch (error) {
    console.error("Notifications PATCH failed:", error);

    return NextResponse.json(
      { success: false, message: "Unable to update notification status." },
      { status: 500 },
    );
  }
}
