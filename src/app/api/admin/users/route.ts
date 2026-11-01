import { NextResponse } from "next/server";
import { Prisma, UserRole } from "@prisma/client";
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

export async function GET(request: Request) {
  const access = await requireSuperAdmin();

  if (access.error) return access.error;

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() ?? "";
    const role = searchParams.get("role");

    if (search.length > 100) {
      return NextResponse.json(
        { success: false, message: "Search query is too long." },
        { status: 400 },
      );
    }

    if (
      role &&
      role !== "ALL" &&
      !Object.values(UserRole).includes(role as UserRole)
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid user role filter." },
        { status: 400 },
      );
    }

    const users = await db.user.findMany({
      where: {
        ...(role && role !== "ALL"
          ? { role: role as UserRole }
          : {}),
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
                { phone: { contains: search } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        image: true,
        role: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
        churchPosition: {
          select: {
            id: true,
            name: true,
            isExecutive: true,
            isActive: true,
          },
        },
      },
      orderBy: [
        { role: "desc" },
        { createdAt: "desc" },
      ],
      take: 100,
    });

    const [total, active, superAdmins] = await Promise.all([
      db.user.count(),
      db.user.count({ where: { isActive: true } }),
      db.user.count({ where: { role: UserRole.SUPER_ADMIN } }),
    ]);

    return NextResponse.json({
      success: true,
      data: users,
      statistics: {
        total,
        active,
        superAdmins,
      },
    });
  } catch (error) {
    console.error("Super Admin users GET failed:", error);

    return NextResponse.json(
      { success: false, message: "Unable to retrieve users." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
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
  const allowedFields = new Set([
    "userId",
    "role",
    "churchPositionId",
  ]);

  for (const key of Object.keys(body)) {
    if (!allowedFields.has(key)) {
      return NextResponse.json(
        { success: false, message: `Unsupported field: ${key}` },
        { status: 400 },
      );
    }
  }

  const userId =
    typeof body.userId === "string" ? body.userId.trim() : "";

  if (!userId) {
    return NextResponse.json(
      { success: false, message: "A valid user ID is required." },
      { status: 400 },
    );
  }

  const hasRole = Object.prototype.hasOwnProperty.call(body, "role");
  const hasPosition = Object.prototype.hasOwnProperty.call(
    body,
    "churchPositionId",
  );

  if (!hasRole && !hasPosition) {
    return NextResponse.json(
      { success: false, message: "No changes were provided." },
      { status: 400 },
    );
  }

  if (
    hasRole &&
    (typeof body.role !== "string" ||
      !Object.values(UserRole).includes(body.role as UserRole))
  ) {
    return NextResponse.json(
      { success: false, message: "Invalid system role." },
      { status: 400 },
    );
  }

  let churchPositionId: string | null | undefined;

  if (hasPosition) {
    if (
      body.churchPositionId !== null &&
      (typeof body.churchPositionId !== "string" ||
        !body.churchPositionId.trim())
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid church position." },
        { status: 400 },
      );
    }

    churchPositionId =
      typeof body.churchPositionId === "string"
        ? body.churchPositionId.trim()
        : null;
  }

  try {
    const updatedUser = await db.$transaction(
      async (tx) => {
        const target = await tx.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            role: true,
            isActive: true,
          },
        });

        if (!target) {
          throw new Error("TARGET_USER_NOT_FOUND");
        }

        if (churchPositionId) {
          const position = await tx.churchPosition.findUnique({
            where: { id: churchPositionId },
            select: { id: true, isActive: true },
          });

          if (!position || !position.isActive) {
            throw new Error("POSITION_NOT_AVAILABLE");
          }
        }

        const nextRole = hasRole
          ? (body.role as UserRole)
          : target.role;

        if (
          target.role === UserRole.SUPER_ADMIN &&
          nextRole !== UserRole.SUPER_ADMIN
        ) {
          const superAdminCount = await tx.user.count({
            where: { role: UserRole.SUPER_ADMIN },
          });

          if (superAdminCount <= 1) {
            throw new Error("LAST_SUPER_ADMIN");
          }
        }

        return tx.user.update({
          where: { id: userId },
          data: {
            ...(hasRole ? { role: nextRole } : {}),
            ...(hasPosition ? { churchPositionId } : {}),
            ...(hasRole && nextRole !== target.role
              ? { authVersion: { increment: 1 } }
              : {}),
          },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
            churchPosition: {
              select: {
                id: true,
                name: true,
                isExecutive: true,
              },
            },
          },
        });
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 5000,
        timeout: 10000,
      },
    );

    return NextResponse.json({
      success: true,
      message: "User permissions updated successfully.",
      data: updatedUser,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "TARGET_USER_NOT_FOUND") {
        return NextResponse.json(
          { success: false, message: "User not found." },
          { status: 404 },
        );
      }

      if (error.message === "POSITION_NOT_AVAILABLE") {
        return NextResponse.json(
          { success: false, message: "This church position is unavailable." },
          { status: 400 },
        );
      }

      if (error.message === "LAST_SUPER_ADMIN") {
        return NextResponse.json(
          {
            success: false,
            message: "You cannot remove the last remaining Super Admin.",
          },
          { status: 409 },
        );
      }
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2034"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "A concurrent permissions change occurred. Please retry.",
        },
        { status: 409 },
      );
    }

    console.error("Super Admin users PATCH failed:", error);

    return NextResponse.json(
      { success: false, message: "Unable to update user permissions." },
      { status: 500 },
    );
  }
}
