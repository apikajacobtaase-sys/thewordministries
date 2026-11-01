-- CreateEnum
CREATE TYPE "SermonCommentStatus" AS ENUM ('PUBLISHED', 'HIDDEN', 'REMOVED');

-- CreateEnum
CREATE TYPE "SermonReportStatus" AS ENUM ('OPEN', 'REVIEWED', 'DISMISSED', 'ACTIONED');

-- CreateTable
CREATE TABLE "SermonLike" (
    "id" TEXT NOT NULL,
    "sermonId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SermonLike_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SermonComment" (
    "id" TEXT NOT NULL,
    "sermonId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "parentId" TEXT,
    "content" TEXT NOT NULL,
    "status" "SermonCommentStatus" NOT NULL DEFAULT 'PUBLISHED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SermonComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SermonCommentLike" (
    "id" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SermonCommentLike_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SermonReview" (
    "id" TEXT NOT NULL,
    "sermonId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "title" TEXT,
    "content" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SermonReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedSermon" (
    "id" TEXT NOT NULL,
    "sermonId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedSermon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SermonReport" (
    "id" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "sermonId" TEXT,
    "commentId" TEXT,
    "reason" TEXT NOT NULL,
    "details" TEXT,
    "status" "SermonReportStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SermonReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SermonLike_userId_createdAt_idx" ON "SermonLike"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SermonLike_sermonId_userId_key" ON "SermonLike"("sermonId", "userId");

-- CreateIndex
CREATE INDEX "SermonComment_sermonId_status_createdAt_idx" ON "SermonComment"("sermonId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "SermonComment_parentId_createdAt_idx" ON "SermonComment"("parentId", "createdAt");

-- CreateIndex
CREATE INDEX "SermonComment_userId_createdAt_idx" ON "SermonComment"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "SermonCommentLike_userId_createdAt_idx" ON "SermonCommentLike"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SermonCommentLike_commentId_userId_key" ON "SermonCommentLike"("commentId", "userId");

-- CreateIndex
CREATE INDEX "SermonReview_sermonId_rating_idx" ON "SermonReview"("sermonId", "rating");

-- CreateIndex
CREATE INDEX "SermonReview_userId_createdAt_idx" ON "SermonReview"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SermonReview_sermonId_userId_key" ON "SermonReview"("sermonId", "userId");

-- CreateIndex
CREATE INDEX "SavedSermon_userId_createdAt_idx" ON "SavedSermon"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SavedSermon_sermonId_userId_key" ON "SavedSermon"("sermonId", "userId");

-- CreateIndex
CREATE INDEX "SermonReport_status_createdAt_idx" ON "SermonReport"("status", "createdAt");

-- CreateIndex
CREATE INDEX "SermonReport_sermonId_idx" ON "SermonReport"("sermonId");

-- CreateIndex
CREATE INDEX "SermonReport_commentId_idx" ON "SermonReport"("commentId");

-- CreateIndex
CREATE INDEX "SermonReport_reporterId_createdAt_idx" ON "SermonReport"("reporterId", "createdAt");

-- AddForeignKey
ALTER TABLE "SermonLike" ADD CONSTRAINT "SermonLike_sermonId_fkey" FOREIGN KEY ("sermonId") REFERENCES "Sermon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SermonLike" ADD CONSTRAINT "SermonLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SermonComment" ADD CONSTRAINT "SermonComment_sermonId_fkey" FOREIGN KEY ("sermonId") REFERENCES "Sermon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SermonComment" ADD CONSTRAINT "SermonComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SermonComment" ADD CONSTRAINT "SermonComment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "SermonComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SermonCommentLike" ADD CONSTRAINT "SermonCommentLike_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "SermonComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SermonCommentLike" ADD CONSTRAINT "SermonCommentLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SermonReview" ADD CONSTRAINT "SermonReview_sermonId_fkey" FOREIGN KEY ("sermonId") REFERENCES "Sermon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SermonReview" ADD CONSTRAINT "SermonReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedSermon" ADD CONSTRAINT "SavedSermon_sermonId_fkey" FOREIGN KEY ("sermonId") REFERENCES "Sermon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedSermon" ADD CONSTRAINT "SavedSermon_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SermonReport" ADD CONSTRAINT "SermonReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SermonReport" ADD CONSTRAINT "SermonReport_sermonId_fkey" FOREIGN KEY ("sermonId") REFERENCES "Sermon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SermonReport" ADD CONSTRAINT "SermonReport_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "SermonComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
