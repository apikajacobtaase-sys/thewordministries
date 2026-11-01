import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/prisma";
import { cloudinary } from "@/lib/cloudinary";
import { UserRole } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export async function POST(request: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Authentication required." },
        { status: 401 },
      );
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
      return NextResponse.json(
        { success: false, message: "Administrator access required." },
        { status: 403 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { success: false, message: "Please select an image to upload." },
        { status: 400 },
      );
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        {
          success: false,
          message: "Only JPEG, PNG, WebP, and GIF images are allowed.",
        },
        { status: 400 },
      );
    }

    if (file.size === 0 || file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          message: "The image must be greater than 0 bytes and no larger than 5 MB.",
        },
        { status: 400 },
      );
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      console.error("Cloudinary environment variables are missing.");

      return NextResponse.json(
        { success: false, message: "Image storage is not configured." },
        { status: 500 },
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const result = await new Promise<{
      secure_url: string;
      public_id: string;
    }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "the-word-ministries",
          resource_type: "image",
          allowed_formats: ["jpg", "jpeg", "png", "webp", "gif"],
          max_bytes: MAX_FILE_SIZE,
        },
        (error, uploadResult) => {
          if (error) {
            reject(error);
            return;
          }

          if (!uploadResult) {
            reject(new Error("Cloudinary returned no upload result."));
            return;
          }

          resolve({
            secure_url: uploadResult.secure_url,
            public_id: uploadResult.public_id,
          });
        },
      );

      stream.end(buffer);
    });

    return NextResponse.json({
      success: true,
      message: "Image uploaded successfully.",
      data: {
        url: result.secure_url,
        publicId: result.public_id,
      },
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Image upload failed:", {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
    } else {
      console.error(
        "Image upload failed with a non-Error value:",
        JSON.stringify(error, null, 2),
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "The image could not be uploaded. Check the server logs for details.",
      },
      { status: 500 },
    );
  }
}
