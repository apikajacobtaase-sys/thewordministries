
import { createHash } from "node:crypto";
import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;

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
    { error: "Too many attempts. Please try again later." },
    {
      status: 429,
      headers: { "Retry-After": String(retryAfterSeconds) },
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

    const token =
      typeof data.token === "string" ? data.token : "";

    const password =
      typeof data.password === "string" ? data.password : "";

    if (!/^[A-Za-z0-9_-]{43}$/.test(token)) {
      return NextResponse.json(
        { error: "This reset link is invalid or has expired." },
        { status: 400 },
      );
    }

    if (password.length < 12 || password.length > 128) {
      return NextResponse.json(
        { error: "Password must be between 12 and 128 characters." },
        { status: 400 },
      );
    }

    const ip = getClientIp(request);
    const tokenHash = hashToken(token);

    const ipLimit = await checkRateLimit(
      `password-reset:confirm:ip:${ip}`,
      { limit: 10, windowMs: RATE_LIMIT_WINDOW_MS },
    );

    if (!ipLimit.allowed) {
      return rateLimitedResponse(ipLimit.retryAfterSeconds);
    }

    const tokenLimit = await checkRateLimit(
      `password-reset:confirm:token:${tokenHash}`,
      { limit: 5, windowMs: RATE_LIMIT_WINDOW_MS },
    );

    if (!tokenLimit.allowed) {
      return rateLimitedResponse(tokenLimit.retryAfterSeconds);
    }

    // Hash before entering the transaction to reduce the time the row is locked.
    const passwordHash = await hash(password, 12);
    const now = new Date();

    const result = await db.$transaction(async (tx) => {
      // Lock the token row so concurrent requests cannot use it twice.
      await tx.$queryRaw`
        SELECT "id"
        FROM "PasswordResetToken"
        WHERE "tokenHash" = ${tokenHash}
        FOR UPDATE
      `;

      const resetToken = await tx.passwordResetToken.findUnique({
        where: { tokenHash },
        select: {
          id: true,
          userId: true,
          expiresAt: true,
          usedAt: true,
          user: {
            select: {
              id: true,
              isActive: true,
            },
          },
        },
      });

      if (
        !resetToken ||
        resetToken.usedAt !== null ||
        resetToken.expiresAt <= now ||
        !resetToken.user.isActive
      ) {
        return false;
      }

      // Update the password and consume the token in one transaction.
      await tx.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash, authVersion: { increment: 1 } },
      });

      await tx.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: now },
      });

      // Invalidate any other outstanding reset links for this user.
      await tx.passwordResetToken.deleteMany({
        where: {
          userId: resetToken.userId,
          id: { not: resetToken.id },
        },
      });

      return true;
    });

    if (!result) {
      return NextResponse.json(
        { error: "This reset link is invalid or has expired." },
        { status: 400 },
      );
    }

    return NextResponse.json({
      message: "Your password has been reset successfully. You can now sign in.",
    });
  } catch {
    console.error("Password-reset confirmation failed.");

    return NextResponse.json(
      { error: "Unable to reset your password right now. Please try again." },
      { status: 500 },
    );
  }
}
