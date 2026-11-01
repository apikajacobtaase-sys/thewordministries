
import {
  randomInt,
  randomBytes,
  createHmac,
  timingSafeEqual,
} from "node:crypto";
import { Resend } from "resend";
import { db } from "@/lib/prisma";

const OTP_EXPIRY_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function hashCode(code: string, salt: string): string {
  const secret = process.env.EMAIL_VERIFICATION_SECRET;

  if (!secret || !/^[a-f0-9]{64}$/i.test(secret)) {
    throw new Error("Email verification secret is missing or invalid.");
  }

  return createHmac("sha256", Buffer.from(secret, "hex"))
    .update(`${salt}:${code}`)
    .digest("hex");
}

export async function sendEmailVerificationCode(email: string) {
  const normalizedEmail = email.trim().toLowerCase();

  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
    throw new Error("Email verification is not configured.");
  }

  const pending = await db.pendingRegistration.findUnique({
    where: { email: normalizedEmail },
    select: { email: true, expiresAt: true, verificationMethod: true },
  });

  if (
    !pending ||
    pending.expiresAt <= new Date() ||
    pending.verificationMethod !== "EMAIL"
  ) {
    throw new Error("No valid pending registration was found.");
  }

  const existingUser = await db.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true },
  });

  if (existingUser) {
    throw new Error("Unable to verify this registration.");
  }

  const code = randomInt(100000, 1000000).toString();
  const salt = randomBytes(16).toString("hex");
  const codeHash = `${salt}:${hashCode(code, salt)}`;
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);

  await db.$transaction(
    async (tx) => {
      // Serialize challenge replacement for this registration.
      const pendingRows = await tx.$queryRaw<Array<{ id: string }>>`
        SELECT "id"
        FROM "PendingRegistration"
        WHERE "email" = ${normalizedEmail}
        FOR UPDATE
      `;

      if (pendingRows.length === 0) {
        throw new Error("No valid pending registration was found.");
      }

      const currentPending = await tx.pendingRegistration.findUnique({
        where: { email: normalizedEmail },
      });

      if (
        !currentPending ||
        currentPending.expiresAt <= new Date() ||
        currentPending.verificationMethod !== "EMAIL"
      ) {
        throw new Error("No valid pending registration was found.");
      }

      await tx.verificationChallenge.deleteMany({
        where: { email: normalizedEmail },
      });

      await tx.verificationChallenge.create({
        data: {
          email: normalizedEmail,
          codeHash,
          expiresAt,
        },
      });
    },
    {
      maxWait: 5000,
      timeout: 10000,
    },
  );

  const resend = new Resend(process.env.RESEND_API_KEY);

  const { error } = await resend.emails.send({
    from: process.env.EMAIL_FROM,
    to: normalizedEmail,
    subject: "Verify your email - The Word Ministries International",
    text: `Your verification code is ${code}. It expires in 10 minutes. If you did not request this code, you can ignore this email.`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:24px;color:#172554">
        <h2>Email verification</h2>
        <p>Use the following code to verify your email address for The Word Ministries International.</p>
        <p style="font-size:32px;font-weight:bold;letter-spacing:8px">${code}</p>
        <p>This code expires in 10 minutes.</p>
        <p>If you did not request this code, you can safely ignore this message.</p>
      </div>
    `,
  });

  if (error) {
    await db.verificationChallenge.deleteMany({
      where: { email: normalizedEmail, codeHash },
    });

    throw new Error("Unable to send the verification email.");
  }
}

export async function verifyEmailCode(email: string, code: string) {
const normalizedEmail = email.trim().toLowerCase();

if (!/^\d{6}$/.test(code)) {
return {
success: false as const,
message: "Invalid or expired verification code.",
};
}

try {
return await db.$transaction(
async (tx) => {
// Lock the pending registration row so concurrent verification
// requests for the same registration are processed sequentially.
const pendingRows = await tx.$queryRaw<
Array<{ id: string }>
>`           SELECT "id"
          FROM "PendingRegistration"
          WHERE "email" = ${normalizedEmail}
          FOR UPDATE
        `;

    if (pendingRows.length === 0) {
      return {
        success: false as const,
        message: "Registration expired. Please register again.",
      };
    }

    const pending = await tx.pendingRegistration.findUnique({
      where: { email: normalizedEmail },
    });

    if (
      !pending ||
      pending.expiresAt <= new Date() ||
      pending.verificationMethod !== "EMAIL"
    ) {
      return {
        success: false as const,
        message: "Registration expired. Please register again.",
      };
    }

    const challengeRows = await tx.$queryRaw<
      Array<{ id: string }>
    >`
      SELECT "id"
      FROM "VerificationChallenge"
      WHERE "email" = ${normalizedEmail}
      ORDER BY "createdAt" DESC
      LIMIT 1
      FOR UPDATE
    `;

    if (challengeRows.length === 0) {
      return {
        success: false as const,
        message: "Invalid or expired verification code.",
      };
    }

    const challenge = await tx.verificationChallenge.findUnique({
      where: { id: challengeRows[0].id },
    });

    if (
      !challenge ||
      challenge.verifiedAt ||
      challenge.expiresAt <= new Date()
    ) {
      return {
        success: false as const,
        message: "Invalid or expired verification code.",
      };
    }

    if (challenge.attempts >= MAX_ATTEMPTS) {
      return {
        success: false as const,
        message: "Too many attempts. Request a new code.",
      };
    }

    const [salt, expectedHash] = challenge.codeHash.split(":");

    if (!salt || !expectedHash) {
      return {
        success: false as const,
        message: "Invalid or expired verification code.",
      };
    }

    const actualHash = hashCode(code, salt);
    const expectedBuffer = Buffer.from(expectedHash, "hex");
    const actualBuffer = Buffer.from(actualHash, "hex");

    if (
      expectedBuffer.length !== actualBuffer.length ||
      !timingSafeEqual(expectedBuffer, actualBuffer)
    ) {
      // The row is locked, so the attempt count is checked and
      // incremented serially for this challenge.
      await tx.verificationChallenge.update({
        where: { id: challenge.id },
        data: { attempts: { increment: 1 } },
      });

      return {
        success: false as const,
        message: "Invalid or expired verification code.",
      };
    }

    const existingUser = await tx.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    if (existingUser) {
      return {
        success: false as const,
        message: "Unable to complete this registration.",
      };
    }

  
await tx.user.create({
  data: {
    name: pending.name,
    email: pending.email,
    passwordHash: pending.passwordHash,
    phone: pending.phone,
    role: "MEMBER",
    emailVerified: new Date(),
  },
});

    await tx.verificationChallenge.update({
      where: { id: challenge.id },
      data: { verifiedAt: new Date() },
    });

    await tx.pendingRegistration.delete({
      where: { id: pending.id },
    });

    return {
      success: true as const,
      message: "Email verified and account created successfully.",
    };
  },
  {
    maxWait: 5000,
    timeout: 10000,
  },
);

} catch (error) {
// A unique-email constraint may still reject a concurrent account
// creation from another code path. Do not expose database details.
console.error("Email verification transaction failed.", error);

return {
  success: false as const,
  message: "Unable to complete verification right now. Please try again.",
};

}
}
