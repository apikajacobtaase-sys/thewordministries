import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { auth } from "@/lib/auth";
import { db } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { sendPushNotification } from "@/lib/push";

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
    select: { id: true, role: true, isActive: true },
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

  return { user };
}

const allowedPushHosts = [
  "fcm.googleapis.com",
  "updates.push.services.mozilla.com",
  "push.services.mozilla.com",
  "web.push.apple.com",
];

function isTrustedPushEndpoint(endpoint: string) {
  try {
    const url = new URL(endpoint);

    return (
      url.protocol === "https:" &&
      allowedPushHosts.some(
        (host) =>
          url.hostname === host ||
          url.hostname.endsWith(`.${host}`),
      )
    );
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const access = await requireAdmin();

  if (access.error) return access.error;

  const rateLimit = await checkRateLimit(
    `notification-broadcast:${access.user.id}`,
    { limit: 5, windowMs: 15 * 60 * 1000 },
  );

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { success: false, message: "Too many broadcasts. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimit.retryAfterSeconds),
        },
      },
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

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return NextResponse.json(
      { success: false, message: "A JSON object is required." },
      { status: 400 },
    );
  }

  const body = parsed as Record<string, unknown>;

  for (const key of Object.keys(body)) {
    if (!["title", "message", "url"].includes(key)) {
      return NextResponse.json(
        { success: false, message: `Unsupported field: ${key}` },
        { status: 400 },
      );
    }
  }

  const title =
    typeof body.title === "string" ? body.title.trim() : "";
  const message =
    typeof body.message === "string" ? body.message.trim() : "";
  const url =
    typeof body.url === "string" && body.url.trim()
      ? body.url.trim()
      : "/";

  if (!title || title.length > 120) {
    return NextResponse.json(
      { success: false, message: "Title is required and must not exceed 120 characters." },
      { status: 400 },
    );
  }

  if (!message || message.length > 1000) {
    return NextResponse.json(
      { success: false, message: "Message is required and must not exceed 1,000 characters." },
      { status: 400 },
    );
  }

  if (
    !url.startsWith("/") ||
    url.startsWith("//") ||
    url.includes("\\")
  ) {
    return NextResponse.json(
      { success: false, message: "URL must be a safe internal path beginning with /." },
      { status: 400 },
    );
  }

  try {
    const notification = await db.notification.create({
      data: {
        title,
        message,
        url,
        createdById: access.user.id,
      },
    });

    const subscriptions = await db.pushSubscription.findMany({
      select: {
        id: true,
        endpoint: true,
        p256dh: true,
        auth: true,
      },
    });

    let sent = 0;
    let failed = 0;
    let removed = 0;

    for (let index = 0; index < subscriptions.length; index += 50) {
      const batch = subscriptions.slice(index, index + 50);

      const results = await Promise.allSettled(
        batch.map(async (subscription) => {
          if (!isTrustedPushEndpoint(subscription.endpoint)) {
            await db.pushSubscription.delete({
              where: { id: subscription.id },
            });
            return "removed" as const;
          }

          try {
            await sendPushNotification(
              {
                endpoint: subscription.endpoint,
                p256dh: subscription.p256dh,
                auth: subscription.auth,
              },
              {
                title,
                body: message,
                url,
                tag: `church-notification-${notification.id}`,
              },
            );

            return "sent" as const;
          } catch (error) {
            const statusCode =
              typeof error === "object" &&
              error !== null &&
              "statusCode" in error
                ? (error as { statusCode?: number }).statusCode
                : undefined;

            if (statusCode === 404 || statusCode === 410) {
              await db.pushSubscription.delete({
                where: { id: subscription.id },
              });
              return "removed" as const;
            }

            console.error(
              `Push delivery failed for subscription ${subscription.id}:`,
              error,
            );

            return "failed" as const;
          }
        }),
      );

      for (const result of results) {
        if (result.status === "rejected") {
          failed++;
        } else if (result.value === "sent") {
          sent++;
        } else if (result.value === "removed") {
          removed++;
        } else {
          failed++;
        }
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: "Church-wide notification created.",
        data: {
          notificationId: notification.id,
          subscriptions: subscriptions.length,
          sent,
          failed,
          removed,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Notification broadcast failed:", error);

    return NextResponse.json(
      { success: false, message: "Unable to send the notification." },
      { status: 500 },
    );
  }
}
