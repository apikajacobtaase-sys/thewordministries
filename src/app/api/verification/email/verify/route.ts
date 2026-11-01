 import { NextResponse } from "next/server";
import { verifyEmailCode } from "@/lib/email-verification";
import { checkRateLimit } from "@/lib/rate-limit";

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;

function getClientIp(request: Request): string {
const forwardedFor = request.headers.get("x-forwarded-for");
const firstForwardedIp = forwardedFor?.split(",")[0]?.trim();

return firstForwardedIp || "unknown";
}

function rateLimitResponse(retryAfterSeconds: number) {
return NextResponse.json(
{
error: "Too many verification attempts. Please try again later.",
retryAfterSeconds,
},
{
status: 429,
headers: {
"Retry-After": String(retryAfterSeconds),
},
},
);
}

export async function POST(request: Request) {
try {
const body: unknown = await request.json();

if (!body || typeof body !== "object" || Array.isArray(body)) {
  return NextResponse.json(
    { error: "Invalid verification request." },
    { status: 400 },
  );
}

const data = body as Record<string, unknown>;

const email =
  typeof data.email === "string"
    ? data.email.trim().toLowerCase()
    : "";

const code =
  typeof data.code === "string" ? data.code.trim() : "";

if (
  email.length > 254 ||
  !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
) {
  return NextResponse.json(
    { error: "Enter a valid email address." },
    { status: 400 },
  );
}

if (!/^\d{6}$/.test(code)) {
  return NextResponse.json(
    { error: "Enter the six-digit verification code." },
    { status: 400 },
  );
}

const ipLimit = await checkRateLimit(
  `verification:email:verify:ip:${getClientIp(request)}`,
  {
    limit: 20,
    windowMs: RATE_LIMIT_WINDOW_MS,
  },
);

if (!ipLimit.allowed) {
  return rateLimitResponse(ipLimit.retryAfterSeconds);
}

const emailLimit = await checkRateLimit(
  `verification:email:verify:address:${email}`,
  {
    limit: 5,
    windowMs: RATE_LIMIT_WINDOW_MS,
  },
);

if (!emailLimit.allowed) {
  return rateLimitResponse(emailLimit.retryAfterSeconds);
}

const result = await verifyEmailCode(email, code);

if (!result.success) {
  return NextResponse.json(
    { error: result.message },
    { status: 400 },
  );
}

return NextResponse.json(
  {
    message: result.message,
    verified: true,
    accountCreated: true,
  },
  { status: 200 },
);
} catch (error) {
console.error("Email verification failed.", error);

return NextResponse.json(
  {
    error: "Unable to verify your email right now. Please try again.",
  },
  { status: 500 },
);

}
}
