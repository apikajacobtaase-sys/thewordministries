import { NextResponse } from "next/server";
import { AnnouncementStatus, UserRole } from "@prisma/client";
import { auth } from "@/lib/auth";
import { db } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const editableFields = [
  "title",
  "slug",
  "summary",
  "content",
  "image",
  "status",
  "expiresAt",
] as const;

type NewsInput = {
  title: string;
  slug: string;
  summary: string | null;
  content: string;
  image: string | null;
  status: AnnouncementStatus;
  publishedAt: Date | null;
  expiresAt: Date | null;
};

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

function buildInput(body: Record<string, unknown>): Omit<NewsInput, "publishedAt"> {
  const optionalString = (field: "summary" | "image"): string | null => {
    const value = body[field];

    return typeof value === "string" && value.trim()
      ? value.trim()
      : null;
  };

  return {
    title: (body.title as string).trim(),
    slug: (body.slug as string).trim(),
    summary: optionalString("summary"),
    content: (body.content as string).trim(),
    image: optionalString("image"),
    status:
      (body.status as AnnouncementStatus | undefined) ??
      AnnouncementStatus.DRAFT,
    expiresAt:
      typeof body.expiresAt === "string" && body.expiresAt.trim()
        ? new Date(body.expiresAt)
        : null,
  };
}

export async function GET() {
  const access = await requireAdmin();

  if (access.error) return access.error;

  try {
    const announcements = await db.announcement.findMany({
      orderBy: [{ updatedAt: "desc" }],
    });

    return NextResponse.json(
      {
        success: true,
        data: announcements,
      },
      {
        headers: { "Cache-Control": "no-store" },
      },
    );
  } catch (error) {
    console.error("Admin news GET failed:", error);

    return NextResponse.json(
      { success: false, message: "Unable to retrieve news articles." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const access = await requireAdmin();

  if (access.error) return access.error;

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

  const data = buildInput(body);

  if (
    data.expiresAt &&
    data.status === AnnouncementStatus.PUBLISHED &&
    data.expiresAt <= new Date()
  ) {
    return NextResponse.json(
      { success: false, message: "A published article must have a future expiry date." },
      { status: 400 },
    );
  }

  try {
    const existing = await db.announcement.findUnique({
      where: { slug: data.slug },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          message: "This slug is already in use. Choose a unique slug.",
        },
        { status: 409 },
      );
    }

    const announcement = await db.announcement.create({
      data: {
        ...data,
        publishedAt:
          data.status === AnnouncementStatus.PUBLISHED
            ? new Date()
            : null,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message:
          data.status === AnnouncementStatus.PUBLISHED
            ? "News article published successfully."
            : "News draft saved successfully.",
        data: announcement,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Admin news POST failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to create the news article. Check for duplicate slugs and try again.",
      },
      { status: 500 },
    );
  }
}
