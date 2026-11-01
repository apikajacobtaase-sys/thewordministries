import { NextResponse } from "next/server";
import { PrayerRequestStatus, UserRole } from "@prisma/client";
import { auth } from "@/lib/auth";
import { db } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
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
    select: { role: true, isActive: true },
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

  return { authorized: true };
}

export async function PATCH(
  request: Request,
  context: RouteContext,
) {
  const access = await requireAdmin();

  if (access.error) return access.error;

  const { id } = await context.params;

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid JSON body." },
      { status: 400 },
    );
  }

  if (
    !body ||
    typeof body !== "object" ||
    Array.isArray(body)
  ) {
    return NextResponse.json(
      { success: false, message: "A JSON object is required." },
      { status: 400 },
    );
  }

  const status = (body as Record<string, unknown>).status;

  if (
    typeof status !== "string" ||
    !Object.values(PrayerRequestStatus).includes(
      status as PrayerRequestStatus,
    )
  ) {
    return NextResponse.json(
      { success: false, message: "Invalid prayer request status." },
      { status: 400 },
    );
  }

  try {
    const result = await db.prayerRequest.updateMany({
      where: { id },
      data: { status: status as PrayerRequestStatus },
    });

    if (result.count === 0) {
      return NextResponse.json(
        { success: false, message: "Prayer request not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Prayer request status updated successfully.",
    });
  } catch (error) {
    console.error("Admin prayer PATCH failed:", error);

    return NextResponse.json(
      { success: false, message: "Unable to update prayer request." },
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
    const result = await db.prayerRequest.deleteMany({
      where: { id },
    });

    if (result.count === 0) {
      return NextResponse.json(
        { success: false, message: "Prayer request not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Prayer request deleted successfully.",
    });
  } catch (error) {
    console.error("Admin prayer DELETE failed:", error);

    return NextResponse.json(
      { success: false, message: "Unable to delete prayer request." },
      { status: 500 },
    );
  }
}
