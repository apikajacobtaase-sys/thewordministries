-- CreateTable
CREATE TABLE "VerificationChallenge" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "codeHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerificationChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VerificationChallenge_email_createdAt_idx" ON "VerificationChallenge"("email", "createdAt");

-- CreateIndex
CREATE INDEX "VerificationChallenge_expiresAt_idx" ON "VerificationChallenge"("expiresAt");
