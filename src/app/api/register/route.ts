import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;

function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  return forwardedFor?.split(",")[0]?.trim() || "unknown";
}

function rateLimitResponse(retryAfterSeconds: number) {
  return NextResponse.json(
    {
      error: "Too many registration attempts. Please try again later.",
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

function normalizeGhanaPhone(phone: string): string | null {
  const cleaned = phone.trim().replace(/[\s()-]/g, "");

  if (/^\d{9}$/.test(cleaned)) return `+233${cleaned}`;
  if (/^0\d{9}$/.test(cleaned)) return `+233${cleaned.slice(1)}`;
  if (/^\+233\d{9}$/.test(cleaned)) return cleaned;
  if (/^233\d{9}$/.test(cleaned)) return `+${cleaned}`;

  return null;
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { error: "Invalid registration data." },
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

    const password =
      typeof data.password === "string" ? data.password : "";

    const rawPhone =
      typeof data.phone === "string" ? data.phone : "";

    const phone = normalizeGhanaPhone(rawPhone);

    if (name.length < 2 || name.length > 80) {
      return NextResponse.json(
        { error: "Name must be between 2 and 80 characters." },
        { status: 400 },
      );
    }

    if (
      email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      return NextResponse.json(
        { error: "Enter a valid email address." },
        { status: 400 },
      );
    }

    if (password.length < 12 || password.length > 128) {
      return NextResponse.json(
        { error: "Password must be between 12 and 128 characters." },
        { status: 400 },
      );
    }

    if (!phone) {
      return NextResponse.json(
        {
          error:
            "Enter a valid Ghanaian phone number, such as 0241234567 or 241234567.",
        },
        { status: 400 },
      );
    }

    const ip = getClientIp(request);

    const ipLimit = await checkRateLimit(`register:ip:${ip}`, {
      limit: 10,
      windowMs: RATE_LIMIT_WINDOW_MS,
    });

    if (!ipLimit.allowed) {
      return rateLimitResponse(ipLimit.retryAfterSeconds);
    }

    const emailLimit = await checkRateLimit(`register:email:${email}`, {
      limit: 3,
      windowMs: RATE_LIMIT_WINDOW_MS,
    });

    if (!emailLimit.allowed) {
      return rateLimitResponse(emailLimit.retryAfterSeconds);
    }

    const [existingEmail, existingPhone] = await Promise.all([
      db.user.findUnique({
        where: { email },
        select: { id: true },
      }),
      db.user.findUnique({
        where: { phone },
        select: { id: true },
      }),
    ]);

    if (existingEmail && existingPhone) {
      return NextResponse.json(
        {
          error: "This email address and phone number are already linked to existing accounts. Please sign in or use different details.",
          field: "email",
          conflict: "both",
        },
        { status: 409 },
      );
    }

    if (existingEmail) {
      return NextResponse.json(
        {
          error: "This email address is already registered. Please sign in or use another email address.",
          field: "email",
          conflict: "email",
        },
        { status: 409 },
      );
    }

    if (existingPhone) {
      return NextResponse.json(
        {
          error: "This phone number is already registered. Please sign in or use another phone number.",
          field: "phone",
          conflict: "phone",
        },
        { status: 409 },
      );
    }

    const passwordHash = await hash(password, 12);

    const user = await db.user.create({
      data: {
        name,
        email,
        phone,
        passwordHash,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    return NextResponse.json(
      {
        message: "Account created successfully. You can now sign in.",
        user,
      },
      { status: 201 },
    );
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "An account with those details already exists." },
        { status: 409 },
      );
    }

    console.error("Registration request failed.", error);

    return NextResponse.json(
      { error: "Unable to process your registration right now." },
      { status: 500 },
    );
  }
}