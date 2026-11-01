import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function errorResponse(message: string, status: number) {
  return NextResponse.json(
    { success: false, message },
    { status },
  );
}

export async function GET(
  request: NextRequest,
  { params }: RouteContext,
) {
  try {
    const { id } = await params;

    const sermon = await db.sermon.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
        published: true,
      },
      select: { id: true },
    });

    if (!sermon) {
      return errorResponse("Sermon not found.", 404);
    }

    const session = await auth();
    const userId = session?.user?.id;

    const [reviews, aggregate, total, viewerReview] =
      await Promise.all([
        db.sermonReview.findMany({
          where: { sermonId: sermon.id },
          orderBy: { createdAt: "desc" },
          take: 30,
          select: {
            id: true,
            rating: true,
            title: true,
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
          },
        }),
        db.sermonReview.aggregate({
          where: { sermonId: sermon.id },
          _avg: { rating: true },
          _count: { rating: true },
        }),
        db.sermonReview.count({
          where: { sermonId: sermon.id },
        }),
        userId
          ? db.sermonReview.findUnique({
              where: {
                sermonId_userId: {
                  sermonId: sermon.id,
                  userId,
                },
              },
            })
          : Promise.resolve(null),
      ]);

    return NextResponse.json(
      {
        success: true,
        reviews,
        averageRating: aggregate._avg.rating ?? 0,
        reviewCount: total,
        viewerReview,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error("GET sermon reviews error:", error);
    return errorResponse("Unable to load reviews.", 500);
  }
}

export async function POST(
  request: NextRequest,
  { params }: RouteContext,
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return errorResponse("Please sign in to review this sermon.", 401);
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, isActive: true },
    });

    if (!user?.isActive) {
      return errorResponse("Your account is not active.", 403);
    }

    const { id } = await params;

    const sermon = await db.sermon.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
        published: true,
      },
      select: { id: true },
    });

    if (!sermon) {
      return errorResponse("Sermon not found.", 404);
    }

    const rateLimit = await checkRateLimit(
      `sermon-review:${userId}`,
      { limit: 5, windowMs: 15 * 60 * 1000 },
    );

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          message: "Too many review attempts. Please try again later.",
          retryAfterSeconds: rateLimit.retryAfterSeconds,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimit.retryAfterSeconds),
          },
        },
      );
    }

    const body = await request.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return errorResponse("Invalid review data.", 400);
    }

    const rating = body.rating;

    if (
      typeof rating !== "number" ||
      !Number.isInteger(rating) ||
      rating < 1 ||
      rating > 5
    ) {
      return errorResponse("Rating must be a whole number from 1 to 5.", 400);
    }

    const title =
      typeof body.title === "string" ? body.title.trim() : "";

    const content =
      typeof body.content === "string" ? body.content.trim() : "";

    if (title.length > 120) {
      return errorResponse("Review title must be 120 characters or fewer.", 400);
    }

    if (content.length > 3000) {
      return errorResponse("Review must be 3000 characters or fewer.", 400);
    }

    const review = await db.sermonReview.upsert({
      where: {
        sermonId_userId: {
          sermonId: sermon.id,
          userId,
        },
      },
      create: {
        sermonId: sermon.id,
        userId,
        rating,
        title: title || null,
        content: content || null,
      },
      update: {
        rating,
        title: title || null,
        content: content || null,
      },
      select: {
        id: true,
        rating: true,
        title: true,
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
      },
    });

    const aggregate = await db.sermonReview.aggregate({
      where: { sermonId: sermon.id },
      _avg: { rating: true },
      _count: { rating: true },
    });

    return NextResponse.json({
      success: true,
      message: "Your review has been saved.",
      review,
      averageRating: aggregate._avg.rating ?? 0,
      reviewCount: aggregate._count.rating,
    });
  } catch (error) {
    console.error("POST sermon review error:", error);
    return errorResponse("Unable to save your review.", 500);
  }
}
