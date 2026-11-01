-- CreateTable
CREATE TABLE "AboutPage" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'About The Word Ministries International',
    "introduction" TEXT,
    "story" TEXT NOT NULL DEFAULT '',
    "mission" TEXT,
    "vision" TEXT,
    "beliefs" TEXT,
    "values" TEXT,
    "pastorName" TEXT,
    "pastorTitle" TEXT,
    "pastorBiography" TEXT,
    "pastorImage" TEXT,
    "historyMilestones" JSONB,
    "heroImage" TEXT,
    "status" "AnnouncementStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AboutPage_pkey" PRIMARY KEY ("id")
);
