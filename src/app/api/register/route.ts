 import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { sendEmailVerificationCode } from "@/lib/email-verification";
import { checkRateLimit } from "@/lib/rate-limit";

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;

function getClientIp(request: Request): string {
// Only trust forwarded IP headers when your hosting environment
// configures them through a trusted reverse proxy.
const forwardedFor = request.headers.get("x-forwarded-for");
const firstForwardedIp = forwardedFor?.split(",")[0]?.trim();

return firstForwardedIp || "unknown";
}

function rateLimitResponse(retryAfterSeconds: number) {
return NextResponse.json(
{
error: "Too many registration attempts. Please try again later.",
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


function normalizeGhanaPhone(phone: string): string | null {
  const cleaned = phone.trim().replace(/[\s()-]/g, "");

  if (/^\d{9}$/.test(cleaned)) {
    return `+233${cleaned}`;
  }

  if (/^0\d{9}$/.test(cleaned)) {
    return `+233${cleaned.slice(1)}`;
  }

  if (/^\+233\d{9}$/.test(cleaned)) {
    return cleaned;
  }

  if (/^233\d{9}$/.test(cleaned)) {
    return `+${cleaned}`;
  }

  return null;
}

export async function POST(request: Request) {
try {
const body: unknown = await request.json();

if (!body || typeof body !== "object" || Array.isArray(body)) {
  return NextResponse.json(
    { error: "Invalid registration data." },
    { status: 400 },
  );
}

const data = body as Record<string, unknown>;

const name =
  typeof data.name === "string" ? data.name.trim() : "";

const email =
  typeof data.email === "string"
    ? data.email.trim().toLowerCase()
    : "";

const password =
  typeof data.password === "string" ? data.password : "";


const rawPhone =
  typeof data.phone === "string" ? data.phone : "";

const phone = normalizeGhanaPhone(rawPhone);

if (name.length < 2 || name.length > 80) {
  return NextResponse.json(
    { error: "Name must be between 2 and 80 characters." },
    { status: 400 },
  );
}

if (
  email.length > 254 ||
  !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
) {
  return NextResponse.json(
    { error: "Enter a valid email address." },
    { status: 400 },
  );
}

if (password.length < 12 || password.length > 128) {
  return NextResponse.json(
    { error: "Password must be between 12 and 128 characters." },
    { status: 400 },
  );
}


if (!phone) {
  return NextResponse.json(
    {
      error:
        "Enter a valid Ghanaian phone number, such as 0241234567 or 241234567.",
    },
    { status: 400 },
  );
}


const ip = getClientIp(request);

const ipLimit = await checkRateLimit(
  `register:ip:${ip}`,
  {
    limit: 10,
    windowMs: RATE_LIMIT_WINDOW_MS,
  },
);

if (!ipLimit.allowed) {
  return rateLimitResponse(ipLimit.retryAfterSeconds);
}

const emailLimit = await checkRateLimit(
  `register:email:${email}`,
  {
    limit: 3,
    windowMs: RATE_LIMIT_WINDOW_MS,
  },
);

if (!emailLimit.allowed) {
  return rateLimitResponse(emailLimit.retryAfterSeconds);
}

const existingUser = await db.user.findFirst({
  where: {
    OR: [{ email }, { phone }],
  },
  select: { id: true },
});

if (existingUser) {
  return NextResponse.json(
    { error: "Unable to register with those details." },
    { status: 409 },
  );
}




const passwordHash = await hash(password, 12);

const existingPendingPhone = await db.pendingRegistration.findFirst({
  where: {
    phone,
    expiresAt: { gt: new Date() },
    NOT: { email },
  },
  select: { id: true },
});

if (existingPendingPhone) {
  return NextResponse.json(
    { error: "Unable to register with those details." },
    { status: 409 },
  );
}

const registrationExpiresAt = new Date(Date.now() + 30 * 60 * 1000);

await db.pendingRegistration.upsert({
  where: { email },
  update: {
    name,
    passwordHash,
    phone,
    verificationMethod: "EMAIL",
    expiresAt: registrationExpiresAt,
  },
  create: {
    name,
    email,
    passwordHash,
    phone,
    verificationMethod: "EMAIL",
    expiresAt: registrationExpiresAt,
  },
});

await sendEmailVerificationCode(email);

return NextResponse.json(
  {
    message:
      "Registration details saved temporarily. Email verification is required before your account can be created.",
    verificationRequired: true,
  },
  { status: 202 },
);

} catch (error) {
console.error("Registration request failed.", error);

return NextResponse.json(
  { error: "Unable to process your registration right now." },
  { status: 500 },
);

}
}
