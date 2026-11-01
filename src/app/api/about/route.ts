import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const now = new Date();

    const aboutPage = await db.aboutPage.findFirst({
      where: {
        status: "PUBLISHED",
        publishedAt: {
          lte: now,
        },
      },
      select: {
        id: true,
        title: true,
        introduction: true,
        story: true,
        mission: true,
        vision: true,
        beliefs: true,
        values: true,
        pastorName: true,
        pastorTitle: true,
        pastorBiography: true,
        pastorImage: true,
        historyMilestones: true,
        heroImage: true,
        publishedAt: true,
        updatedAt: true,
      },
            orderBy: [
        { publishedAt: "desc" },
        { updatedAt: "desc" },
      ],
    });

    return NextResponse.json(
      {
        success: true,
        data: aboutPage,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "The requested draft was not found."
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "The requested draft was not found. Reload the editor and try again.",
        },
        { status: 404 },
      );
    }

    console.error("Admin About PUT failed:", error);

    return NextResponse.json(
      { success: false, message: "Unable to save About content." },
      { status: 500 },
    );
  }
}