-- AlterTable
ALTER TABLE "User" ADD COLUMN     "churchPositionId" TEXT;

-- CreateTable
CREATE TABLE "ChurchPosition" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isExecutive" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChurchPosition_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ChurchPosition_name_key" ON "ChurchPosition"("name");

-- CreateIndex
CREATE INDEX "ChurchPosition_isActive_idx" ON "ChurchPosition"("isActive");

-- CreateIndex
CREATE INDEX "ChurchPosition_isExecutive_idx" ON "ChurchPosition"("isExecutive");

-- CreateIndex
CREATE INDEX "User_churchPositionId_idx" ON "User"("churchPositionId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_churchPositionId_fkey" FOREIGN KEY ("churchPositionId") REFERENCES "ChurchPosition"("id") ON DELETE SET NULL ON UPDATE CASCADE;
