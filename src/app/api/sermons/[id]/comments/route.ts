import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const MAX_COMMENT_LENGTH = 2000;
const MAX_PAGE_SIZE = 30;
const MAX_REPLIES_PER_COMMENT = 20;

export async function GET(
  request: Request,
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

    const searchParams = new URL(request.url).searchParams;
    const requestedLimit = Number(searchParams.get("limit") || 20);
    const limit = Number.isFinite(requestedLimit)
      ? Math.min(MAX_PAGE_SIZE, Math.max(1, Math.floor(requestedLimit)))
      : 20;

    const cursor = searchParams.get("cursor");

    const comments = await db.sermonComment.findMany({
      where: {
        sermonId: id,
        parentId: null,
        status: "PUBLISHED",
      },
      orderBy: [
        { createdAt: "desc" },
        { id: "desc" },
      ],
      take: limit + 1,
      ...(cursor
        ? {
            cursor: { id: cursor },
            skip: 1,
          }
        : {}),
      select: {
        id: true,
        content: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        _count: {
          select: {
            likes: true,
            replies: {
              where: { status: "PUBLISHED" },
            },
          },
        },
        replies: {
          where: { status: "PUBLISHED" },
          orderBy: { createdAt: "asc" },
          take: MAX_REPLIES_PER_COMMENT,
          select: {
            id: true,
            content: true,
            createdAt: true,
            updatedAt: true,
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
            _count: {
              select: { likes: true },
            },
          },
        },
      },
    });

    const hasMore = comments.length > limit;
    const visibleComments = hasMore
      ? comments.slice(0, limit)
      : comments;

    return NextResponse.json(
      {
        success: true,
        comments: visibleComments,
        nextCursor: hasMore
          ? visibleComments[visibleComments.length - 1]?.id ?? null
          : null,
      },
      {
        headers: { "Cache-Control": "no-store" },
      },
    );
  } catch (error) {
    console.error("Sermon comments GET failed:", error);

    return NextResponse.json(
      { success: false, message: "Unable to retrieve comments." },
      { status: 500 },
    );
  }
}

export async function POST(
  request: Request,
  context: RouteContext,
) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json(
      { success: false, message: "Please sign in to comment." },
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
      `sermon-comment:${userId}`,
      { limit: 10, windowMs: 10 * 60 * 1000 },
    );

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          message: "Too many comments. Please try again shortly.",
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimit.retryAfterSeconds),
          },
        },
      );
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid request body." },
        { status: 400 },
      );
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { success: false, message: "Invalid comment data." },
        { status: 400 },
      );
    }

    const data = body as {
      content?: unknown;
      parentId?: unknown;
    };

    if (typeof data.content !== "string") {
      return NextResponse.json(
        { success: false, message: "Comment text is required." },
        { status: 400 },
      );
    }

    const content = data.content.trim();

    if (!content || content.length > MAX_COMMENT_LENGTH) {
      return NextResponse.json(
        {
          success: false,
          message: `Comments must contain between 1 and ${MAX_COMMENT_LENGTH} characters.`,
        },
        { status: 400 },
      );
    }

    let parentId: string | null = null;

    if (data.parentId !== undefined && data.parentId !== null) {
      if (
        typeof data.parentId !== "string" ||
        !data.parentId.trim() ||
        data.parentId.length > 100
      ) {
        return NextResponse.json(
          { success: false, message: "Invalid reply target." },
          { status: 400 },
        );
      }

      parentId = data.parentId.trim();

      const parent = await db.sermonComment.findFirst({
        where: {
          id: parentId,
          sermonId: id,
          parentId: null,
          status: "PUBLISHED",
        },
        select: { id: true },
      });

      if (!parent) {
        return NextResponse.json(
          {
            success: false,
            message: "This comment is unavailable for replies.",
          },
          { status: 404 },
        );
      }
    }

    const comment = await db.sermonComment.create({
      data: {
        sermonId: id,
        userId,
        parentId,
        content,
      },
      select: {
        id: true,
        content: true,
        createdAt: true,
        updatedAt: true,
        parentId: true,
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        _count: {
          select: {
            likes: true,
            replies: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: parentId ? "Reply posted." : "Comment posted.",
        comment,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Sermon comment POST failed:", error);

    return NextResponse.json(
      { success: false, message: "Unable to post your comment." },
      { status: 500 },
    );
  }
}
