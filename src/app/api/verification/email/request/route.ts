
import { NextResponse } from "next/server";
import { sendEmailVerificationCode } from "@/lib/email-verification";
import { checkRateLimit } from "@/lib/rate-limit";

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;

function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const firstForwardedIp = forwardedFor?.split(",")[0]?.trim();

  return firstForwardedIp || "unknown";
}

function rateLimitResponse(
  retryAfterSeconds: number,
  message = "Too many requests. Please try again later.",
) {
  return NextResponse.json(
    {
      error: message,
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
        { error: "Invalid request." },
        { status: 400 },
      );
    }

    const data = body as Record<string, unknown>;

    const email =
      typeof data.email === "string"
        ? data.email.trim().toLowerCase()
        : "";

    if (
      email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      return NextResponse.json(
        { error: "Enter a valid email address." },
        { status: 400 },
      );
    }


    // Preserve the existing IP-based protection.
    const ipLimit = await checkRateLimit(
      `verification:email:ip:${getClientIp(request)}`,
      {
        limit: 10,
        windowMs: RATE_LIMIT_WINDOW_MS,
      },
    );

    if (!ipLimit.allowed) {
      return rateLimitResponse(ipLimit.retryAfterSeconds);
    }

    // Preserve the existing email-based protection.
    const emailLimit = await checkRateLimit(
      `verification:email:address:${email}`,
      {
        limit: 3,
        windowMs: RATE_LIMIT_WINDOW_MS,
      },
    );

    if (!emailLimit.allowed) {
      return rateLimitResponse(emailLimit.retryAfterSeconds);
    }

    // Enforce a separate 60-second cooldown for each email address.
    const cooldown = await checkRateLimit(
      `verification:email:resend-cooldown:${email}`,
      {
        limit: 1,
        windowMs: RESEND_COOLDOWN_MS,
      },
    );

    if (!cooldown.allowed) {
      return rateLimitResponse(
        cooldown.retryAfterSeconds,
        "Please wait before requesting another verification code.",
      );
    }
    await sendEmailVerificationCode(email);

    return NextResponse.json({
      message:
        "If the address is eligible, a verification email will be sent.",
    });
  } catch (error) {
    console.error("Email verification request failed.", error);

    if (
      error instanceof Error &&
      error.message === "This email address is already verified."
    ) {
      return NextResponse.json({
        message:
          "If the address is eligible, a verification email will be sent.",
      });
    }

    return NextResponse.json(
      { error: "Unable to send a verification email right now." },
      { status: 500 },
    );
  }
}