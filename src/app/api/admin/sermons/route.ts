import { NextResponse } from "next/server";
import { SermonMediaType, UserRole } from "@prisma/client";
import { auth } from "@/lib/auth";
import { db } from "@/lib/prisma";

export const dynamic = "force-dynamic";

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

const requiredFields = [
"title",
"slug",
"preacher",
"category",
"description",
] as const;

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

for (const field of requiredFields) {
if (
typeof body[field] !== "string" ||
!(body[field] as string).trim()
) {
return `${field} is required and must be a non-empty string.`;
}
}

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

export async function GET() {
const access = await requireAdmin();

if (access.error) return access.error;

try {
const [sermons, drafts] = await Promise.all([
db.sermon.findMany({
orderBy: [{ updatedAt: "desc" }],
include: {
draft: true,
},
}),
db.sermonDraft.findMany({
where: { sermonId: null },
orderBy: { updatedAt: "desc" },
}),
]);

return NextResponse.json(
  {
    success: true,
    data: {
      sermons,
      drafts,
    },
  },
  {
    headers: { "Cache-Control": "no-store" },
  },
);

} catch (error) {
console.error("Admin sermons GET failed:", error);

return NextResponse.json(
  {
    success: false,
    message: "Unable to retrieve sermons.",
  },
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

try {
const [existingSermon, existingDraft] = await Promise.all([
db.sermon.findUnique({
where: { slug: data.slug },
select: { id: true },
}),
db.sermonDraft.findFirst({
where: { slug: data.slug },
select: { id: true },
}),
]);

if (existingSermon || existingDraft) {
  return NextResponse.json(
    {
      success: false,
      message: "This slug is already in use. Choose a unique slug.",
    },
    { status: 409 },
  );
}

const draft = await db.sermonDraft.create({
  data,
});

return NextResponse.json(
  {
    success: true,
    message: "Sermon draft saved. It has not been published.",
    data: draft,
  },
  { status: 201 },
);


} catch (error) {
console.error("Admin sermons POST failed:", error);
return NextResponse.json(
  {
    success: false,
    message: "Unable to save the sermon draft.",
  },
  { status: 500 },
);

}
}
