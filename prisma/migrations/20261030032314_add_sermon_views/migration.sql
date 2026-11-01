-- AlterTable
ALTER TABLE "Sermon" ADD COLUMN     "viewCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "SermonView" (
    "id" TEXT NOT NULL,
    "sermonId" TEXT NOT NULL,
    "visitorHash" TEXT NOT NULL,
    "dayKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SermonView_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SermonView_sermonId_createdAt_idx" ON "SermonView"("sermonId", "createdAt");

-- CreateIndex
CREATE INDEX "SermonView_dayKey_idx" ON "SermonView"("dayKey");

-- CreateIndex
CREATE UNIQUE INDEX "SermonView_sermonId_visitorHash_dayKey_key" ON "SermonView"("sermonId", "visitorHash", "dayKey");

-- AddForeignKey
ALTER TABLE "SermonView" ADD CONSTRAINT "SermonView_sermonId_fkey" FOREIGN KEY ("sermonId") REFERENCES "Sermon"("id") ON DELETE CASCADE ON UPDATE CASCADE;
