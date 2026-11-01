import { NextResponse } from "next/server";
import { AnnouncementStatus, UserRole } from "@prisma/client";
import { auth } from "@/lib/auth";
import { db } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const editableFields = [
  "title",
  "slug",
  "summary",
  "content",
  "image",
  "status",
  "expiresAt",
] as const;

async function requireAdmin() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return {
      error: NextResponse.json(
        { success: false, message: "Authentication required." },
        { status: 401 },
      ),
    };
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, isActive: true },
  });

  if (
    !user ||
    !user.isActive ||
    (user.role !== UserRole.ADMIN &&
      user.role !== UserRole.SUPER_ADMIN)
  ) {
    return {
      error: NextResponse.json(
        { success: false, message: "Administrator access required." },
        { status: 403 },
      ),
    };
  }

  return { user };
}

function validateInput(body: Record<string, unknown>): string | null {
  const allowed = new Set<string>(editableFields);

  for (const key of Object.keys(body)) {
    if (!allowed.has(key)) {
      return `Unsupported field: ${key}`;
    }
  }

  for (const field of ["title", "slug", "content"] as const) {
    if (
      typeof body[field] !== "string" ||
      !(body[field] as string).trim()
    ) {
      return `${field} is required and must be a non-empty string.`;
    }
  }

  const maximumLengths: Record<string, number> = {
    title: 200,
    slug: 220,
    summary: 1000,
    content: 100000,
    image: 2048,
  };

  for (const [field, maximum] of Object.entries(maximumLengths)) {
    const value = body[field];

    if (value === undefined || value === null) continue;

    if (typeof value !== "string") {
      return `${field} must be a string or null.`;
    }

    if (value.length > maximum) {
      return `${field} exceeds the maximum length of ${maximum}.`;
    }
  }

  const slug = body.slug as string;

  if (
    slug !== slug.trim() ||
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
  ) {
    return "Slug must contain lowercase letters, numbers, and single hyphens only.";
  }

  if (
    body.status !== undefined &&
    !Object.values(AnnouncementStatus).includes(
      body.status as AnnouncementStatus,
    )
  ) {
    return "Status must be DRAFT, PUBLISHED, or ARCHIVED.";
  }

  if (
    body.expiresAt !== undefined &&
    body.expiresAt !== null &&
    (typeof body.expiresAt !== "string" ||
      !body.expiresAt.trim() ||
      !Number.isFinite(Date.parse(body.expiresAt)))
  ) {
    return "Expiry date must be a valid date or null.";
  }

  const image = body.image;

  if (image !== undefined && image !== null && image !== "") {
    if (typeof image !== "string") {
      return "Image must be a URL string or null.";
    }

    try {
      const parsed = new URL(image);

      if (!["http:", "https:"].includes(parsed.protocol)) {
        return "Image must use HTTP or HTTPS.";
      }
    } catch {
      return "Image must be a valid absolute URL.";
    }
  }

  return null;
}

export async function PUT(
  request: Request,
  context: RouteContext,
) {
  const access = await requireAdmin();

  if (access.error) return access.error;

  const { id } = await context.params;

  let parsed: unknown;

  try {
    parsed = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid JSON body." },
      { status: 400 },
    );
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return NextResponse.json(
      { success: false, message: "A JSON object is required." },
      { status: 400 },
    );
  }

  const body = parsed as Record<string, unknown>;
  const validationError = validateInput(body);

  if (validationError) {
    return NextResponse.json(
      { success: false, message: validationError },
      { status: 400 },
    );
  }

  const title = (body.title as string).trim();
  const slug = (body.slug as string).trim();
  const content = (body.content as string).trim();

  const optionalString = (field: "summary" | "image"): string | null => {
    const value = body[field];

    return typeof value === "string" && value.trim()
      ? value.trim()
      : null;
  };

  const status =
    (body.status as AnnouncementStatus | undefined) ??
    AnnouncementStatus.DRAFT;

  const expiresAt =
    typeof body.expiresAt === "string" && body.expiresAt.trim()
      ? new Date(body.expiresAt)
      : null;

  if (
    status === AnnouncementStatus.PUBLISHED &&
    expiresAt &&
    expiresAt <= new Date()
  ) {
    return NextResponse.json(
      {
        success: false,
        message: "A published article must have a future expiry date.",
      },
      { status: 400 },
    );
  }

  try {
    const existing = await db.announcement.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, message: "News article not found." },
        { status: 404 },
      );
    }

    const slugOwner = await db.announcement.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (slugOwner && slugOwner.id !== id) {
      return NextResponse.json(
        {
          success: false,
          message: "This slug is already in use. Choose a unique slug.",
        },
        { status: 409 },
      );
    }

    const publishedAt =
      status === AnnouncementStatus.DRAFT
        ? null
        : status === AnnouncementStatus.ARCHIVED
          ? existing.publishedAt
          : existing.status === AnnouncementStatus.PUBLISHED
            ? existing.publishedAt
            : new Date();

    const announcement = await db.announcement.update({
      where: { id },
      data: {
        title,
        slug,
        summary: optionalString("summary"),
        content,
        image: optionalString("image"),
        status,
        publishedAt,
        expiresAt,
      },
    });

    return NextResponse.json({
      success: true,
      message:
        status === AnnouncementStatus.PUBLISHED
          ? "News article published successfully."
          : status === AnnouncementStatus.ARCHIVED
            ? "News article archived successfully."
            : "News draft saved successfully.",
      data: announcement,
    });
  } catch (error) {
    console.error("Admin news PUT failed:", error);

    return NextResponse.json(
      { success: false, message: "Unable to update the news article." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  context: RouteContext,
) {
  const access = await requireAdmin();

  if (access.error) return access.error;

  const { id } = await context.params;

  try {
    const result = await db.announcement.deleteMany({
      where: { id },
    });

    if (result.count === 0) {
      return NextResponse.json(
        { success: false, message: "News article not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "News article deleted successfully.",
    });
  } catch (error) {
    console.error("Admin news DELETE failed:", error);

    return NextResponse.json(
      { success: false, message: "Unable to delete the news article." },
      { status: 500 },
    );
  }
}
