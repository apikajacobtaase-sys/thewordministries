import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;

export async function POST(request: Request) {
  try {
    const forwardedFor = request.headers.get("x-forwarded-for");
    const ip = forwardedFor?.split(",")[0]?.trim() || "unknown";

    const limit = await checkRateLimit(
      `push-subscribe:${ip}`,
      {
        limit: 20,
        windowMs: RATE_LIMIT_WINDOW_MS,
      },
    );

    if (!limit.allowed) {
      return NextResponse.json(
        { error: "Too many subscription attempts. Please try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": String(limit.retryAfterSeconds),
          },
        },
      );
    }

    const body: unknown = await request.json();

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { error: "Invalid subscription data." },
        { status: 400 },
      );
    }

    const subscription = body as Record<string, unknown>;
    const endpoint =
      typeof subscription.endpoint === "string"
        ? subscription.endpoint.trim()
        : "";

    const keys =
      subscription.keys &&
      typeof subscription.keys === "object" &&
      !Array.isArray(subscription.keys)
        ? subscription.keys as Record<string, unknown>
        : {};

    const p256dh =
      typeof keys.p256dh === "string" ? keys.p256dh : "";

    const authKey =
      typeof keys.auth === "string" ? keys.auth : "";

    let parsedEndpoint: URL;

    try {
      parsedEndpoint = new URL(endpoint);
    } catch {
      return NextResponse.json(
        { error: "Invalid push endpoint." },
        { status: 400 },
      );
    }

    if (
      parsedEndpoint.protocol !== "https:" ||
      endpoint.length > 2048 ||
      !p256dh ||
      p256dh.length > 512 ||
      !authKey ||
      authKey.length > 512
    ) {
      return NextResponse.json(
        { error: "Invalid push subscription credentials." },
        { status: 400 },
      );
    }

    const session = await auth();
    const userId = session?.user?.id || null;

    await db.pushSubscription.upsert({
      where: { endpoint },
      create: {
        endpoint,
        p256dh,
        auth: authKey,
        userId,
      },
      update: {
        p256dh,
        auth: authKey,
        userId,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Push notifications enabled successfully.",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Push subscription failed:", error);

    return NextResponse.json(
      { error: "Could not save your notification subscription." },
      { status: 500 },
    );
  }
}
