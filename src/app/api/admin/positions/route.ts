import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { auth } from "@/lib/auth";
import { db } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function requireSuperAdmin() {
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
    user.role !== UserRole.SUPER_ADMIN
  ) {
    return {
      error: NextResponse.json(
        { success: false, message: "Super Admin access required." },
        { status: 403 },
      ),
    };
  }

  return { user };
}

export async function GET() {
  const access = await requireSuperAdmin();

  if (access.error) return access.error;

  try {
    const positions = await db.churchPosition.findMany({
      include: {
        _count: {
          select: { users: true },
        },
      },
      orderBy: [
        { isExecutive: "desc" },
        { name: "asc" },
      ],
    });

    return NextResponse.json({
      success: true,
      data: positions,
    });
  } catch (error) {
    console.error("Church positions GET failed:", error);

    return NextResponse.json(
      { success: false, message: "Unable to retrieve church positions." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const access = await requireSuperAdmin();

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
  const allowed = new Set(["name", "description", "isExecutive"]);

  for (const key of Object.keys(body)) {
    if (!allowed.has(key)) {
      return NextResponse.json(
        { success: false, message: `Unsupported field: ${key}` },
        { status: 400 },
      );
    }
  }

  const name =
    typeof body.name === "string" ? body.name.trim() : "";

  const description =
    typeof body.description === "string"
      ? body.description.trim()
      : "";

  const isExecutive = body.isExecutive ?? false;

  if (!name || name.length > 100) {
    return NextResponse.json(
      { success: false, message: "Position name is required and must not exceed 100 characters." },
      { status: 400 },
    );
  }

  if (description.length > 500) {
    return NextResponse.json(
      { success: false, message: "Description must not exceed 500 characters." },
      { status: 400 },
    );
  }

  if (typeof isExecutive !== "boolean") {
    return NextResponse.json(
      { success: false, message: "isExecutive must be true or false." },
      { status: 400 },
    );
  }

  try {
    const existing = await db.churchPosition.findUnique({
      where: { name },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, message: "A position with this name already exists." },
        { status: 409 },
      );
    }

    const position = await db.churchPosition.create({
      data: {
        name,
        description: description || null,
        isExecutive,
        createdById: access.user.id,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Church position created successfully.",
        data: position,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Church position POST failed:", error);

    return NextResponse.json(
      { success: false, message: "Unable to create church position." },
      { status: 500 },
    );
  }
}
