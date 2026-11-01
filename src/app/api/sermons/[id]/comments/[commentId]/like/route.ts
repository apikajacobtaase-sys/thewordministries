import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { db } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    id: string;
    commentId: string;
  }>;
};

export async function POST(
  _request: Request,
  context: RouteContext,
) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json(
      { success: false, message: "Please sign in to like comments." },
      { status: 401 },
    );
  }

  try {
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

    const { id, commentId } = await context.params;

    if (
      !id ||
      id.length > 100 ||
      !commentId ||
      commentId.length > 100
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid comment." },
        { status: 400 },
      );
    }

    const comment = await db.sermonComment.findFirst({
      where: {
        id: commentId,
        sermonId: id,
        status: "PUBLISHED",
        sermon: { published: true },
      },
      select: { id: true },
    });

    if (!comment) {
      return NextResponse.json(
        { success: false, message: "Comment not found." },
        { status: 404 },
      );
    }

    const rateLimit = await checkRateLimit(
      `sermon-comment-like:${userId}`,
      { limit: 60, windowMs: 15 * 60 * 1000 },
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
      commentId_userId: {
        commentId,
        userId,
      },
    };

    const existing = await db.sermonCommentLike.findUnique({ where });

    let liked: boolean;

    if (existing) {
      await db.sermonCommentLike.delete({ where });
      liked = false;
    } else {
      await db.sermonCommentLike.create({
        data: { commentId, userId },
      });
      liked = true;
    }

    const likeCount = await db.sermonCommentLike.count({
      where: { commentId },
    });

    return NextResponse.json({
      success: true,
      liked,
      likeCount,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const likeCount = await db.sermonCommentLike.count({
        where: { commentId: (await context.params).commentId },
      });

      return NextResponse.json({
        success: true,
        liked: true,
        likeCount,
      });
    }

    console.error("Sermon comment like failed:", error);

    return NextResponse.json(
      { success: false, message: "Unable to update comment like." },
      { status: 500 },
    );
  }
}
