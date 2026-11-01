import { NextResponse } from "next/server";
import { Prisma, UserRole } from "@prisma/client";
import { auth } from "@/lib/auth";
import { db } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

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

  if (!user || !user.isActive || user.role !== UserRole.SUPER_ADMIN) {
    return {
      error: NextResponse.json(
        { success: false, message: "Super Admin access required." },
        { status: 403 },
      ),
    };
  }

  return { user };
}

export async function PATCH(
  request: Request,
  { params }: RouteContext,
) {
  const access = await requireSuperAdmin();

  if (access.error) return access.error;

  const { id } = await params;

  if (!id) {
    return NextResponse.json(
      { success: false, message: "Position ID is required." },
      { status: 400 },
    );
  }

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
  const allowed = new Set([
    "name",
    "description",
    "isExecutive",
    "isActive",
  ]);

  for (const key of Object.keys(body)) {
    if (!allowed.has(key)) {
      return NextResponse.json(
        { success: false, message: `Unsupported field: ${key}` },
        { status: 400 },
      );
    }
  }

  if (Object.keys(body).length === 0) {
    return NextResponse.json(
      { success: false, message: "At least one field must be provided." },
      { status: 400 },
    );
  }

  const data: Prisma.ChurchPositionUpdateInput = {};

  if ("name" in body) {
    if (typeof body.name !== "string") {
      return NextResponse.json(
        { success: false, message: "Position name must be text." },
        { status: 400 },
      );
    }

    const name = body.name.trim();

    if (!name || name.length > 100) {
      return NextResponse.json(
        { success: false, message: "Position name is required and must not exceed 100 characters." },
        { status: 400 },
      );
    }

    data.name = name;
  }

  if ("description" in body) {
    if (
      body.description !== null &&
      typeof body.description !== "string"
    ) {
      return NextResponse.json(
        { success: false, message: "Description must be text or null." },
        { status: 400 },
      );
    }

    const description =
      typeof body.description === "string"
        ? body.description.trim()
        : "";

    if (description.length > 500) {
      return NextResponse.json(
        { success: false, message: "Description must not exceed 500 characters." },
        { status: 400 },
      );
    }

    data.description = description || null;
  }

  if ("isExecutive" in body) {
    if (typeof body.isExecutive !== "boolean") {
      return NextResponse.json(
        { success: false, message: "isExecutive must be true or false." },
        { status: 400 },
      );
    }

    data.isExecutive = body.isExecutive;
  }

  if ("isActive" in body) {
    if (typeof body.isActive !== "boolean") {
      return NextResponse.json(
        { success: false, message: "isActive must be true or false." },
        { status: 400 },
      );
    }

    data.isActive = body.isActive;
  }

  try {
    const existing = await db.churchPosition.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Church position not found." },
        { status: 404 },
      );
    }

    if (typeof data.name === "string") {
      const duplicate = await db.churchPosition.findFirst({
        where: {
          name: data.name,
          NOT: { id },
        },
        select: { id: true },
      });

      if (duplicate) {
        return NextResponse.json(
          { success: false, message: "A position with this name already exists." },
          { status: 409 },
        );
      }
    }

    const position = await db.churchPosition.update({
      where: { id },
      data,
      include: {
        _count: {
          select: { users: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Church position updated successfully.",
      data: position,
    });
  } catch (error) {
    console.error("Church position PATCH failed:", error);

    return NextResponse.json(
      { success: false, message: "Unable to update church position." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: RouteContext,
) {
  const access = await requireSuperAdmin();

  if (access.error) return access.error;

  const { id } = await params;

  if (!id) {
    return NextResponse.json(
      { success: false, message: "Position ID is required." },
      { status: 400 },
    );
  }

  try {
    await db.$transaction(
      async (tx) => {
        const position = await tx.churchPosition.findUnique({
          where: { id },
          select: {
            id: true,
            _count: {
              select: { users: true },
            },
          },
        });

        if (!position) {
          throw new Error("POSITION_NOT_FOUND");
        }

        if (position._count.users > 0) {
          throw new Error("POSITION_HAS_USERS");
        }

        await tx.churchPosition.delete({
          where: { id },
        });
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );

    return NextResponse.json({
      success: true,
      message: "Church position deleted successfully.",
    });
  } catch (error) {
    if (error instanceof Error && error.message === "POSITION_NOT_FOUND") {
      return NextResponse.json(
        { success: false, message: "Church position not found." },
        { status: 404 },
      );
    }

    if (error instanceof Error && error.message === "POSITION_HAS_USERS") {
      return NextResponse.json(
        {
          success: false,
          message: "Reassign all members before deleting this position. You can deactivate it instead.",
        },
        { status: 409 },
      );
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2034"
    ) {
      return NextResponse.json(
        { success: false, message: "The position changed during this operation. Please try again." },
        { status: 409 },
      );
    }

    console.error("Church position DELETE failed:", error);

    return NextResponse.json(
      { success: false, message: "Unable to delete church position." },
      { status: 500 },
    );
  }
}
