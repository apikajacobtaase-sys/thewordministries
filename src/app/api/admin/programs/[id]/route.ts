import { NextResponse } from "next/server";
import { EventStatus, UserRole } from "@prisma/client";
import { auth } from "@/lib/auth";
import { db } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const editableFields = [
  "title",
  "slug",
  "description",
  "location",
  "image",
  "startDate",
  "endDate",
  "status",
  "registrationRequired",
] as const;

type EventInput = {
  title: string;
  slug: string;
  description: string;
  location: string | null;
  image: string | null;
  startDate: Date;
  endDate: Date | null;
  status: EventStatus;
  registrationRequired: boolean;
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

  for (const field of ["title", "slug", "description"] as const) {
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
    description: 50000,
    location: 300,
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
    typeof body.startDate !== "string" ||
    !body.startDate.trim() ||
    !Number.isFinite(Date.parse(body.startDate))
  ) {
    return "A valid start date is required.";
  }

  if (
    body.endDate !== undefined &&
    body.endDate !== null &&
    (typeof body.endDate !== "string" ||
      !body.endDate.trim() ||
      !Number.isFinite(Date.parse(body.endDate)))
  ) {
    return "End date must be a valid date or null.";
  }

  if (
    typeof body.endDate === "string" &&
    typeof body.startDate === "string" &&
    Date.parse(body.endDate) < Date.parse(body.startDate)
  ) {
    return "End date cannot be earlier than start date.";
  }

  if (
    body.status !== undefined &&
    !Object.values(EventStatus).includes(body.status as EventStatus)
  ) {
    return "Status must be DRAFT, PUBLISHED, CANCELLED, or COMPLETED.";
  }

  if (
    body.registrationRequired !== undefined &&
    typeof body.registrationRequired !== "boolean"
  ) {
    return "registrationRequired must be a boolean.";
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

function buildInput(body: Record<string, unknown>): EventInput {
  const optionalString = (field: "location" | "image"): string | null => {
    const value = body[field];

    return typeof value === "string" && value.trim()
      ? value.trim()
      : null;
  };

  return {
    title: (body.title as string).trim(),
    slug: (body.slug as string).trim(),
    description: (body.description as string).trim(),
    location: optionalString("location"),
    image: optionalString("image"),
    startDate: new Date(body.startDate as string),
    endDate:
      typeof body.endDate === "string" && body.endDate.trim()
        ? new Date(body.endDate)
        : null,
    status: (body.status as EventStatus | undefined) ?? EventStatus.DRAFT,
    registrationRequired: body.registrationRequired === true,
  };
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

  const data = buildInput(body);

  try {
    const existing = await db.event.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Program not found." },
        { status: 404 },
      );
    }

    const slugOwner = await db.event.findUnique({
      where: { slug: data.slug },
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

    const event = await db.event.update({
      where: { id },
      data,
      include: {
        _count: {
          select: { registrations: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Program updated successfully.",
      data: event,
    });
  } catch (error) {
    console.error("Admin programs PUT failed:", error);

    return NextResponse.json(
      { success: false, message: "Unable to update the program." },
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
    const existing = await db.event.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Program not found." },
        { status: 404 },
      );
    }

    const result = await db.event.deleteMany({
      where: {
        id,
        registrations: {
          none: {},
        },
      },
    });

    if (result.count === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This program has registrations and cannot be deleted. You can cancel or complete it instead.",
        },
        { status: 409 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Program deleted successfully.",
    });
  } catch (error) {
    console.error("Admin programs DELETE failed:", error);

    return NextResponse.json(
      { success: false, message: "Unable to delete the program." },
      { status: 500 },
    );
  }
}
