"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Heart,
  Bookmark,
  Share2,
  Check,
  Loader2,
  Copy,
  MessageCircle,
  Star,
} from "lucide-react";

import SermonComments from "@/components/sermons/SermonComments";
import SermonReviews from "@/components/sermons/SermonReviews";

type SermonInteractionsProps = {
  sermonId: string;
  sermonTitle: string;
  preacher: string;
};

type InteractionState = {
  likeCount: number;
  liked: boolean;
  saved: boolean;
};

export default function SermonInteractions({
  sermonId,
  sermonTitle,
  preacher,
}: SermonInteractionsProps) {
  const [state, setState] = useState<InteractionState>({
    likeCount: 0,
    liked: false,
    saved: false,
  });
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState<"like" | "save" | null>(null);
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const [activePanel, setActivePanel] = useState<"comments" | "reviews" | null>(null);

  useEffect(() => {
    let active = true;

    async function loadInteractions() {
      try {
        const response = await fetch(
          `/api/sermons/${encodeURIComponent(sermonId)}/interactions`,
          { cache: "no-store" },
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || "Unable to load interactions.");
        }

        if (active) {
          setState({
            likeCount: result.likeCount,
            liked: result.liked,
            saved: result.saved,
          });
        }
      } catch {
        if (active) {
          setMessage("Interactions could not be loaded.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadInteractions();

    return () => {
      active = false;
    };
  }, [sermonId]);

  const toggleInteraction = useCallback(
    async (type: "like" | "save") => {
      if (action) return;

      setAction(type);
      setMessage("");

      try {
        const response = await fetch(
          `/api/sermons/${encodeURIComponent(sermonId)}/${type}`,
          { method: "POST" },
        );

        const result = await response.json();

        if (response.status === 401) {
          const callbackUrl =
            window.location.pathname + window.location.search;

          window.location.assign(
            `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`,
          );
          return;
        }

        if (!response.ok || !result.success) {
          throw new Error(result.message || "Something went wrong.");
        }

        if (type === "like") {
          setState((previous) => ({
            ...previous,
            liked: result.liked,
            likeCount: result.likeCount,
          }));
        } else {
          setState((previous) => ({
            ...previous,
            saved: result.saved,
          }));
        }
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : "Unable to update your interaction.",
        );
      } finally {
        setAction(null);
      }
    },
    [action, sermonId],
  );

  async function shareSermon() {
    const url = window.location.href;

    const shareData = {
      title: sermonTitle,
      text: `"${sermonTitle}"  preached by ${preacher} at The Word Ministries International.`,
      url,
    };

    try {
      if (typeof navigator.share === "function") {
        await navigator.share(shareData);
        return;
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }
    }

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setMessage("Sermon link copied. You can now share it anywhere.");
        window.setTimeout(() => setCopied(false), 3000);
        return;
      }

      throw new Error("Clipboard access is unavailable.");
    } catch {
      setCopied(false);
      setMessage("Sharing is unavailable. Please copy the sermon URL from your browser.");
    }
  }

  return (
    <div className="mt-6 border-t border-[#e4e6eb] pt-5">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => toggleInteraction("like")}
          disabled={loading || action !== null}
          aria-pressed={state.liked}
          className={`inline-flex min-h-11 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
            state.liked
              ? "bg-[#e7f3ff] text-[#1877f2]"
              : "bg-[#f0f2f5] text-[#65676b] hover:bg-[#e4e6eb]"
          }`}
        >
          {action === "like" ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Heart
              size={18}
              fill={state.liked ? "currentColor" : "none"}
            />
          )}
          Like
          <span>{loading ? "" : state.likeCount}</span>
        </button>

        <button
          type="button"
          onClick={() => toggleInteraction("save")}
          disabled={loading || action !== null}
          aria-pressed={state.saved}
          className={`inline-flex min-h-11 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
            state.saved
              ? "bg-[#e7f3ff] text-[#1877f2]"
              : "bg-[#f0f2f5] text-[#65676b] hover:bg-[#e4e6eb]"
          }`}
        >
          {action === "save" ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Bookmark
              size={18}
              fill={state.saved ? "currentColor" : "none"}
            />
          )}
          {state.saved ? "Saved" : "Save"}
        </button>

        <button
          type="button"
          onClick={shareSermon}
          className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#f0f2f5] px-4 py-2.5 text-sm font-semibold text-[#65676b] transition hover:bg-[#e4e6eb]"
        >
          {copied ? <Check size={18} /> : <Share2 size={18} />}
          Share
        </button>

        <button
          type="button"
          onClick={() =>
            setActivePanel((current) =>
              current === "comments" ? null : "comments",
            )
          }
          aria-expanded={activePanel === "comments"}
          aria-controls="sermon-comments-panel"
          className={`inline-flex min-h-11 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition ${
            activePanel === "comments"
              ? "bg-[#e7f3ff] text-[#1877f2]"
              : "bg-[#f0f2f5] text-[#65676b] hover:bg-[#e4e6eb]"
          }`}
        >
          <MessageCircle size={18} />
          Comments
        </button>

        <button
          type="button"
          onClick={() =>
            setActivePanel((current) =>
              current === "reviews" ? null : "reviews",
            )
          }
          aria-expanded={activePanel === "reviews"}
          aria-controls="sermon-reviews-panel"
          className={`inline-flex min-h-11 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition ${
            activePanel === "reviews"
              ? "bg-[#e7f3ff] text-[#1877f2]"
              : "bg-[#f0f2f5] text-[#65676b] hover:bg-[#e4e6eb]"
          }`}
        >
          <Star size={18} />
          Ratings & Reviews
        </button>
      </div>

      {message && (
        <p
          role="status"
          className="mt-3 inline-flex items-center gap-2 text-xs text-[#65676b]"
        >
          {copied && <Copy size={13} />}
          {message}
        </p>
      )}

      {activePanel === "comments" && (
        <div id="sermon-comments-panel">
          <SermonComments sermonId={sermonId} />
        </div>
      )}

      {activePanel === "reviews" && (
        <div id="sermon-reviews-panel">
          <SermonReviews sermonId={sermonId} />
        </div>
      )}
    </div>
  );
}
