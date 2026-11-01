import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function getActiveUser() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return null;
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, isActive: true },
  });

  return user?.isActive ? user : null;
}

export async function GET() {
  try {
    const user = await getActiveUser();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Please sign in to view your saved sermons." },
        { status: 401 },
      );
    }

    const savedSermons = await db.savedSermon.findMany({
      where: {
        userId: user.id,
        sermon: { published: true },
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        createdAt: true,
        sermon: {
          select: {
            id: true,
            slug: true,
            title: true,
            preacher: true,
            category: true,
            scripture: true,
            description: true,
            thumbnail: true,
            mediaType: true,
            audioUrl: true,
            videoUrl: true,
            duration: true,
            publishedAt: true,
          },
        },
      },
    });

    return NextResponse.json(
      { success: true, savedSermons },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Saved sermons GET failed:", error);

    return NextResponse.json(
      { success: false, message: "Unable to load your saved sermons." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getActiveUser();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Please sign in to manage your saved sermons." },
        { status: 401 },
      );
    }

    const body = await request.json().catch(() => null);
    const sermonId = body?.sermonId;

    if (
      typeof sermonId !== "string" ||
      !sermonId.trim() ||
      sermonId.length > 100
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid sermon." },
        { status: 400 },
      );
    }

    const result = await db.savedSermon.deleteMany({
      where: {
        userId: user.id,
        sermonId,
      },
    });

    return NextResponse.json({
      success: true,
      removed: result.count > 0,
    });
  } catch (error) {
    console.error("Saved sermon DELETE failed:", error);

    return NextResponse.json(
      { success: false, message: "Unable to remove this saved sermon." },
      { status: 500 },
    );
  }
}
