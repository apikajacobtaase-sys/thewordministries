-- CreateTable
CREATE TABLE "SermonDraft" (
    "id" TEXT NOT NULL,
    "sermonId" TEXT,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "preacher" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "scripture" TEXT,
    "description" TEXT NOT NULL,
    "thumbnail" TEXT,
    "mediaType" "SermonMediaType" NOT NULL DEFAULT 'AUDIO',
    "audioUrl" TEXT,
    "videoUrl" TEXT,
    "duration" INTEGER,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SermonDraft_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SermonDraft_sermonId_key" ON "SermonDraft"("sermonId");

-- CreateIndex
CREATE INDEX "SermonDraft_updatedAt_idx" ON "SermonDraft"("updatedAt");

-- CreateIndex
CREATE INDEX "SermonDraft_category_idx" ON "SermonDraft"("category");

-- AddForeignKey
ALTER TABLE "SermonDraft" ADD CONSTRAINT "SermonDraft_sermonId_fkey" FOREIGN KEY ("sermonId") REFERENCES "Sermon"("id") ON DELETE SET NULL ON UPDATE CASCADE;
