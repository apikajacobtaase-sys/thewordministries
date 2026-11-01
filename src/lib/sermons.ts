export type Sermon = {
  id: string;
  title: string;
  preacher: string;
  category: string;
  scripture: string;
  description: string;
  publishedAt: string;
  duration: string;
  thumbnail: string;
  mediaType: "audio" | "video";
  mediaUrl: string | null;
  featured?: boolean;
};

export const sermonCategories = [
  "All",
  "Faith",
  "Prayer",
  "Holy Spirit",
  "Salvation",
  "Christian Living",
  "Spiritual Growth",
];

export const sermons: Sermon[] = [
  {
    id: "sample-sermon-1",
    title: "Walking in Faith",
    preacher: "Sermon information coming soon",
    category: "Faith",
    scripture: "Hebrews 11:1",
    description:
      "A sample sermon entry demonstrating how teachings will appear in the library. Replace this with an officially published church message.",
    publishedAt: "2026-10-26",
    duration: "Not available",
    thumbnail: "/images/sermon-feature.jpg",
    mediaType: "audio",
    mediaUrl: null,
    featured: true,
  },
  {
    id: "sample-sermon-2",
    title: "The Power of Prayer",
    preacher: "Sermon information coming soon",
    category: "Prayer",
    scripture: "Philippians 4:6–7",
    description:
      "A sample library entry. Add the official sermon description and recording when they become available.",
    publishedAt: "2026-10-26",
    duration: "Not available",
    thumbnail: "/images/sermon-feature.jpg",
    mediaType: "audio",
    mediaUrl: null,
  },
  {
    id: "sample-sermon-3",
    title: "Growing in the Word",
    preacher: "Sermon information coming soon",
    category: "Spiritual Growth",
    scripture: "2 Timothy 3:16–17",
    description:
      "A sample library entry demonstrating the sermon detail structure.",
    publishedAt: "2026-10-26",
    duration: "Not available",
    thumbnail: "/images/sermon-feature.jpg",
    mediaType: "video",
    mediaUrl: null,
  },
];