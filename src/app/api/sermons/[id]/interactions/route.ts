import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(
  _request: Request,
  context: RouteContext,
) {
  const { id } = await context.params;

  if (!id || id.length > 100) {
    return NextResponse.json(
      { success: false, message: "Invalid sermon." },
      { status: 400 },
    );
  }

  try {
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

    const session = await auth();
    const sessionUserId = session?.user?.id;

    let userId: string | null = null;

    if (sessionUserId) {
      const user = await db.user.findUnique({
        where: { id: sessionUserId },
        select: { id: true, isActive: true },
      });

      if (user?.isActive) {
        userId = user.id;
      }
    }

    const [likeCount, existingLike, existingSave] = await Promise.all([
      db.sermonLike.count({
        where: { sermonId: id },
      }),
      userId
        ? db.sermonLike.findUnique({
            where: {
              sermonId_userId: {
                sermonId: id,
                userId,
              },
            },
            select: { id: true },
          })
        : Promise.resolve(null),
      userId
        ? db.savedSermon.findUnique({
            where: {
              sermonId_userId: {
                sermonId: id,
                userId,
              },
            },
            select: { id: true },
          })
        : Promise.resolve(null),
    ]);

    return NextResponse.json(
      {
        success: true,
        likeCount,
        liked: Boolean(existingLike),
        saved: Boolean(existingSave),
      },
      {
        headers: { "Cache-Control": "no-store" },
      },
    );
  } catch (error) {
    console.error("Sermon interactions GET failed:", error);

    return NextResponse.json(
      { success: false, message: "Unable to retrieve sermon interactions." },
      { status: 500 },
    );
  }
}