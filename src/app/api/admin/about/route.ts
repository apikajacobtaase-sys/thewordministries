
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/prisma";
import { AnnouncementStatus, UserRole } from "@prisma/client";

export const dynamic = "force-dynamic";

const editableFields = [
  "title",
  "introduction",
  "story",
  "mission",
  "vision",
  "beliefs",
  "values",
  "pastorName",
  "pastorTitle",
  "pastorBiography",
  "pastorImage",
  "historyMilestones",
  "heroImage",
] as const;

type EditableField = (typeof editableFields)[number];

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

function validateFields(body: Record<string, unknown>) {
  const allowed = new Set<string>(editableFields);

  for (const key of Object.keys(body)) {
    if (!allowed.has(key) && key !== "status" && key !== "id") {
      return `Unsupported field: ${key}`;
    }
  }

  for (const key of editableFields) {
    const value = body[key];

    if (value === undefined || value === null) continue;

    if (key === "historyMilestones") {
      if (!Array.isArray(value)) {
        return "historyMilestones must be an array.";
      }

      if (value.length > 100) {
        return "A maximum of 100 history milestones is allowed.";
      }

      continue;
    }

    if (typeof value !== "string") {
      return `${key} must be a string.`;
    }

    if (value.length > 50000) {
      return `${key} exceeds the maximum length.`;
    }
  }

  if (
    body.title !== undefined &&
    (typeof body.title !== "string" || !body.title.trim())
  ) {
    return "Title cannot be empty.";
  }

  if (
    body.status !== undefined &&
    !["DRAFT", "PUBLISHED"].includes(String(body.status))
  ) {
    return "Status must be DRAFT or PUBLISHED.";
  }

  return null;
}

function buildData(body: Record<string, unknown>) {
  const data: Record<string, unknown> = {};

  for (const key of editableFields) {
    if (body[key] !== undefined) {
      data[key] = body[key];
    }
  }

  return data;
}

async function getLatestPublished() {
  return db.aboutPage.findFirst({
    where: {
      status: AnnouncementStatus.PUBLISHED,
      publishedAt: { not: null, lte: new Date() },
    },
    orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
  });
}

async function getPendingDraft() {
  return db.aboutPage.findFirst({
    where: { status: AnnouncementStatus.DRAFT },
    orderBy: { updatedAt: "desc" },
  });
}

export async function GET() {
  const access = await requireAdmin();
  if (access.error) return access.error;

  try {
    const [published, draft] = await Promise.all([
      getLatestPublished(),
      getPendingDraft(),
    ]);

    return NextResponse.json(
      {
        success: true,
        data: {
          published,
          draft,
          // The editor can use the draft when one exists.
          ...(draft ?? published ?? {}),
        },
      },
      {
        headers: { "Cache-Control": "no-store" },
      },
    );
  } catch (error) {
    console.error("Admin About GET failed:", error);

    return NextResponse.json(
      { success: false, message: "Unable to retrieve About content." },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  const access = await requireAdmin();
  if (access.error) return access.error;

  let body: Record<string, unknown>;

  try {
    const parsed: unknown = await request.json();

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return NextResponse.json(
        { success: false, message: "A JSON object is required." },
        { status: 400 },
      );
    }

    body = parsed as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid JSON body." },
      { status: 400 },
    );
  }

  const validationError = validateFields(body);

  if (validationError) {
    return NextResponse.json(
      { success: false, message: validationError },
      { status: 400 },
    );
  }

  const status = (body.status ?? "DRAFT") as "DRAFT" | "PUBLISHED";
  const data = buildData(body);
  const now = new Date();

  try {
  
if (status === "DRAFT") {
  const draft = await getPendingDraft();

  if (body.id && (!draft || String(body.id) !== draft.id)) {
    return NextResponse.json(
      {
        success: false,
        message: "The requested draft was not found. Reload the editor and try again.",
      },
      { status: 404 },
    );
  }

  const savedDraft = draft
    ? await db.aboutPage.update({
        where: { id: draft.id },
        data: {
          ...data,
          status: AnnouncementStatus.DRAFT,
          publishedAt: null,
          updatedById: access.user.id,
        },
      })
    : await db.aboutPage.create({
        data: {
          title: "About The Word Ministries International",
          story: "",
          ...data,
          status: AnnouncementStatus.DRAFT,
          publishedAt: null,
          updatedById: access.user.id,
        },
      });

  return NextResponse.json({
    success: true,
    message: "Draft saved. Your published About page is unchanged.",
    data: savedDraft,
  });
}

    const published = await db.$transaction(async (tx) => {
const draft = body.id
  ? await tx.aboutPage.findFirst({
      where: {
        id: String(body.id),
        status: AnnouncementStatus.DRAFT,
      },
    })
  : await tx.aboutPage.findFirst({
      where: { status: AnnouncementStatus.DRAFT },
      orderBy: { updatedAt: "desc" },
    });

if (body.id && !draft) {
  throw new Error("The requested draft was not found.");
}

      const existingPublished = await tx.aboutPage.findFirst({
        where: { status: AnnouncementStatus.PUBLISHED },
        orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
        select: { id: true },
      });


// Apply the latest submitted form values before publishing.
const publishData = {
  ...data,
  status: AnnouncementStatus.PUBLISHED,
  publishedAt: now,
  updatedById: access.user.id,
};
      const newPublished = draft
        ? await tx.aboutPage.update({
            where: { id: draft.id },
            data: publishData,
          })
        : await tx.aboutPage.create({
            data: {
              title: "About The Word Ministries International",
              story: "",
              ...data,
              ...publishData,
            },
          });

        
// Keep the newly published record and remove every older published record.
await tx.aboutPage.deleteMany({
  where: {
    status: AnnouncementStatus.PUBLISHED,
    id: { not: newPublished.id },
  },
});


// Publishing completes the draft workflow.
// Remove any remaining drafts so no stale reminder appears.
await tx.aboutPage.deleteMany({
  where: {
    status: AnnouncementStatus.DRAFT,
  },
});

      return newPublished;
    });

    return NextResponse.json({
      success: true,
      message: "About page published successfully.",
      data: published,
    });
  } catch (error) {
    console.error("Admin About PUT failed:", error);

    return NextResponse.json(
      { success: false, message: "Unable to save About content." },
      { status: 500 },
    );
  }
}

export async function DELETE() {
  const access = await requireAdmin();
  if (access.error) return access.error;

  try {
    const draft = await getPendingDraft();

    if (!draft) {
      return NextResponse.json(
        { success: false, message: "There is no pending draft to delete." },
        { status: 404 },
      );
    }

    await db.aboutPage.delete({
      where: { id: draft.id },
    });

    return NextResponse.json({
      success: true,
      message: "Draft deleted. The published About page remains unchanged.",
    });
  } catch (error) {
    console.error("Admin About DELETE failed:", error);

    return NextResponse.json(
      { success: false, message: "Unable to delete the draft." },
      { status: 500 },
    );
  }
}