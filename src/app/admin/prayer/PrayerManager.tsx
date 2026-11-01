"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Archive,
  CheckCircle2,
  Clock3,
  Eye,
  HeartHandshake,
  LoaderCircle,
  MessageCircle,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";

type PrayerStatus = "PENDING" | "IN_PROGRESS" | "ANSWERED" | "ARCHIVED";
type FilterType = "ALL" | PrayerStatus;

type PrayerRequest = {
  id: string;
  name: string | null;
  email: string | null;
  subject: string | null;
  message: string;
  isAnonymous: boolean;
  isPrivate: boolean;
  status: PrayerStatus;
  createdAt: string;
  updatedAt: string;
};

type PrayerStats = {
  total: number;
  pending: number;
  inProgress: number;
  answered: number;
  archived: number;
};

type ConfirmAction = {
  title: string;
  description: string;
  label: string;
  danger?: boolean;
  action: () => void;
};

const EMPTY_STATS: PrayerStats = {
  total: 0,
  pending: 0,
  inProgress: 0,
  answered: 0,
  archived: 0,
};

const STATUS_OPTIONS: PrayerStatus[] = [
  "PENDING",
  "IN_PROGRESS",
  "ANSWERED",
  "ARCHIVED",
];

const STATUS_STYLES: Record<PrayerStatus, string> = {
  PENDING: "bg-[#fff4e5] text-[#a65d03]",
  IN_PROGRESS: "bg-[#e7f3ff] text-[#1877f2]",
  ANSWERED: "bg-[#e6f4ea] text-[#188038]",
  ARCHIVED: "bg-[#f0f2f5] text-[#606770]",
};

const STATUS_LABELS: Record<PrayerStatus, string> = {
  PENDING: "Pending",
  IN_PROGRESS: "In progress",
  ANSWERED: "Answered",
  ARCHIVED: "Archived",
};

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Invalid date";

  return date.toLocaleString("en-GH", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getErrorMessage(body: unknown, fallback: string) {
  if (
    body &&
    typeof body === "object" &&
    "message" in body &&
    typeof body.message === "string"
  ) {
    return body.message;
  }

  return fallback;
}

export default function PrayerManager() {
  const [requests, setRequests] = useState<PrayerRequest[]>([]);
  const [stats, setStats] = useState<PrayerStats>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selected, setSelected] = useState<PrayerRequest | null>(null);
  const [selectedStatus, setSelectedStatus] =
    useState<PrayerStatus>("PENDING");
  const [filter, setFilter] = useState<FilterType>("ALL");
  const [search, setSearch] = useState("");
  const [confirmAction, setConfirmAction] =
    useState<ConfirmAction | null>(null);

  const loadRequests = useCallback(async () => {
    setLoading(true);

    try {
      const response = await fetch("/api/admin/prayer", {
        cache: "no-store",
      });

      const body = await response.json();

      if (!response.ok || !body.success) {
        throw new Error(
          getErrorMessage(body, "Unable to load prayer requests."),
        );
      }

      setRequests(body.data ?? []);
      setStats(body.stats ?? EMPTY_STATS);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to load prayer requests.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRequests();
  }, [loadRequests]);

  const filteredRequests = useMemo(() => {
    const query = search.trim().toLowerCase();

    return requests.filter((request) => {
      const matchesStatus =
        filter === "ALL" || request.status === filter;

      const matchesSearch =
        !query ||
        [
          request.name,
          request.subject,
          request.message,
          request.email,
        ]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(query));

      return matchesStatus && matchesSearch;
    });
  }, [requests, filter, search]);

  const updateStatus = async () => {
    if (!selected || selected.status === selectedStatus) return;

    setUpdating(true);

    try {
      const response = await fetch(
        `/api/admin/prayer/${selected.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: selectedStatus }),
        },
      );

      const body = await response.json();

      if (!response.ok || !body.success) {
        throw new Error(
          getErrorMessage(body, "Unable to update prayer request."),
        );
      }

      toast.success("Prayer request status updated.");
      setSelected(null);
      await loadRequests();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to update prayer request.",
      );
    } finally {
      setUpdating(false);
    }
  };

  const deleteRequest = async (id: string) => {
    setDeleting(true);

    try {
      const response = await fetch(`/api/admin/prayer/${id}`, {
        method: "DELETE",
      });

      const body = await response.json();

      if (!response.ok || !body.success) {
        throw new Error(
          getErrorMessage(body, "Unable to delete prayer request."),
        );
      }

      toast.success("Prayer request permanently deleted.");
      setSelected(null);
      setConfirmAction(null);
      await loadRequests();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to delete prayer request.",
      );
    } finally {
      setDeleting(false);
    }
  };

  const openRequest = (request: PrayerRequest) => {
    setSelected(request);
    setSelectedStatus(request.status);
  };

  const requestDeleteConfirmation = (request: PrayerRequest) => {
    setConfirmAction({
      title: "Delete prayer request?",
      description:
        "This will permanently delete this prayer request. This action cannot be undone.",
      label: "Delete permanently",
      danger: true,
      action: () => void deleteRequest(request.id),
    });
  };

  const statCards = [
    {
      label: "Total requests",
      value: stats.total,
      icon: Users,
      color: "text-[#1877f2]",
      background: "bg-[#e7f3ff]",
    },
    {
      label: "Pending",
      value: stats.pending,
      icon: Clock3,
      color: "text-[#a65d03]",
      background: "bg-[#fff4e5]",
    },
    {
      label: "In progress",
      value: stats.inProgress,
      icon: HeartHandshake,
      color: "text-[#1877f2]",
      background: "bg-[#e7f3ff]",
    },
    {
      label: "Answered",
      value: stats.answered,
      icon: CheckCircle2,
      color: "text-[#188038]",
      background: "bg-[#e6f4ea]",
    },
  ];

  return (
    <main className="min-h-screen bg-[#f0f2f5] pb-12 text-[#1c1e21]">
      <header className="sticky top-0 z-30 border-b border-[#e4e6eb] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/more"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f0f2f5] transition hover:bg-[#e4e6eb]"
              aria-label="Back"
            >
              <ArrowLeft size={19} />
            </Link>

            <div className="min-w-0">
              <h1 className="truncate text-lg font-bold sm:text-xl">
                Prayer Management
              </h1>
              <p className="text-xs text-[#65676b]">
                Manage and care for prayer requests
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void loadRequests()}
            disabled={loading}
            className="flex h-10 shrink-0 items-center gap-2 rounded-xl border border-[#e4e6eb] px-3 text-sm font-semibold transition hover:bg-[#f0f2f5] disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={loading ? "animate-spin" : ""}
            />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
        <section>
          <div className="mb-4">
            <h2 className="text-xl font-bold">Prayer overview</h2>
            <p className="mt-1 text-sm text-[#65676b]">
              An overview of requests received by the ministry.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {statCards.map((card) => {
              const Icon = card.icon;

              return (
                <div
                  key={card.label}
                  className="rounded-2xl border border-[#e4e6eb] bg-white p-4 shadow-sm sm:p-5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-[#65676b] sm:text-sm">
                      {card.label}
                    </span>
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${card.background} ${card.color}`}
                    >
                      <Icon size={18} />
                    </span>
                  </div>
                  <p className="mt-3 text-2xl font-bold sm:text-3xl">
                    {card.value}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-[#e4e6eb] bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold">Prayer requests</h2>
              <p className="text-sm text-[#65676b]">
                {filteredRequests.length} of {requests.length} requests
              </p>
            </div>

            <div className="relative w-full sm:max-w-sm">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#65676b]"
              />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search prayers..."
                className="h-11 w-full rounded-xl border border-[#ccd0d5] bg-white pl-10 pr-3 text-sm outline-none transition focus:border-[#1877f2] focus:ring-2 focus:ring-[#1877f2]/15"
              />
            </div>
          </div>

          <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
            {(
              [
                "ALL",
                "PENDING",
                "IN_PROGRESS",
                "ANSWERED",
                "ARCHIVED",
              ] as FilterType[]
            ).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setFilter(item)}
                className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition sm:text-sm ${
                  filter === item
                    ? "bg-[#1877f2] text-white"
                    : "bg-[#f0f2f5] text-[#606770] hover:bg-[#e4e6eb]"
                }`}
              >
                {item === "ALL"
                  ? "All requests"
                  : STATUS_LABELS[item]}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex min-h-52 items-center justify-center gap-3 text-sm text-[#65676b]">
              <LoaderCircle className="animate-spin" size={21} />
              Loading prayer requests...
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#e7f3ff] text-[#1877f2]">
                <MessageCircle size={25} />
              </span>
              <h3 className="mt-4 font-bold">No prayer requests found</h3>
              <p className="mt-1 max-w-sm text-sm text-[#65676b]">
                {search
                  ? "Try a different search term."
                  : "Prayer requests will appear here when people submit them."}
              </p>
              {(search || filter !== "ALL") && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setFilter("ALL");
                  }}
                  className="mt-4 text-sm font-semibold text-[#1877f2]"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className="mt-3 divide-y divide-[#e4e6eb]">
              {filteredRequests.map((request) => (
                <article
                  key={request.id}
                  className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <button
                    type="button"
                    onClick={() => openRequest(request)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="max-w-full truncate font-semibold">
                        {request.subject || "Prayer request"}
                      </h3>

                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${STATUS_STYLES[request.status]}`}
                      >
                        {STATUS_LABELS[request.status]}
                      </span>
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#65676b]">
                      <span className="flex items-center gap-1">
                        <UserRound size={13} />
                        {request.isAnonymous
                          ? "Anonymous"
                          : request.name || "Name not provided"}
                      </span>
                      {request.isPrivate && (
                        <span className="flex items-center gap-1">
                          <ShieldCheck size={13} />
                          Private
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock3 size={13} />
                        {formatDate(request.createdAt)}
                      </span>
                    </div>

                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-[#65676b]">
                      {request.message}
                    </p>
                  </button>

                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openRequest(request)}
                      className="flex h-10 items-center gap-2 rounded-xl bg-[#e7f3ff] px-3 text-sm font-semibold text-[#1877f2] transition hover:bg-[#dbeafe]"
                    >
                      <Eye size={16} />
                      View
                    </button>

                    <button
                      type="button"
                      onClick={() => requestDeleteConfirmation(request)}
                      aria-label="Delete prayer request"
                      className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ffebe9] text-[#c5221f] transition hover:bg-[#fce8e6]"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <div className="flex items-start gap-3 rounded-2xl border border-[#c9def8] bg-[#e7f3ff] p-4 text-sm text-[#174ea6]">
          <ShieldCheck size={20} className="mt-0.5 shrink-0" />
          <p>
            Prayer requests are confidential pastoral information.
            Access is restricted to authorized administrators. Respect
            the privacy and dignity of everyone who submits a request.
          </p>
        </div>
      </div>

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !updating) {
              setSelected(null);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="prayer-detail-title"
            className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
          >
            <div className="sticky top-0 flex items-center justify-between border-b border-[#e4e6eb] bg-white px-5 py-4">
              <div>
                <h2
                  id="prayer-detail-title"
                  className="text-lg font-bold"
                >
                  Prayer request details
                </h2>
                <p className="text-xs text-[#65676b]">
                  Submitted {formatDate(selected.createdAt)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelected(null)}
                disabled={updating}
                aria-label="Close details"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f0f2f5] hover:bg-[#e4e6eb]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-5 p-5">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-3 py-1.5 text-xs font-bold ${STATUS_STYLES[selected.status]}`}
                >
                  {STATUS_LABELS[selected.status]}
                </span>

                {selected.isAnonymous && (
                  <span className="rounded-full bg-[#f0f2f5] px-3 py-1.5 text-xs font-semibold text-[#606770]">
                    Anonymous
                  </span>
                )}

                {selected.isPrivate && (
                  <span className="flex items-center gap-1 rounded-full bg-[#e7f3ff] px-3 py-1.5 text-xs font-semibold text-[#1877f2]">
                    <ShieldCheck size={13} />
                    Private request
                  </span>
                )}
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#65676b]">
                  Subject
                </p>
                <h3 className="mt-1 text-xl font-bold">
                  {selected.subject || "Prayer request"}
                </h3>
              </div>

              <div className="rounded-2xl bg-[#f0f2f5] p-4">
                <p className="whitespace-pre-wrap text-sm leading-7 text-[#303338]">
                  {selected.message}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 rounded-2xl border border-[#e4e6eb] p-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-[#65676b]">Submitted by</p>
                  <p className="mt-1 text-sm font-semibold">
                    {selected.isAnonymous
                      ? "Anonymous"
                      : selected.name || "Not provided"}
                  </p>
                </div>

                {!selected.isAnonymous && (
                  <div>
                    <p className="text-xs text-[#65676b]">Email address</p>
                    <p className="mt-1 break-all text-sm font-semibold">
                      {selected.email || "Not provided"}
                    </p>
                  </div>
                )}

                <div>
                  <p className="text-xs text-[#65676b]">Last updated</p>
                  <p className="mt-1 text-sm font-semibold">
                    {formatDate(selected.updatedAt)}
                  </p>
                </div>
              </div>

              <div>
                <label
                  htmlFor="prayer-status"
                  className="mb-2 block text-sm font-bold"
                >
                  Update request status
                </label>

                <select
                  id="prayer-status"
                  value={selectedStatus}
                  onChange={(event) =>
                    setSelectedStatus(event.target.value as PrayerStatus)
                  }
                  className="h-12 w-full rounded-xl border border-[#ccd0d5] bg-white px-3 text-sm outline-none focus:border-[#1877f2] focus:ring-2 focus:ring-[#1877f2]/15"
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {STATUS_LABELS[status]}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => void updateStatus()}
                  disabled={updating || selectedStatus === selected.status}
                  className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#1877f2] px-4 text-sm font-bold text-white transition hover:bg-[#166fe5] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {updating && (
                    <LoaderCircle size={17} className="animate-spin" />
                  )}
                  Save status
                </button>
              </div>

              <button
                type="button"
                onClick={() => requestDeleteConfirmation(selected)}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#f5c2c7] text-sm font-semibold text-[#c5221f] transition hover:bg-[#ffebe9]"
              >
                <Trash2 size={16} />
                Delete prayer request
              </button>
            </div>
          </section>
        </div>
      )}

      {confirmAction && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]">
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="prayer-confirm-title"
            className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"
          >
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                confirmAction.danger
                  ? "bg-[#ffebe9] text-[#c5221f]"
                  : "bg-[#e7f3ff] text-[#1877f2]"
              }`}
            >
              {confirmAction.danger ? (
                <Trash2 size={22} />
              ) : (
                <Archive size={22} />
              )}
            </div>

            <h2
              id="prayer-confirm-title"
              className="mt-4 text-lg font-bold"
            >
              {confirmAction.title}
            </h2>

            <p className="mt-2 text-sm leading-6 text-[#65676b]">
              {confirmAction.description}
            </p>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setConfirmAction(null)}
                className="h-11 rounded-xl border border-[#ccd0d5] px-5 text-sm font-semibold hover:bg-[#f0f2f5] disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={deleting}
                onClick={confirmAction.action}
                className={`flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold text-white disabled:opacity-50 ${
                  confirmAction.danger
                    ? "bg-[#c5221f] hover:bg-[#a50e0e]"
                    : "bg-[#1877f2] hover:bg-[#166fe5]"
                }`}
              >
                {deleting && (
                  <LoaderCircle size={16} className="animate-spin" />
                )}
                {confirmAction.label}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
