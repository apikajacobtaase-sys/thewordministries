import { createHash, randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Sermon ID is required." },
        { status: 400 }
      );
    }

    const sermon = await db.sermon.findFirst({
      where: {
        id,
        published: true,
      },
      select: {
        id: true,
        viewCount: true,
      },
    });

    if (!sermon) {
      return NextResponse.json(
        { success: false, message: "Sermon not found." },
        { status: 404 }
      );
    }

    const session = await auth();
    const userId = session?.user?.id;

    let visitorKey: string;

    if (userId) {
      const user = await db.user.findFirst({
        where: {
          id: userId,
          isActive: true,
        },
        select: {
          id: true,
        },
      });

      visitorKey = user
        ? `user:${user.id}`
        : `guest:${request.cookies.get("sermon_visitor")?.value || randomUUID()}`;
    } else {
      visitorKey = `guest:${request.cookies.get("sermon_visitor")?.value || randomUUID()}`;
    }

    let anonymousId: string | null = null;

    if (visitorKey.startsWith("guest:")) {
      const existingCookie = request.cookies.get("sermon_visitor")?.value;

      if (existingCookie && /^[0-9a-f-]{36}$/i.test(existingCookie)) {
        anonymousId = existingCookie;
        visitorKey = `guest:${existingCookie}`;
      } else {
        anonymousId = randomUUID();
        visitorKey = `guest:${anonymousId}`;
      }
    }

    const visitorHash = createHash("sha256")
      .update(visitorKey)
      .digest("hex");

    const dayKey = new Date().toISOString().slice(0, 10);

    let counted = false;

    try {
      await db.$transaction(async (tx) => {
        await tx.sermonView.create({
          data: {
            sermonId: sermon.id,
            visitorHash,
            dayKey,
          },
        });

        await tx.sermon.update({
          where: { id: sermon.id },
          data: {
            viewCount: {
              increment: 1,
            },
          },
        });
      });

      counted = true;
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "P2002"
      ) {
        counted = false;
      } else {
        throw error;
      }
    }

    const updatedSermon = await db.sermon.findUnique({
      where: { id: sermon.id },
      select: { viewCount: true },
    });

    const response = NextResponse.json({
      success: true,
      counted,
      viewCount: updatedSermon?.viewCount ?? sermon.viewCount,
    });

    if (anonymousId) {
      response.cookies.set("sermon_visitor", anonymousId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
      });
    }

    response.headers.set("Cache-Control", "no-store");

    return response;
  } catch (error) {
    console.error("Sermon view tracking error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to record sermon view." },
      { status: 500 }
    );
  }
}
