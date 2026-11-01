import { NextResponse } from "next/server";
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

const ALLOWED_REASONS = [
  "SPAM",
  "HARASSMENT",
  "MISINFORMATION",
  "INAPPROPRIATE",
  "OTHER",
] as const;

export async function POST(
  request: Request,
  context: RouteContext,
) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json(
      { success: false, message: "Please sign in to report comments." },
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
      `sermon-comment-report:${userId}`,
      { limit: 5, windowMs: 15 * 60 * 1000 },
    );

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, message: "Too many reports. Please try again later." },
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
        { success: false, message: "Invalid report data." },
        { status: 400 },
      );
    }

    const data = body as {
      reason?: unknown;
      details?: unknown;
    };

    if (
      typeof data.reason !== "string" ||
      !ALLOWED_REASONS.includes(
        data.reason as (typeof ALLOWED_REASONS)[number],
      )
    ) {
      return NextResponse.json(
        { success: false, message: "Select a valid report reason." },
        { status: 400 },
      );
    }

    if (
      data.details !== undefined &&
      data.details !== null &&
      typeof data.details !== "string"
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid report details." },
        { status: 400 },
      );
    }

    const details =
      typeof data.details === "string"
        ? data.details.trim()
        : "";

    if (details.length > 500) {
      return NextResponse.json(
        { success: false, message: "Report details cannot exceed 500 characters." },
        { status: 400 },
      );
    }

    const existingReport = await db.sermonReport.findFirst({
      where: {
        reporterId: userId,
        commentId,
        sermonId: null,
        status: "OPEN",
      },
      select: { id: true },
    });

    if (existingReport) {
      return NextResponse.json(
        {
          success: false,
          message: "You have already reported this comment. It is awaiting review.",
        },
        { status: 409 },
      );
    }

    await db.sermonReport.create({
      data: {
        reporterId: userId,
        commentId,
        reason: data.reason,
        details: details || null,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Thank you. Your report has been submitted for review.",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Sermon comment report failed:", error);

    return NextResponse.json(
      { success: false, message: "Unable to submit your report." },
      { status: 500 },
    );
  }
}
