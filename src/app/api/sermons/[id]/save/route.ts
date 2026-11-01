import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { db } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(
  _request: Request,
  context: RouteContext,
) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json(
      { success: false, message: "Please sign in to save sermons." },
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

  const { id } = await context.params;

  if (!id || id.length > 100) {
    return NextResponse.json(
      { success: false, message: "Invalid sermon." },
      { status: 400 },
    );
  }

  const sermon = await db.sermon.findFirst({
    where: { id, published: true },
    select: { id: true },
  });

  if (!sermon) {
    return NextResponse.json(
      { success: false, message: "Sermon not found." },
      { status: 404 },
    );
  }

  const rateLimit = await checkRateLimit(
    `sermon-save:${userId}`,
    { limit: 30, windowMs: 15 * 60 * 1000 },
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

  const where = {
    sermonId_userId: {
      sermonId: id,
      userId,
    },
  };

  try {
    const existing = await db.savedSermon.findUnique({ where });

    let saved: boolean;

    if (existing) {
      await db.savedSermon.delete({ where });
      saved = false;
    } else {
      await db.savedSermon.create({
        data: { sermonId: id, userId },
      });
      saved = true;
    }

    return NextResponse.json({
      success: true,
      saved,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json({
        success: true,
        saved: true,
      });
    }

    console.error("Sermon save failed:", error);

    return NextResponse.json(
      { success: false, message: "Unable to update your saved sermons." },
      { status: 500 },
    );
  }
}