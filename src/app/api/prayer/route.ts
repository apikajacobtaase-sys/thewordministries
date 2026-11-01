
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const MAX_MESSAGE_LENGTH = 5000;

function getClientIp(request: Request): string {
  // Trust forwarded IP headers only when configured by a trusted proxy.
  const forwardedFor = request.headers.get("x-forwarded-for");
  const firstForwardedIp = forwardedFor?.split(",")[0]?.trim();

  return firstForwardedIp || "unknown";
}

function rateLimitResponse(retryAfterSeconds: number) {
  return NextResponse.json(
    {
      error:
        "Too many prayer requests have been submitted. Please try again later.",
      retryAfterSeconds,
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfterSeconds),
      },
    },
  );
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { error: "Invalid prayer request data." },
        { status: 400 },
      );
    }

    const data = body as Record<string, unknown>;

    const name =
      typeof data.name === "string" ? data.name.trim() : "";

    const email =
      typeof data.email === "string"
        ? data.email.trim().toLowerCase()
        : "";

    const subject =
      typeof data.subject === "string" ? data.subject.trim() : "";

    const message =
      typeof data.message === "string" ? data.message.trim() : "";

    const isAnonymous = data.isAnonymous === true;
    const isPrivate = data.isPrivate !== false;

    if (message.length < 10 || message.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json(
        {
          error:
            "Your prayer request must be between 10 and 5000 characters.",
        },
        { status: 400 },
      );
    }

    if (name.length > 80) {
      return NextResponse.json(
        { error: "Your name must not exceed 80 characters." },
        { status: 400 },
      );
    }

    if (subject.length > 120) {
      return NextResponse.json(
        { error: "The subject must not exceed 120 characters." },
        { status: 400 },
      );
    }

    if (
      email.length > 254 ||
      (email !== "" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    ) {
      return NextResponse.json(
        { error: "Enter a valid email address." },
        { status: 400 },
      );
    }

    if (!isAnonymous && name.length === 1) {
      return NextResponse.json(
        { error: "Enter at least two characters for your name." },
        { status: 400 },
      );
    }

    const ip = getClientIp(request);

    const ipLimit = await checkRateLimit(`prayer:ip:${ip}`, {
      limit: 5,
      windowMs: RATE_LIMIT_WINDOW_MS,
    });

    if (!ipLimit.allowed) {
      return rateLimitResponse(ipLimit.retryAfterSeconds);
    }

    const session = await auth();

    // Anonymous requests deliberately do not store identifying details.
    const requestName = isAnonymous ? null : name || null;
    const requestEmail = isAnonymous ? null : email || null;

    const prayerRequest = await db.prayerRequest.create({
      data: {
        userId: isAnonymous ? null : session?.user?.id || null,
        name: requestName,
        email: requestEmail,
        subject: subject || null,
        message,
        isAnonymous,
        isPrivate,
        status: "PENDING",
      },
      select: {
        id: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message:
          "Your prayer request has been received. Thank you for sharing it with us.",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Prayer request submission failed.");

    return NextResponse.json(
      {
        error:
          "We could not submit your prayer request right now. Please try again later.",
      },
      { status: 500 },
    );
  }
}