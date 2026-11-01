"use client";

import { useState } from "react";
import Link from "next/link";
import { Bookmark, BookOpen, Loader2, Trash2 } from "lucide-react";
import SermonCard from "@/components/sermons/SermonCard";

type SavedSermonItem = {
  id: string;
  createdAt: Date;
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

type SavedSermonsLibraryProps = {
  initialSermons: SavedSermonItem[];
};

export default function SavedSermonsLibrary({
  initialSermons,
}: SavedSermonsLibraryProps) {
  const [sermons, setSermons] = useState(initialSermons);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  async function removeSermon(sermonId: string) {
    if (removingId) return;

    setRemovingId(sermonId);
    setMessage("");

    try {
      const response = await fetch("/api/account/saved-sermons", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sermonId }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to remove this sermon.");
      }

      setSermons((current) =>
        current.filter((item) => item.sermon.id !== sermonId),
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to remove this sermon. Please try again.",
      );
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <div>
      {message && (
        <p role="alert" className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          {message}
        </p>
      )}

      {sermons.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-[#cbd5e1] bg-white px-6 py-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#e7f3ff] text-[#1877f2]">
            <Bookmark size={30} />
          </div>

          <h2 className="mt-5 text-lg font-bold text-[#1c1e21]">
            Your library is waiting
          </h2>

          <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-[#65676b]">
            Save sermons that speak to you and return to them whenever you need encouragement or deeper understanding.
          </p>

          <Link
            href="/sermons"
            className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#1877f2] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#0866ff]"
          >
            <BookOpen size={17} />
            Explore Sermons
          </Link>
        </section>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-5">
          {sermons.map((item) => (
            <div key={item.id} className="min-w-0">
              <SermonCard sermon={item.sermon} />

              <div className="mt-2 flex min-w-0 items-center justify-between gap-2 px-1">
                <span className="truncate text-[10px] text-[#65676b]">
                  Saved{" "}
                  {new Intl.DateTimeFormat("en", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  }).format(new Date(item.createdAt))}
                </span>

                <button
                  type="button"
                  onClick={() => removeSermon(item.sermon.id)}
                  disabled={removingId !== null}
                  aria-label={`Remove ${item.sermon.title} from saved sermons`}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[#65676b] shadow-sm transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                >
                  {removingId === item.sermon.id ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Trash2 size={16} />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
