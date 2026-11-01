import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { db } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

function normalizeGhanaPhone(phone: string): string | null {
  const cleaned = phone.trim().replace(/[\s()-]/g, "");

  if (/^\d{9}$/.test(cleaned)) return `+233${cleaned}`;
  if (/^0\d{9}$/.test(cleaned)) return `+233${cleaned.slice(1)}`;
  if (/^\+233\d{9}$/.test(cleaned)) return cleaned;
  if (/^233\d{9}$/.test(cleaned)) return `+${cleaned}`;

  return null;
}

export async function PATCH(request: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Please sign in to update your profile." },
        { status: 401 },
      );
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, isActive: true },
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { success: false, message: "Your account is unavailable." },
        { status: 403 },
      );
    }

    const rateLimit = await checkRateLimit(
      `account-profile:${userId}`,
      { limit: 10, windowMs: 15 * 60 * 1000 },
    );

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, message: "Too many requests. Please try again shortly." },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimit.retryAfterSeconds),
          },
        },
      );
    }

    const body = await request.json().catch(() => null);

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { success: false, message: "Invalid profile information." },
        { status: 400 },
      );
    }

    if (
      typeof body.name !== "string" ||
      body.name.trim().length < 2 ||
      body.name.trim().length > 80
    ) {
      return NextResponse.json(
        { success: false, message: "Name must be between 2 and 80 characters." },
        { status: 400 },
      );
    }

    if (body.phone !== undefined && typeof body.phone !== "string") {
      return NextResponse.json(
        { success: false, message: "Invalid phone number." },
        { status: 400 },
      );
    }

    const name = body.name.trim();
    const rawPhone = typeof body.phone === "string" ? body.phone.trim() : "";
    let phone: string | null = null;

    if (rawPhone) {
      phone = normalizeGhanaPhone(rawPhone);

      if (!phone) {
        return NextResponse.json(
          { success: false, message: "Enter a valid Ghanaian phone number." },
          { status: 400 },
        );
      }
    }

    const updatedUser = await db.user.update({
      where: { id: userId },
      data: { name, phone },
      select: {
        name: true,
        email: true,
        phone: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Your profile has been updated.",
      user: updatedUser,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "This phone number is already associated with another account.",
        },
        { status: 409 },
      );
    }

    console.error("Account profile update failed:", error);

    return NextResponse.json(
      { success: false, message: "Unable to update your profile. Please try again." },
      { status: 500 },
    );
  }
}
