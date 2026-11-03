import { createHash, randomUUID } from "node:crypto";
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
 * Applies a fixed-window rate limit using one atomic PostgreSQL UPSERT.
 * Avoids interactive transactions and protects against concurrent requests.
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

  const rows = await db.$queryRaw<
    { count: number; expiresAt: Date }[]
  >`
    INSERT INTO "RateLimit" (
      "id",
      "key",
      "count",
      "expiresAt",
      "createdAt",
      "updatedAt"
    )
    VALUES (
      ${randomUUID()},
      ${normalizedKey},
      1,
      ${expiresAt},
      ${now},
      ${now}
    )
    ON CONFLICT ("key")
    DO UPDATE SET
      "count" = CASE
        WHEN "RateLimit"."expiresAt" <= ${now} THEN 1
        WHEN "RateLimit"."count" >= ${limit}
          THEN "RateLimit"."count"
        ELSE "RateLimit"."count" + 1
      END,
      "expiresAt" = CASE
        WHEN "RateLimit"."expiresAt" <= ${now}
          THEN ${expiresAt}
        ELSE "RateLimit"."expiresAt"
      END,
      "updatedAt" = ${now}
    RETURNING "count", "expiresAt"
  `;

  const bucket = rows[0];

  if (!bucket) {
    throw new Error("Rate limit operation returned no result.");
  }

  const allowed = bucket.count <= limit;

  return {
    allowed,
    remaining: Math.max(0, limit - bucket.count),
    retryAfterSeconds: Math.max(
      1,
      Math.ceil((bucket.expiresAt.getTime() - now.getTime()) / 1000),
    ),
  };
}
