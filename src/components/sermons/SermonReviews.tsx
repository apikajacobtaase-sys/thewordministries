"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Star,
  Send,
  Loader2,
  UserRound,
  Pencil,
} from "lucide-react";

type ReviewUser = {
  id: string;
  name: string | null;
  image: string | null;
};

type Review = {
  id: string;
  rating: number;
  title: string | null;
  content: string | null;
  createdAt: string;
  updatedAt: string;
  user: ReviewUser;
};

type ViewerReview = {
  id: string;
  rating: number;
  title: string | null;
  content: string | null;
} | null;

type SermonReviewsProps = {
  sermonId: string;
};

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en-GH", {
    dateStyle: "medium",
  }).format(date);
}

function getInitials(name: string | null) {
  if (!name?.trim()) return "M";

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function StarRating({
  rating,
  interactive = false,
  onSelect,
  size = 20,
}: {
  rating: number;
  interactive?: boolean;
  onSelect?: (value: number) => void;
  size?: number;
}) {
  return (
    <div
      className="flex items-center gap-1"
      role={interactive ? "group" : "img"}
      aria-label={`${rating} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((value) => (
        <button
          key={value}
          type="button"
          disabled={!interactive}
          onClick={() => onSelect?.(value)}
          aria-label={`Rate ${value} out of 5`}
          className={
            interactive
              ? "rounded-sm transition hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[#1877f2]"
              : "cursor-default"
          }
        >
          <Star
            size={size}
            fill={value <= rating ? "#f5a623" : "none"}
            color={value <= rating ? "#f5a623" : "#cbd0d8"}
            strokeWidth={1.8}
          />
        </button>
      ))}
    </div>
  );
}

export default function SermonReviews({
  sermonId,
}: SermonReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [viewerReview, setViewerReview] = useState<ViewerReview>(null);
  const [averageRating, setAverageRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);

  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadReviews = useCallback(async () => {
    setLoading(true);

    try {
      const response = await fetch(
        `/api/sermons/${sermonId}/reviews`,
        { cache: "no-store" },
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to load reviews.");
      }

      setReviews(result.reviews ?? []);
      setAverageRating(result.averageRating ?? 0);
      setReviewCount(result.reviewCount ?? 0);

      const ownReview = result.viewerReview ?? null;
      setViewerReview(ownReview);

      if (ownReview) {
        setRating(ownReview.rating);
        setTitle(ownReview.title ?? "");
        setContent(ownReview.content ?? "");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load reviews.",
      );
    } finally {
      setLoading(false);
    }
  }, [sermonId]);

  useEffect(() => {
    void loadReviews();
  }, [loadReviews]);

  async function submitReview(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSubmitting(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `/api/sermons/${sermonId}/reviews`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            rating,
            title,
            content,
          }),
        },
      );

      const result = await response.json();

      if (response.status === 401) {
        const callbackUrl = encodeURIComponent(
          window.location.pathname + window.location.search,
        );

        window.location.href = `/login?callbackUrl=${callbackUrl}`;
        return;
      }

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to save your review.");
      }

      setViewerReview(result.review);
      setMessage(result.message || "Your review has been saved.");
      await loadReviews();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to save your review.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mt-6 rounded-2xl border border-[#e4e6eb] bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 border-b border-[#e4e6eb] pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#1c1e21]">
            Ratings & Reviews
          </h2>
          <p className="mt-1 text-sm text-[#65676b]">
            Share how this message has blessed or impacted you.
          </p>
        </div>

        <div className="flex items-center gap-3 rounded-xl bg-[#f0f2f5] px-4 py-3">
          <span className="text-3xl font-bold text-[#1c1e21]">
            {averageRating > 0 ? averageRating.toFixed(1) : ""}
          </span>

          <div>
            <StarRating rating={averageRating} size={15} />
            <p className="mt-1 text-xs text-[#65676b]">
              {reviewCount} {reviewCount === 1 ? "review" : "reviews"}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={submitReview} className="space-y-4 border-b border-[#e4e6eb] py-5">
        <div>
          <h3 className="text-sm font-bold text-[#1c1e21]">
            {viewerReview ? "Update your review" : "Rate this sermon"}
          </h3>

          <div className="mt-2 flex items-center gap-3">
            <StarRating
              rating={rating}
              interactive
              onSelect={setRating}
              size={27}
            />
            <span className="text-sm font-semibold text-[#65676b]">
              {rating} / 5
            </span>
          </div>
        </div>

        <div>
          <label
            htmlFor={`review-title-${sermonId}`}
            className="mb-1.5 block text-sm font-semibold text-[#1c1e21]"
          >
            Review title <span className="font-normal text-[#65676b]">(optional)</span>
          </label>

          <input
            id={`review-title-${sermonId}`}
            type="text"
            maxLength={120}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Give your review a title"
            className="w-full rounded-xl border border-[#ccd0d5] bg-white px-4 py-3 text-sm text-[#1c1e21] outline-none transition placeholder:text-[#8a8d91] focus:border-[#1877f2] focus:ring-2 focus:ring-[#1877f2]/15"
          />
        </div>

        <div>
          <label
            htmlFor={`review-content-${sermonId}`}
            className="mb-1.5 block text-sm font-semibold text-[#1c1e21]"
          >
            Your experience <span className="font-normal text-[#65676b]">(optional)</span>
          </label>

          <textarea
            id={`review-content-${sermonId}`}
            rows={4}
            maxLength={3000}
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="What stood out to you in this message?"
            className="w-full resize-y rounded-xl border border-[#ccd0d5] bg-white px-4 py-3 text-sm text-[#1c1e21] outline-none transition placeholder:text-[#8a8d91] focus:border-[#1877f2] focus:ring-2 focus:ring-[#1877f2]/15"
          />

          <p className="mt-1 text-right text-xs text-[#8a8d91]">
            {content.length}/3000
          </p>
        </div>

        {error && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}

        {message && (
          <p role="status" className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
            {message}
          </p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-[#65676b]">
            {viewerReview
              ? "You can update your review at any time."
              : "Sign in to submit your rating and review."}
          </p>

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#1877f2] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#0866ff] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? (
              <Loader2 size={17} className="animate-spin" />
            ) : viewerReview ? (
              <Pencil size={16} />
            ) : (
              <Send size={16} />
            )}
            {submitting
              ? "Saving..."
              : viewerReview
                ? "Update review"
                : "Submit review"}
          </button>
        </div>
      </form>

      <div className="pt-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-bold text-[#1c1e21]">
            Community reviews
          </h3>

          <span className="text-xs text-[#65676b]">
            {reviewCount} total
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-[#65676b]">
            <Loader2 size={18} className="animate-spin" />
            Loading reviews...
          </div>
        ) : reviews.length === 0 ? (
          <div className="rounded-xl bg-[#f0f2f5] px-4 py-8 text-center">
            <Star size={28} className="mx-auto text-[#8a8d91]" />
            <p className="mt-2 text-sm font-semibold text-[#1c1e21]">
              No reviews yet
            </p>
            <p className="mt-1 text-xs text-[#65676b]">
              Be the first to share your experience with this sermon.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {reviews.map((review: Review) => (
              <article
                key={review.id}
                className="border-b border-[#e4e6eb] pb-5 last:border-0 last:pb-0"
              >
                <div className="flex items-start gap-3">
                  {review.user.image ? (
                    <img
                      src={review.user.image}
                      alt=""
                      className="h-10 w-10 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e4e6eb] text-sm font-bold text-[#65676b]">
                      {review.user.name
                        ? getInitials(review.user.name)
                        : <UserRound size={19} />}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-bold text-[#1c1e21]">
                        {review.user.name || "Church Member"}
                      </p>

                      <time className="text-xs text-[#8a8d91]">
                        {formatDate(review.createdAt)}
                      </time>
                    </div>

                    <div className="mt-1">
                      <StarRating rating={review.rating} size={15} />
                    </div>

                    {review.title && (
                      <h4 className="mt-2 text-sm font-bold text-[#1c1e21]">
                        {review.title}
                      </h4>
                    )}

                    {review.content && (
                      <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-[#4b4f56]">
                        {review.content}
                      </p>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
