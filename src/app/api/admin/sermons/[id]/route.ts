import { NextResponse } from "next/server";
import { SermonMediaType, UserRole } from "@prisma/client";
import { auth } from "@/lib/auth";
import { db } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const editableFields = [
  "title",
  "slug",
  "preacher",
  "category",
  "scripture",
  "description",
  "thumbnail",
  "mediaType",
  "audioUrl",
  "videoUrl",
  "duration",
  "featured",
] as const;

type EditableField = (typeof editableFields)[number];

type SermonInput = {
  title: string;
  slug: string;
  preacher: string;
  category: string;
  description: string;
  scripture: string | null;
  thumbnail: string | null;
  mediaType: SermonMediaType;
  audioUrl: string | null;
  videoUrl: string | null;
  duration: number | null;
  featured: boolean;
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

  for (const field of [
    "title",
    "slug",
    "preacher",
    "category",
    "description",
  ] as const) {
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
    preacher: 160,
    category: 100,
    scripture: 200,
    description: 50000,
    thumbnail: 2048,
    audioUrl: 2048,
    videoUrl: 2048,
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
    body.mediaType !== undefined &&
    !Object.values(SermonMediaType).includes(
      body.mediaType as SermonMediaType,
    )
  ) {
    return "mediaType must be AUDIO, VIDEO, or BOTH.";
  }

  if (
    body.duration !== undefined &&
    body.duration !== null &&
    (!Number.isInteger(body.duration) ||
      (body.duration as number) < 0 ||
      (body.duration as number) > 100000)
  ) {
    return "duration must be a non-negative integer in minutes.";
  }

  if (
    body.featured !== undefined &&
    typeof body.featured !== "boolean"
  ) {
    return "featured must be a boolean.";
  }

  for (const field of ["thumbnail", "audioUrl", "videoUrl"] as const) {
    const value = body[field];

    if (value === undefined || value === null || value === "") continue;

    if (typeof value !== "string") {
      return `${field} must be a URL string or null.`;
    }

    try {
      const parsed = new URL(value);

      if (!["http:", "https:"].includes(parsed.protocol)) {
        return `${field} must use HTTP or HTTPS.`;
      }
    } catch {
      return `${field} must be a valid absolute URL.`;
    }
  }

  return null;
}

function buildInput(body: Record<string, unknown>): SermonInput {
  const optionalString = (field: EditableField): string | null => {
    const value = body[field];

    if (typeof value !== "string" || !value.trim()) {
      return null;
    }

    return value.trim();
  };

  return {
    title: (body.title as string).trim(),
    slug: (body.slug as string).trim(),
    preacher: (body.preacher as string).trim(),
    category: (body.category as string).trim(),
    description: (body.description as string).trim(),
    scripture: optionalString("scripture"),
    thumbnail: optionalString("thumbnail"),
    mediaType:
      (body.mediaType as SermonMediaType | undefined) ??
      SermonMediaType.AUDIO,
    audioUrl: optionalString("audioUrl"),
    videoUrl: optionalString("videoUrl"),
    duration:
      typeof body.duration === "number" ? body.duration : null,
    featured: body.featured === true,
  };
}

async function parseInput(request: Request): Promise<
  | { data: SermonInput }
  | { error: NextResponse }
> {
  let parsed: unknown;

  try {
    parsed = await request.json();
  } catch {
    return {
      error: NextResponse.json(
        { success: false, message: "Invalid JSON body." },
        { status: 400 },
      ),
    };
  }

  if (
    !parsed ||
    typeof parsed !== "object" ||
    Array.isArray(parsed)
  ) {
    return {
      error: NextResponse.json(
        { success: false, message: "A JSON object is required." },
        { status: 400 },
      ),
    };
  }

  const body = parsed as Record<string, unknown>;
  const validationError = validateInput(body);

  if (validationError) {
    return {
      error: NextResponse.json(
        { success: false, message: validationError },
        { status: 400 },
      ),
    };
  }

  return { data: buildInput(body) };
}

function validatePublishMedia(data: SermonInput): string | null {
  if (data.mediaType === SermonMediaType.AUDIO && !data.audioUrl) {
    return "An audio URL is required before publishing an AUDIO sermon.";
  }

  if (data.mediaType === SermonMediaType.VIDEO && !data.videoUrl) {
    return "A video URL is required before publishing a VIDEO sermon.";
  }

  if (data.mediaType === SermonMediaType.BOTH) {
    if (!data.audioUrl || !data.videoUrl) {
      return "Both audio and video URLs are required before publishing a BOTH sermon.";
    }
  }

  return null;
}
async function checkSlugAvailable(
  slug: string,
  draftId?: string,
  sermonId?: string,
): Promise<boolean> {
  const [sermon, draft] = await Promise.all([
    db.sermon.findUnique({
      where: { slug },
      select: { id: true },
    }),
    db.sermonDraft.findFirst({
      where: { slug },
      select: { id: true },
    }),
  ]);

  if (sermon && sermon.id !== sermonId) return false;
  if (draft && draft.id !== draftId) return false;

  return true;
}

export async function GET(
  _request: Request,
  context: RouteContext,
) {
  const access = await requireAdmin();
  if (access.error) return access.error;

  const { id } = await context.params;

  try {
    const draft = await db.sermonDraft.findUnique({
      where: { id },
      include: { sermon: true },
    });

    if (draft) {
      return NextResponse.json(
        { success: true, data: draft },
        { headers: { "Cache-Control": "no-store" } },
      );
    }

    const sermon = await db.sermon.findUnique({
      where: { id },
      include: { draft: true },
    });

    if (!sermon) {
      return NextResponse.json(
        { success: false, message: "Sermon or draft not found." },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { success: true, data: sermon },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Admin sermon GET failed:", error);

    return NextResponse.json(
      { success: false, message: "Unable to retrieve the sermon." },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: Request,
  context: RouteContext,
) {
  const access = await requireAdmin();
  if (access.error) return access.error;

  const { id } = await context.params;
  const parsed = await parseInput(request);

  if ("error" in parsed) return parsed.error;

  const data = parsed.data;

  try {
    const existingDraft = await db.sermonDraft.findUnique({
      where: { id },
    });

    const existingSermon = existingDraft
      ? null
      : await db.sermon.findUnique({
          where: { id },
          include: { draft: true },
        });

    if (!existingDraft && !existingSermon) {
      return NextResponse.json(
        { success: false, message: "Sermon or draft not found." },
        { status: 404 },
      );
    }

    const linkedSermonId =
      existingDraft?.sermonId ?? existingSermon?.id;

    const linkedDraftId =
      existingDraft?.id ?? existingSermon?.draft?.id;

    const available = await checkSlugAvailable(
      data.slug,
      linkedDraftId,
      linkedSermonId,
    );

    if (!available) {
      return NextResponse.json(
        {
          success: false,
          message: "This slug is already in use. Choose a unique slug.",
        },
        { status: 409 },
      );
    }

    let savedDraft;

    if (existingDraft) {
      savedDraft = await db.sermonDraft.update({
        where: { id: existingDraft.id },
        data,
      });
    } else {
      savedDraft = await db.sermonDraft.upsert({
        where: { sermonId: existingSermon!.id },
        create: {
          ...data,
          sermonId: existingSermon!.id,
        },
        update: data,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Draft saved. The published sermon has not been changed.",
      data: savedDraft,
    });
  } catch (error) {
    console.error("Admin sermon PUT failed:", error);

    return NextResponse.json(
      { success: false, message: "Unable to save the sermon draft." },
      { status: 500 },
    );
  }
}

export async function POST(
  _request: Request,
  context: RouteContext,
) {
  const access = await requireAdmin();
  if (access.error) return access.error;

  const { id } = await context.params;

  try {
    const draft = await db.sermonDraft.findUnique({
      where: { id },
    });

    const sermon = draft
      ? null
      : await db.sermon.findUnique({
          where: { id },
          include: { draft: true },
        });

    const publicationDraft = draft ?? sermon?.draft;

    if (!publicationDraft) {
      return NextResponse.json(
        {
          success: false,
          message: "No draft exists to publish. Save a draft first.",
        },
        { status: 404 },
      );
    }

    const data: SermonInput = {
      title: publicationDraft.title,
      slug: publicationDraft.slug,
      preacher: publicationDraft.preacher,
      category: publicationDraft.category,
      scripture: publicationDraft.scripture,
      description: publicationDraft.description,
      thumbnail: publicationDraft.thumbnail,
      mediaType: publicationDraft.mediaType,
      audioUrl: publicationDraft.audioUrl,
      videoUrl: publicationDraft.videoUrl,
      duration: publicationDraft.duration,
      featured: publicationDraft.featured,
    };

    const mediaError = validatePublishMedia(data);

    if (mediaError) {
      return NextResponse.json(
        { success: false, message: mediaError },
        { status: 400 },
      );
    }
    const linkedSermonId = publicationDraft.sermonId;

    const available = await checkSlugAvailable(
      data.slug,
      publicationDraft.id,
      linkedSermonId ?? undefined,
    );

    if (!available) {
      return NextResponse.json(
        {
          success: false,
          message: "This slug is already in use. Resolve the conflict before publishing.",
        },
        { status: 409 },
      );
    }

    const publishedSermon = await db.$transaction(async (tx) => {
      let result;

      if (linkedSermonId) {
        result = await tx.sermon.update({
          where: { id: linkedSermonId },
          data: {
            ...data,
            published: true,
            publishedAt: new Date(),
          },
        });
      } else {
        result = await tx.sermon.create({
          data: {
            ...data,
            published: true,
            publishedAt: new Date(),
          },
        });
      }

      await tx.sermonDraft.delete({
        where: { id: publicationDraft.id },
      });

      return result;
    });

    return NextResponse.json({
      success: true,
      message: "Sermon published successfully.",
      data: publishedSermon,
    });
  } catch (error) {
    console.error("Admin sermon publish failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to publish the sermon. Check for duplicate slugs and try again.",
      },
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
    const draft = await db.sermonDraft.findUnique({
      where: { id },
    });

    if (draft) {
      await db.sermonDraft.delete({
        where: { id: draft.id },
      });

      return NextResponse.json({
        success: true,
        message: "Draft deleted. Any published sermon remains unchanged.",
      });
    }

    const sermon = await db.sermon.findUnique({
      where: { id },
      include: { draft: true },
    });

    if (!sermon) {
      return NextResponse.json(
        { success: false, message: "Sermon or draft not found." },
        { status: 404 },
      );
    }

    if (!sermon.draft) {
      return NextResponse.json(
        {
          success: false,
          message: "This is a sermon record, not a draft. Published sermons cannot be deleted through this endpoint.",
        },
        { status: 409 },
      );
    }

    await db.sermonDraft.delete({
      where: { id: sermon.draft.id },
    });

    return NextResponse.json({
      success: true,
      message: "Draft changes discarded. The published sermon remains unchanged.",
    });
  } catch (error) {
    console.error("Admin sermon DELETE failed:", error);

    return NextResponse.json(
      { success: false, message: "Unable to delete the draft." },
      { status: 500 },
    );
  }
}
