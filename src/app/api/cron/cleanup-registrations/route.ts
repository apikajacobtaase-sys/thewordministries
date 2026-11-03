import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");

  if (!secret || !authorization) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  const expected = Buffer.from(`Bearer ${secret}`);
  const received = Buffer.from(authorization);

  if (
    expected.length !== received.length ||
    !timingSafeEqual(expected, received)
  ) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  try {
    const now = new Date();

    const [pending, challenges] = await db.$transaction([
      db.pendingRegistration.deleteMany({
        where: { expiresAt: { lte: now } },
      }),
      db.verificationChallenge.deleteMany({
        where: { expiresAt: { lte: now } },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: "Expired registration records cleaned successfully.",
      deleted: {
        pendingRegistrations: pending.count,
        verificationChallenges: challenges.count,
      },
      executedAt: now.toISOString(),
    });
  } catch (error) {
    console.error("[REGISTRATION CLEANUP CRON]", error);

    return NextResponse.json(
      { error: "Registration cleanup failed." },
      { status: 500 },
    );
  }
}
