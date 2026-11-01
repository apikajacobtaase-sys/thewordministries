import Image from "next/image";
import Link from "next/link";
import { Headphones, Play, BookOpen, Clock3 } from "lucide-react";

type SermonCardProps = {
  sermon: {
    id: string;
    title: string;
    preacher: string;
    category: string;
    scripture: string | null;
    description: string;
    thumbnail: string | null;
    mediaType: "AUDIO" | "VIDEO" | "BOTH";
    audioUrl: string | null;
    videoUrl: string | null;
    duration: number | null;
    publishedAt: Date | null;
  };
};

export default function SermonCard({ sermon }: SermonCardProps) {
  const hasAudio = Boolean(sermon.audioUrl);
  const hasVideo = Boolean(sermon.videoUrl);

  const mediaLabel =
    hasAudio && hasVideo
      ? "Audio & Video"
      : hasVideo
        ? "Video"
        : hasAudio
          ? "Audio"
          : "Recording coming soon";

  return (
    <article className="group min-w-0 overflow-hidden rounded-2xl border border-[#e4e6eb] bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#1877f2]/40 hover:shadow-md">
      <Link
        href={`/sermons/${sermon.id}`}
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#1877f2]"
      >
        <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-[#e7f3ff] via-[#f2f7ff] to-white">
          {sermon.thumbnail ? (
            <Image
              src={sermon.thumbnail}
              alt=""
              fill
              sizes="(max-width: 480px) 46vw, (max-width: 768px) 44vw, 320px"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-[#1877f2]/70">
              <BookOpen size={30} strokeWidth={1.5} aria-hidden="true" />

              <span className="text-[10px] font-bold uppercase tracking-[0.2em]">
                The Word
              </span>
            </div>
          )}

          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-black/5"
          />

          <span className="absolute left-2 top-2 max-w-[85%] truncate rounded-full border border-white/30 bg-white/95 px-2.5 py-1 text-[10px] font-semibold text-[#1877f2] shadow-sm backdrop-blur-sm">
            {sermon.category}
          </span>

          <div className="absolute bottom-2 right-2 flex h-9 w-9 items-center justify-center rounded-full bg-[#1877f2] text-white shadow-lg transition-colors group-hover:bg-[#0866ff]">
            {hasVideo ? (
              <Play size={16} fill="currentColor" aria-hidden="true" />
            ) : (
              <Headphones size={17} aria-hidden="true" />
            )}
          </div>
        </div>

        <div className="p-3 sm:p-4">
          <h2 className="line-clamp-2 min-h-[2.75rem] text-sm font-semibold leading-5 text-[#1c1e21] sm:text-base">
            {sermon.title}
          </h2>

          <p className="mt-2 truncate text-xs text-[#65676b]">
            {sermon.preacher}
          </p>

          {sermon.scripture && (
            <p className="mt-1 truncate text-[11px] font-medium text-[#1877f2]">
              {sermon.scripture}
            </p>
          )}

          <div className="mt-3 flex items-center justify-between gap-2 border-t border-[#e4e6eb] pt-3">
            <span className="truncate text-[10px] text-[#65676b] sm:text-xs">
              {mediaLabel}
            </span>

            {sermon.duration !== null && (
              <span className="flex shrink-0 items-center gap-1 text-[10px] text-[#65676b] sm:text-xs">
                <Clock3 size={12} aria-hidden="true" />
                {Math.floor(sermon.duration / 60)}:
                {String(sermon.duration % 60).padStart(2, "0")}
              </span>
            )}
          </div>
        </div>
      </Link>
    </article>
  );
}