"use client";

import { useCallback, useEffect, useState } from "react";
import {
  MessageCircle,
  Heart,
  Reply,
  Send,
  Flag,
  Loader2,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";

type CommentAuthor = {
  id: string;
  name: string | null;
  image: string | null;
};

type CommentItem = {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  parentId?: string | null;
  user: CommentAuthor;
  _count: {
    likes: number;
    replies?: number;
  };
  replies?: CommentItem[];
};

type SermonCommentsProps = {
  sermonId: string;
};

const REPORT_REASONS = [
  { value: "SPAM", label: "Spam" },
  { value: "HARASSMENT", label: "Harassment" },
  { value: "MISINFORMATION", label: "Misinformation" },
  { value: "INAPPROPRIATE", label: "Inappropriate content" },
  { value: "OTHER", label: "Other" },
];

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en-GH", {
    dateStyle: "medium",
    timeStyle: "short",
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

export default function SermonComments({
  sermonId,
}: SermonCommentsProps) {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const [content, setContent] = useState("");
  const [replyContent, setReplyContent] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [expandedReplies, setExpandedReplies] = useState<string[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [likingId, setLikingId] = useState<string | null>(null);
  const [reportingId, setReportingId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState("SPAM");
  const [reportDetails, setReportDetails] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loginRedirect = useCallback(() => {
    const callbackUrl =
      window.location.pathname + window.location.search;

    window.location.assign(
      `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`,
    );
  }, []);

  const loadComments = useCallback(
    async (cursor?: string) => {
      try {
        const query = new URLSearchParams({ limit: "20" });

        if (cursor) query.set("cursor", cursor);

        const response = await fetch(
          `/api/sermons/${encodeURIComponent(sermonId)}/comments?${query}`,
          { cache: "no-store" },
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || "Unable to load comments.");
        }

        setComments((previous) =>
          cursor
            ? [...previous, ...result.comments]
            : result.comments,
        );

        setNextCursor(result.nextCursor ?? null);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load comments.",
        );
      }
    },
    [sermonId],
  );

  useEffect(() => {
    let active = true;

    async function initialLoad() {
      setLoading(true);

      try {
        const response = await fetch(
          `/api/sermons/${encodeURIComponent(sermonId)}/comments?limit=20`,
          { cache: "no-store" },
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || "Unable to load comments.");
        }

        if (active) {
          setComments(result.comments);
          setNextCursor(result.nextCursor ?? null);
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load comments.",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    initialLoad();

    return () => {
      active = false;
    };
  }, [sermonId]);

  async function submitComment(parentId?: string) {
    const text = parentId ? replyContent.trim() : content.trim();

    if (!text || submitting) return;

    setSubmitting(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(
        `/api/sermons/${encodeURIComponent(sermonId)}/comments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: text,
            ...(parentId ? { parentId } : {}),
          }),
        },
      );

      const result = await response.json();

      if (response.status === 401) {
        loginRedirect();
        return;
      }

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to post comment.");
      }

      if (parentId) {
        setComments((previous) =>
          previous.map((comment) =>
            comment.id === parentId
              ? {
                  ...comment,
                  replies: [
                    ...(comment.replies ?? []),
                    result.comment,
                  ],
                  _count: {
                    ...comment._count,
                    replies: (comment._count.replies ?? 0) + 1,
                  },
                }
              : comment,
          ),
        );

        setReplyContent("");
        setReplyingTo(null);

        setExpandedReplies((previous) =>
          previous.includes(parentId)
            ? previous
            : [...previous, parentId],
        );
      } else {
        setComments((previous) => [
          result.comment,
          ...previous,
        ]);
        setContent("");
      }

      setMessage(result.message || "Comment posted.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to post comment.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleCommentLike(commentId: string) {
    if (likingId) return;

    setLikingId(commentId);
    setError("");

    try {
      const response = await fetch(
        `/api/sermons/${encodeURIComponent(sermonId)}/comments/${encodeURIComponent(commentId)}/like`,
        { method: "POST" },
      );

      const result = await response.json();

      if (response.status === 401) {
        loginRedirect();
        return;
      }

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to like comment.");
      }

      const updateComment = (item: CommentItem): CommentItem => {
        if (item.id === commentId) {
          return {
            ...item,
            _count: {
              ...item._count,
              likes: result.likeCount,
            },
          };
        }

        return {
          ...item,
          replies: item.replies?.map(updateComment),
        };
      };

      setComments((previous) => previous.map(updateComment));

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update like.",
      );
    } finally {
      setLikingId(null);
    }
  }

  async function submitReport(commentId: string) {
    if (reportSubmitting) return;

    setReportSubmitting(true);
    setError("");

    try {
      const response = await fetch(
        `/api/sermons/${encodeURIComponent(sermonId)}/comments/${encodeURIComponent(commentId)}/report`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reason: reportReason,
            details: reportDetails.trim(),
          }),
        },
      );

      const result = await response.json();

      if (response.status === 401) {
        loginRedirect();
        return;
      }

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to submit report.");
      }

      setMessage(result.message);
      setReportingId(null);
      setReportDetails("");
      setReportReason("SPAM");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to submit report.",
      );
    } finally {
      setReportSubmitting(false);
    }
  }

  async function loadMore() {
    if (!nextCursor || loadingMore) return;

    setLoadingMore(true);
    setError("");

    try {
      await loadComments(nextCursor);
    } finally {
      setLoadingMore(false);
    }
  }

  function toggleReplies(commentId: string) {
    setExpandedReplies((previous) =>
      previous.includes(commentId)
        ? previous.filter((id) => id !== commentId)
        : [...previous, commentId],
    );
  }

  function renderComment(
    comment: CommentItem,
    isReply = false,
  ) {
    const isReporting = reportingId === comment.id;

    return (
      <div
        key={comment.id}
        className={isReply ? "mt-4 pl-3 sm:pl-5" : ""}
      >
        <div className="flex gap-3">
          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-[#e7f3ff]">
            {comment.user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={comment.user.image}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs font-bold text-[#1877f2]">
                {getInitials(comment.user.name)}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="rounded-2xl bg-[#f0f2f5] px-4 py-3">
              <p className="text-sm font-bold text-[#1c1e21]">
                {comment.user.name || "Church Member"}
              </p>

              <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-[#3e4042]">
                {comment.content}
              </p>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 px-2 text-xs font-semibold text-[#65676b]">
              <span className="font-normal">
                {formatDate(comment.createdAt)}
              </span>

              <button
                type="button"
                onClick={() => toggleCommentLike(comment.id)}
                disabled={likingId === comment.id}
                className="inline-flex items-center gap-1 transition hover:text-[#1877f2] disabled:opacity-50"
              >
                {likingId === comment.id ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Heart size={14} />
                )}
                Like {comment._count.likes > 0 && `(${comment._count.likes})`}
              </button>

              {!isReply && (
                <button
                  type="button"
                  onClick={() => {
                    setReplyingTo(comment.id);
                    setReplyContent("");
                    setReportingId(null);
                  }}
                  className="inline-flex items-center gap-1 transition hover:text-[#1877f2]"
                >
                  <Reply size={14} />
                  Reply
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setReportingId(
                    isReporting ? null : comment.id,
                  );
                  setReplyingTo(null);
                  setError("");
                }}
                className="inline-flex items-center gap-1 transition hover:text-[#1877f2]"
                aria-label="Report comment"
              >
                <Flag size={13} />
                Report
              </button>
            </div>

            {isReporting && (
              <div className="mt-3 rounded-xl border border-[#e4e6eb] bg-white p-3">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-bold text-[#1c1e21]">
                    Report this comment
                  </p>

                  <button
                    type="button"
                    onClick={() => setReportingId(null)}
                    aria-label="Close report form"
                    className="rounded-full p-1 text-[#65676b] hover:bg-[#f0f2f5]"
                  >
                    <X size={17} />
                  </button>
                </div>

                <label className="mb-2 block text-xs font-semibold text-[#65676b]">
                  Reason
                </label>

                <select
                  value={reportReason}
                  onChange={(event) => setReportReason(event.target.value)}
                  className="min-h-10 w-full rounded-lg border border-[#ccd0d5] bg-white px-3 text-sm text-[#1c1e21] outline-none focus:border-[#1877f2]"
                >
                  {REPORT_REASONS.map((reason) => (
                    <option key={reason.value} value={reason.value}>
                      {reason.label}
                    </option>
                  ))}
                </select>

                <textarea
                  value={reportDetails}
                  onChange={(event) => setReportDetails(event.target.value)}
                  maxLength={500}
                  rows={2}
                  placeholder="Additional details (optional)"
                  className="mt-3 w-full resize-y rounded-lg border border-[#ccd0d5] px-3 py-2 text-sm outline-none focus:border-[#1877f2]"
                />

                <button
                  type="button"
                  onClick={() => submitReport(comment.id)}
                  disabled={reportSubmitting}
                  className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#1877f2] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0866ff] disabled:opacity-60"
                >
                  {reportSubmitting && (
                    <Loader2 size={15} className="animate-spin" />
                  )}
                  Submit report
                </button>
              </div>
            )}

            {replyingTo === comment.id && (
              <div className="mt-3 flex gap-2">
                <textarea
                  value={replyContent}
                  onChange={(event) => setReplyContent(event.target.value)}
                  maxLength={2000}
                  rows={2}
                  placeholder={`Reply to ${comment.user.name || "this member"}...`}
                  className="min-w-0 flex-1 resize-y rounded-xl border border-[#ccd0d5] px-3 py-2 text-sm outline-none focus:border-[#1877f2]"
                />

                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => submitComment(comment.id)}
                    disabled={submitting || !replyContent.trim()}
                    aria-label="Post reply"
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1877f2] text-white hover:bg-[#0866ff] disabled:opacity-50"
                  >
                    {submitting ? (
                      <Loader2 size={17} className="animate-spin" />
                    ) : (
                      <Send size={16} />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setReplyingTo(null)}
                    aria-label="Cancel reply"
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f0f2f5] text-[#65676b]"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            )}

            {!isReply && (
              <>
                {comment.replies && comment.replies.length > 0 && (
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={() => toggleReplies(comment.id)}
                      className="inline-flex items-center gap-1 px-2 py-1 text-xs font-bold text-[#1877f2] hover:underline"
                    >
                      {expandedReplies.includes(comment.id) ? (
                        <ChevronUp size={15} />
                      ) : (
                        <ChevronDown size={15} />
                      )}
                      {expandedReplies.includes(comment.id)
                        ? "Hide replies"
                        : `View ${comment._count.replies ?? comment.replies.length} ${
                            (comment._count.replies ?? comment.replies.length) === 1
                              ? "reply"
                              : "replies"
                          }`}
                    </button>

                    {expandedReplies.includes(comment.id) && (
                      <div className="mt-1 border-l-2 border-[#e4e6eb]">
                        {comment.replies.map((reply) =>
                          renderComment(reply, true),
                        )}
                      </div>
                    )}
                  </div>
                )}

                {(comment._count.replies ?? 0) > (comment.replies?.length ?? 0) && (
                  <p className="mt-2 px-2 text-xs text-[#65676b]">
                    Some replies are not shown in this view.
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  const commentCount = comments.reduce(
    (total, comment) =>
      total + 1 + (comment._count.replies ?? 0),
    0,
  );

  return (
    <section
      id="sermon-comments"
      className="mt-6 rounded-2xl border border-[#e4e6eb] bg-white p-4 shadow-sm sm:p-6"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e7f3ff] text-[#1877f2]">
          <MessageCircle size={21} />
        </div>

        <div>
          <h2 className="text-lg font-bold text-[#1c1e21]">
            Comments
          </h2>
          <p className="text-xs text-[#65676b]">
            {loading ? "Loading discussion..." : `${commentCount} comments and replies`}
          </p>
        </div>
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          submitComment();
        }}
        className="mt-5 flex gap-3"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e7f3ff] text-[#1877f2]">
          <MessageCircle size={18} />
        </div>

        <div className="min-w-0 flex-1">
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            maxLength={2000}
            rows={3}
            placeholder="Share what this message means to you..."
            className="w-full resize-y rounded-xl border border-[#ccd0d5] px-4 py-3 text-sm leading-6 text-[#1c1e21] outline-none transition placeholder:text-[#8a8d91] focus:border-[#1877f2]"
          />

          <div className="mt-2 flex items-center justify-between gap-3">
            <span className="text-[11px] text-[#8a8d91]">
              {content.length}/2000
            </span>

            <button
              type="submit"
              disabled={submitting || !content.trim()}
              className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[#1877f2] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#0866ff] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Send size={15} />
              )}
              Comment
            </button>
          </div>
        </div>
      </form>

      {message && (
        <p role="status" className="mt-4 rounded-lg bg-[#e7f3ff] px-3 py-2 text-xs text-[#1877f2]">
          {message}
        </p>
      )}

      {error && (
        <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
          {error}
        </p>
      )}

      <div className="mt-6 border-t border-[#e4e6eb] pt-5">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#1c1e21]">
            Recent discussion
          </h3>

          <MoreHorizontal size={20} className="text-[#8a8d91]" />
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-[#65676b]">
            <Loader2 size={19} className="animate-spin" />
            Loading comments...
          </div>
        ) : comments.length > 0 ? (
          <div className="space-y-6">
            {comments.map((comment) => renderComment(comment))}
          </div>
        ) : (
          <div className="py-10 text-center">
            <MessageCircle
              size={30}
              className="mx-auto text-[#bcc0c4]"
            />
            <p className="mt-3 text-sm font-semibold text-[#65676b]">
              No comments yet
            </p>
            <p className="mt-1 text-xs text-[#8a8d91]">
              Be the first to share your thoughts on this message.
            </p>
          </div>
        )}

        {nextCursor && (
          <button
            type="button"
            onClick={loadMore}
            disabled={loadingMore}
            className="mt-6 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#f0f2f5] text-sm font-semibold text-[#1877f2] transition hover:bg-[#e4e6eb] disabled:opacity-60"
          >
            {loadingMore && (
              <Loader2 size={17} className="animate-spin" />
            )}
            Load more comments
          </button>
        )}
      </div>
    </section>
  );
}
