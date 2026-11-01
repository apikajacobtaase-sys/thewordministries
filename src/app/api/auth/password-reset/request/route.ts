
import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { db } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";

const TOKEN_EXPIRY_MS = 15 * 60 * 1000;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;

const GENERIC_RESPONSE = {
  message:
    "If an eligible account exists for that email, a password-reset link will be sent.",
};

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function getClientIp(request: Request): string {
  // Trust forwarded IP headers only when the hosting proxy sanitizes them.
  const forwardedFor = request.headers.get("x-forwarded-for");
  return forwardedFor?.split(",")[0]?.trim() || "unknown";
}

function rateLimitedResponse(retryAfterSeconds: number) {
  return NextResponse.json(
    { error: "Too many password-reset requests. Please try again later." },
    {
      status: 429,
      headers: { "Retry-After": String(retryAfterSeconds) },
    },
  );
}

function getAppUrl(): string {
  const configuredUrl = process.env.APP_URL?.trim();

  if (!configuredUrl) {
    throw new Error("APP_URL is not configured.");
  }

  const parsed = new URL(configuredUrl);

  if (
    parsed.protocol !== "https:" &&
    !(parsed.protocol === "http:" && parsed.hostname === "localhost")
  ) {
    throw new Error("APP_URL must use HTTPS outside local development.");
  }

  if (parsed.username || parsed.password || parsed.search || parsed.hash) {
    throw new Error("APP_URL contains unsupported URL components.");
  }

  return parsed.toString().replace(/\/$/, "");
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

    const ip = getClientIp(request);

    const ipLimit = await checkRateLimit(
      `password-reset:request:ip:${ip}`,
      { limit: 10, windowMs: RATE_LIMIT_WINDOW_MS },
    );

    if (!ipLimit.allowed) {
      return rateLimitedResponse(ipLimit.retryAfterSeconds);
    }

    const emailLimit = await checkRateLimit(
      `password-reset:request:email:${email}`,
      { limit: 3, windowMs: RATE_LIMIT_WINDOW_MS },
    );

    if (!emailLimit.allowed) {
      return rateLimitedResponse(emailLimit.retryAfterSeconds);
    }

    const user = await db.user.findUnique({
      where: { email },
      select: { id: true, email: true, isActive: true },
    });

    // Do not reveal whether an account exists or is active.
    if (!user || !user.isActive) {
      return NextResponse.json(GENERIC_RESPONSE);
    }

    if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
      console.error("Password-reset email configuration is missing.");
      return NextResponse.json(
        { error: "Password reset is temporarily unavailable." },
        { status: 503 },
      );
    }

    const appUrl = getAppUrl();
    const token = randomBytes(32).toString("base64url");
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MS);

    const tokenCreated = await db.$transaction(
      async (tx) => {
        // Serialize reset-token replacement for this account.
        const lockedUsers = await tx.$queryRaw<Array<{ id: string }>>`
          SELECT "id"
          FROM "User"
          WHERE "id" = ${user.id}
            AND "isActive" = TRUE
          FOR UPDATE
        `;

        if (lockedUsers.length === 0) {
          return false;
        }

        await tx.passwordResetToken.deleteMany({
          where: { userId: user.id },
        });

        await tx.passwordResetToken.create({
          data: {
            userId: user.id,
            tokenHash,
            expiresAt,
          },
        });

        return true;
      },
      {
        maxWait: 5000,
        timeout: 10000,
      },
    );

    if (!tokenCreated) {
      return NextResponse.json(GENERIC_RESPONSE);
    }
    const resetUrl = new URL(
      `/reset-password?token=${encodeURIComponent(token)}`,
      `${appUrl}/`,
    ).toString();

    const resend = new Resend(process.env.RESEND_API_KEY);

    try {
      const { error } = await resend.emails.send({
        from: process.env.EMAIL_FROM,
        to: user.email,
        subject: "Reset your password - The Word Ministries International",
        text: [
          "We received a request to reset your password.",
          "",
          `Open this link to choose a new password: ${resetUrl}`,
          "",
          "This link expires in 15 minutes and can only be used once.",
          "If you did not request a password reset, you can ignore this email.",
        ].join("\n"),
        html: `
          <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:24px;color:#172554">
            <h2>Password reset</h2>
            <p>We received a request to reset your password for The Word Ministries International.</p>
            <p>
              <a href="${resetUrl}" style="display:inline-block;padding:12px 20px;background:#1d4ed8;color:#ffffff;text-decoration:none;border-radius:6px">
                Reset password
              </a>
            </p>
            <p>This link expires in 15 minutes and can only be used once.</p>
            <p>If you did not request this, you can safely ignore this email.</p>
          </div>
        `,
      });
      if (error) {
        throw new Error("Password-reset email delivery failed.");
      }
    } catch {
      await db.passwordResetToken.deleteMany({
        where: { tokenHash },
      });

      console.error("Password-reset email delivery failed.");
      return NextResponse.json(
        { error: "Unable to send the reset email right now." },
        { status: 503 },
      );
    }

    return NextResponse.json(GENERIC_RESPONSE);
  } catch {
    console.error("Password-reset request failed.");
    return NextResponse.json(
      { error: "Unable to process the password-reset request." },
      { status: 500 },
    );
  }
}