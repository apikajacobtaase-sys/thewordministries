import { NextResponse } from "next/server";
import { compare, hash } from "bcryptjs";
import { auth } from "@/lib/auth";
import { db } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;

export async function POST(request: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Please sign in to change your password." },
        { status: 401 },
      );
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        isActive: true,
        passwordHash: true,
      },
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { success: false, message: "Your account is unavailable." },
        { status: 403 },
      );
    }

    if (!user.passwordHash) {
      return NextResponse.json(
        {
          success: false,
          message: "This account does not have a password. Please use the password reset process to set one.",
        },
        { status: 400 },
      );
    }

    const rateLimit = await checkRateLimit(
      `account-change-password:${userId}`,
      { limit: 5, windowMs: RATE_LIMIT_WINDOW_MS },
    );

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          message: "Too many attempts. Please try again later.",
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimit.retryAfterSeconds),
          },
        },
      );
    }

    const body: unknown = await request.json().catch(() => null);

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { success: false, message: "Invalid request." },
        { status: 400 },
      );
    }

    const data = body as Record<string, unknown>;

    const currentPassword =
      typeof data.currentPassword === "string"
        ? data.currentPassword
        : "";

    const newPassword =
      typeof data.newPassword === "string"
        ? data.newPassword
        : "";

    if (!currentPassword || currentPassword.length > 128) {
      return NextResponse.json(
        { success: false, message: "Enter your current password." },
        { status: 400 },
      );
    }

    if (newPassword.length < 12 || newPassword.length > 128) {
      return NextResponse.json(
        {
          success: false,
          message: "Your new password must be between 12 and 128 characters.",
        },
        { status: 400 },
      );
    }

    const passwordMatches = await compare(
      currentPassword,
      user.passwordHash,
    );

    if (!passwordMatches) {
      return NextResponse.json(
        { success: false, message: "Your current password is incorrect." },
        { status: 400 },
      );
    }

    const samePassword = await compare(
      newPassword,
      user.passwordHash,
    );

    if (samePassword) {
      return NextResponse.json(
        {
          success: false,
          message: "Your new password must be different from your current password.",
        },
        { status: 400 },
      );
    }

    const newPasswordHash = await hash(newPassword, 12);

    const updated = await db.$transaction(async (tx) => {
      const result = await tx.user.updateMany({
        where: {
          id: userId,
          isActive: true,
          passwordHash: user.passwordHash,
        },
        data: {
          passwordHash: newPasswordHash,
          authVersion: { increment: 1 },
        },
      });

      if (result.count !== 1) {
        return false;
      }

      await tx.passwordResetToken.deleteMany({
        where: { userId },
      });

      return true;
    });

    if (!updated) {
      return NextResponse.json(
        {
          success: false,
          message: "Your password could not be changed. Please sign in again and retry.",
        },
        { status: 409 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Your password has been changed successfully. Please sign in again.",
    });
  } catch (error) {
    console.error("Account password change failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to change your password right now. Please try again.",
      },
      { status: 500 },
    );
  }
}

