 import { createHash } from "node:crypto";
import { db } from "@/lib/prisma";

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

interface RateLimitOptions {
  limit: number;
  windowMs: number;
}

function hashKey(key: string): string {
  return createHash("sha256")
    .update(key.trim().toLowerCase())
    .digest("hex");
}

/**
 * Applies a fixed-window rate limit using PostgreSQL.
 *
 * The database transaction locks the relevant bucket before updating it,
 * preventing concurrent requests from freely bypassing the request limit.
 */
export async function checkRateLimit(
  key: string,
  options: RateLimitOptions,
): Promise<RateLimitResult> {
  const normalizedKey = hashKey(key);
  const now = new Date();

  const windowMs = Math.max(1, Math.floor(options.windowMs));
  const limit = Math.max(1, Math.floor(options.limit));

  const expiresAt = new Date(now.getTime() + windowMs);

  return db.$transaction(async (tx) => {
    // Create the bucket if it does not exist. If another request creates it
    // concurrently, the unique key ensures that only one bucket is retained.
    await tx.rateLimit.upsert({
      where: { key: normalizedKey },
      create: {
        key: normalizedKey,
        count: 0,
        expiresAt,
      },
      update: {},
    });

    // Lock this bucket so concurrent requests cannot all pass the same limit.
    await tx.$queryRaw`
      SELECT "id"
      FROM "RateLimit"
      WHERE "key" = ${normalizedKey}
      FOR UPDATE
    `;

    const bucket = await tx.rateLimit.findUniqueOrThrow({
      where: { key: normalizedKey },
    });

    // Start a new window when the previous one has expired.
    if (bucket.expiresAt.getTime() <= now.getTime()) {
      await tx.rateLimit.update({
        where: { key: normalizedKey },
        data: {
          count: 1,
          expiresAt,
        },
      });

      return {
        allowed: true,
        remaining: limit - 1,
        retryAfterSeconds: Math.ceil(windowMs / 1000),
      };
    }

    // Do not count requests that have already exceeded the limit.
    if (bucket.count >= limit) {
      return {
        allowed: false,
        remaining: 0,
        retryAfterSeconds: Math.max(
          1,
          Math.ceil((bucket.expiresAt.getTime() - now.getTime()) / 1000),
        ),
      };
    }

    const updated = await tx.rateLimit.update({
      where: { key: normalizedKey },
      data: {
        count: { increment: 1 },
      },
    });

    return {
      allowed: true,
      remaining: Math.max(0, limit - updated.count),
      retryAfterSeconds: Math.max(
        1,
        Math.ceil((bucket.expiresAt.getTime() - now.getTime()) / 1000),
      ),
    };
  });
}