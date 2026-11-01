"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  AudioLines,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  FileAudio,
  FileVideo,
  Filter,
  LoaderCircle,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Search,
  Send,
  Trash2,
  Video,
  X,
} from "lucide-react";

type MediaType = "AUDIO" | "VIDEO" | "BOTH";
type FilterType = "ALL" | "PUBLISHED" | "DRAFTS";

type SermonFields = {
  title: string;
  slug: string;
  preacher: string;
  category: string;
  scripture: string;
  description: string;
  thumbnail: string;
  mediaType: MediaType;
  audioUrl: string;
  videoUrl: string;
  duration: string;
  featured: boolean;
};

type SermonRecord = {
  id: string;
  title: string;
  slug: string;
  preacher: string;
  category: string;
  scripture?: string | null;
  description: string;
  thumbnail?: string | null;
  mediaType: MediaType;
  audioUrl?: string | null;
  videoUrl?: string | null;
  duration?: number | null;
  featured: boolean;
  published?: boolean;
  publishedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  sermonId?: string | null;
  draft?: SermonRecord | null;
  sermon?: SermonRecord | null;
};

const EMPTY_FORM: SermonFields = {
  title: "",
  slug: "",
  preacher: "",
  category: "",
  scripture: "",
  description: "",
  thumbnail: "",
  mediaType: "AUDIO",
  audioUrl: "",
  videoUrl: "",
  duration: "",
  featured: false,
};

const CATEGORIES = [
  "Sermon",
  "Bible Study",
  "Prayer",
  "Worship",
  "Teaching",
  "Prophecy",
  "Testimony",
  "Special Service",
];

const BLUE = "#1877f2";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getFields(record: SermonRecord): SermonFields {
  return {
    title: record.title ?? "",
    slug: record.slug ?? "",
    preacher: record.preacher ?? "",
    category: record.category ?? "",
    scripture: record.scripture ?? "",
    description: record.description ?? "",
    thumbnail: record.thumbnail ?? "",
    mediaType: record.mediaType ?? "AUDIO",
    audioUrl: record.audioUrl ?? "",
    videoUrl: record.videoUrl ?? "",
    duration:
      record.duration === null || record.duration === undefined
        ? ""
        : String(record.duration),
    featured: Boolean(record.featured),
  };
}

function formatDate(value?: string | null) {
  if (!value) return "Date unavailable";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return date.toLocaleDateString("en-GH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getErrorMessage(body: unknown, fallback: string) {
  if (
    body &&
    typeof body === "object" &&
    "error" in body &&
    typeof body.error === "string"
  ) {
    return body.error;
  }

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

function IconButton({
  children,
  onClick,
  title,
  disabled = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      disabled={disabled}
      onClick={onClick}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#e4e6eb] bg-white text-[#606770] transition hover:bg-[#f0f2f5] disabled:cursor-not-allowed disabled:opacity-50"
    >
      {children}
    </button>
  );
}

export default function SermonsManager() {
  const [sermons, setSermons] = useState<SermonRecord[]>([]);
  const [drafts, setDrafts] = useState<SermonRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedKind, setSelectedKind] = useState<"sermon" | "draft">(
    "draft"
  );
  const [form, setForm] = useState<SermonFields>(EMPTY_FORM);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [thumbnailUploadProgress, setThumbnailUploadProgress] = useState(0);
  const [thumbnailUploadError, setThumbnailUploadError] = useState("");
  const [filter, setFilter] = useState<FilterType>("ALL");
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [confirmAction, setConfirmAction] = useState<
    "publish" | "delete" | null
  >(null);

  const [isNew, setIsNew] = useState(true);
  const [editorOpen, setEditorOpen] = useState(true);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [initialForm, setInitialForm] =
    useState<SermonFields>(EMPTY_FORM);

  const isDirty = useMemo(
    () => JSON.stringify(form) !== JSON.stringify(initialForm),
    [form, initialForm]
  );

  const selectedSermon = useMemo(
    () => sermons.find((item) => item.id === selectedId) ?? null,
    [sermons, selectedId]
  );

  const selectedDraft = useMemo(
    () => drafts.find((item) => item.id === selectedId) ?? null,
    [drafts, selectedId]
  );

  const linkedDraft = useMemo(() => {
    if (selectedKind !== "sermon" || !selectedSermon) return null;

    return (
      selectedSermon.draft ??
      drafts.find((item) => item.sermonId === selectedSermon.id) ??
      null
    );
  }, [selectedKind, selectedSermon, drafts]);

  const selectedRecord =
    selectedKind === "sermon" ? selectedSermon : selectedDraft;

  const hasSavedDraft = Boolean(
    selectedKind === "sermon" && linkedDraft
  );

  const isPublished =
    selectedKind === "sermon" && Boolean(selectedSermon?.published);

  const setField = useCallback(
    <K extends keyof SermonFields>(
      key: K,
      value: SermonFields[K]
    ) => {
      setForm((previous) => {
        const next = { ...previous, [key]: value };

        if (key === "title" && !slugManuallyEdited) {
          next.slug = slugify(String(value));
        }

        return next;
      });
    },
    [slugManuallyEdited]
  );
  const handleThumbnailUpload = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setThumbnailUploadError("");

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
    ];

    if (!allowedTypes.includes(file.type)) {
      setThumbnailUploadError(
        "Please select a JPG, PNG, WebP, or GIF image."
      );
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setThumbnailUploadError("Image size must not exceed 5 MB.");
      event.target.value = "";
      return;
    }

    setUploadingThumbnail(true);
    setThumbnailUploadProgress(0);

    const formData = new FormData();
    formData.append("file", file);

    const xhr = new XMLHttpRequest();

    xhr.open("POST", "/api/admin/upload");

    xhr.upload.onprogress = (progressEvent) => {
      if (progressEvent.lengthComputable) {
        const percentage = Math.round(
          (progressEvent.loaded / progressEvent.total) * 100
        );

        setThumbnailUploadProgress(percentage);
      }
    };

    xhr.onload = () => {
      try {
        const result = JSON.parse(xhr.responseText);

        if (
          xhr.status >= 200 &&
          xhr.status < 300 &&
          result.success &&
          result.data?.url
        ) {
          setField("thumbnail", result.data.url);
          setThumbnailUploadError("");
          setThumbnailUploadProgress(100);
        } else {
          setThumbnailUploadError(
            result.message || "Image upload failed."
          );
        }
      } catch {
        setThumbnailUploadError(
          "Unable to process the upload response."
        );
      }

      setUploadingThumbnail(false);
      event.target.value = "";
    };

    xhr.onerror = () => {
      setThumbnailUploadError(
        "Network error. Please try uploading again."
      );
      setUploadingThumbnail(false);
      event.target.value = "";
    };

    xhr.onabort = () => {
      setThumbnailUploadError("Image upload was cancelled.");
      setUploadingThumbnail(false);
      event.target.value = "";
    };

    xhr.send(formData);
  };
  const loadData = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);

    setError("");

    try {
      const response = await fetch("/api/admin/sermons", {
        method: "GET",
        cache: "no-store",
      });

      const body = await response.json();

      if (!response.ok || body?.success === false) {
        throw new Error(
          getErrorMessage(body, "Could not load sermons.")
        );
      }

      const data = body?.data ?? {};

      setSermons(Array.isArray(data.sermons) ? data.sermons : []);
      setDrafts(Array.isArray(data.drafts) ? data.drafts : []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not load sermons. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!isDirty) return;

      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isDirty]);

  function openNewSermon(skipConfirmation = false) {
    if (!skipConfirmation && isDirty) {
      const shouldLeave = window.confirm(
        "You have unsaved changes. Discard them and create a new sermon?"
      );

      if (!shouldLeave) return;
    }

    setEditorOpen(true);
    setIsNew(true);
    setSelectedId(null);
    setSelectedKind("draft");
    setForm(EMPTY_FORM);
    setInitialForm(EMPTY_FORM);
    setSlugManuallyEdited(false);
    setConfirmAction(null);
    setMessage("");
    setError("");
  }

  function openRecord(
    record: SermonRecord,
    kind: "sermon" | "draft"
  ) {
    if (isDirty) {
      const shouldLeave = window.confirm(
        "You have unsaved changes. Discard them and open another sermon?"
      );

      if (!shouldLeave) return;
    }

    const fields = getFields(record);

    setIsNew(false);
    setSelectedId(record.id);
    setSelectedKind(kind);
    setForm(fields);
    setInitialForm(fields);
    setSlugManuallyEdited(true);
    setConfirmAction(null);
    setMessage("");
    setError("");
  }

  function startEditingPublishedSermon(record: SermonRecord) {
    openRecord(record, "sermon");
  }

  function buildPayload() {
    const durationValue = form.duration.trim();

    return {
      title: form.title.trim(),
      slug: form.slug.trim(),
      preacher: form.preacher.trim(),
      category: form.category.trim(),
      scripture: form.scripture.trim(),
      description: form.description.trim(),
      thumbnail: form.thumbnail.trim(),
      mediaType: form.mediaType,
      audioUrl: form.audioUrl.trim(),
      videoUrl: form.videoUrl.trim(),
      duration: durationValue === "" ? null : Number(durationValue),
      featured: form.featured,
    };
  }

  function validateForm() {
    if (
      !form.title.trim() ||
      !form.slug.trim() ||
      !form.preacher.trim() ||
      !form.category.trim() ||
      !form.description.trim()
    ) {
      setError(
        "Please complete the title, slug, preacher, category, and description."
      );
      return false;
    }

    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.slug.trim())) {
      setError(
        "The slug must contain lowercase letters, numbers, and single hyphens only."
      );
      return false;
    }

    if (
      form.duration.trim() &&
      (!Number.isInteger(Number(form.duration)) ||
        Number(form.duration) < 0)
    ) {
      setError("Duration must be a non-negative whole number of minutes.");
      return false;
    }

    const urls = [
      ["Thumbnail", form.thumbnail],
      ["Audio URL", form.audioUrl],
      ["Video URL", form.videoUrl],
    ] as const;

    for (const [label, value] of urls) {
      if (!value.trim()) continue;

      try {
        const parsed = new URL(value.trim());

        if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
          throw new Error("Invalid protocol");
        }
      } catch {
        setError(`${label} must be a valid HTTP or HTTPS URL.`);
        return false;
      }
    }

    if (
      form.mediaType === "AUDIO" &&
      !form.audioUrl.trim()
    ) {
      setError("Add an audio URL for an audio sermon.");
      return false;
    }

    if (
      form.mediaType === "VIDEO" &&
      !form.videoUrl.trim()
    ) {
      setError("Add a video URL for a video sermon.");
      return false;
    }

    if (
      form.mediaType === "BOTH" &&
      (!form.audioUrl.trim() || !form.videoUrl.trim())
    ) {
      setError(
        "Add both an audio URL and a video URL for this sermon."
      );
      return false;
    }

    return true;
  }

  async function saveDraft() {
    setMessage("");
    setError("");

    if (!validateForm()) return;

    setSaving(true);

    try {
      const url = isNew
        ? "/api/admin/sermons"
        : `/api/admin/sermons/${selectedId}`;

      const method = isNew ? "POST" : "PUT";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(buildPayload()),
      });

      const body = await response.json();

      if (!response.ok || body?.success === false) {
        throw new Error(
          getErrorMessage(body, "Could not save this draft.")
        );
      }

      const savedRecord = body?.data;

      await loadData(false);

      if (savedRecord?.id) {
        const savedFields = getFields(savedRecord);

        setSelectedId(savedRecord.id);
        setSelectedKind("draft");
        setIsNew(false);
        setForm(savedFields);
        setInitialForm(savedFields);
        setSlugManuallyEdited(true);
      } else {
        setInitialForm(form);
      }

      setMessage("Draft saved successfully.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not save the draft."
      );
    } finally {
      setSaving(false);
    }
  }

  async function publishSermon() {
    setMessage("");
    setError("");

    if (!validateForm()) {
      setConfirmAction(null);
      return;
    }

    setPublishing(true);

    try {
      let targetId = selectedId;
      let targetKind = selectedKind;

      if (isNew || isDirty) {
        const url = isNew
          ? "/api/admin/sermons"
          : `/api/admin/sermons/${selectedId}`;

        const response = await fetch(url, {
          method: isNew ? "POST" : "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(buildPayload()),
        });

        const body = await response.json();

        if (!response.ok || body?.success === false) {
          throw new Error(
            getErrorMessage(body, "Could not save before publishing.")
          );
        }

        targetId = body?.data?.id ?? targetId;
        targetKind = "draft";
      }

      if (!targetId) {
        throw new Error("Save the sermon draft before publishing.");
      }

      const publishResponse = await fetch(
        `/api/admin/sermons/${targetId}`,
        { method: "POST" }
      );

      const publishBody = await publishResponse.json();

      if (
        !publishResponse.ok ||
        publishBody?.success === false
      ) {
        throw new Error(
          getErrorMessage(publishBody, "Could not publish this sermon.")
        );
      }

      await loadData(false);

      setEditorOpen(false);
      setSelectedId(null);
      setSelectedKind("draft");
      setIsNew(true);
      setForm(EMPTY_FORM);
      setInitialForm(EMPTY_FORM);
      setSlugManuallyEdited(false);

      setMessage("Sermon published successfully.");
      setConfirmAction(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not publish this sermon."
      );
    } finally {
      setPublishing(false);
    }
  }

  async function deleteDraft() {
    setMessage("");
    setError("");

    if (!selectedId) return;

    setDeleting(true);

    try {
      const response = await fetch(
        `/api/admin/sermons/${selectedId}`,
        { method: "DELETE" }
      );

      const body = await response.json();

      if (!response.ok || body?.success === false) {
        throw new Error(
          getErrorMessage(body, "Could not delete this draft.")
        );
      }

      await loadData(false);
      openNewSermon(true);
      setMessage("Draft deleted successfully.");
      setConfirmAction(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not delete this draft."
      );
    } finally {
      setDeleting(false);
    }
  }

  const allRecords = useMemo(() => {
    const items: Array<{
      record: SermonRecord;
      kind: "sermon" | "draft";
      published: boolean;
      modifiedAt: string;
    }> = [];

    for (const sermon of sermons) {
      items.push({
        record: sermon,
        kind: "sermon",
        published: Boolean(sermon.published),
        modifiedAt: sermon.updatedAt ?? sermon.createdAt ?? "",
      });

      const draft = sermon.draft;

      if (draft) {
        items.push({
          record: draft,
          kind: "draft",
          published: false,
          modifiedAt: draft.updatedAt ?? draft.createdAt ?? "",
        });
      }
    }

    for (const draft of drafts) {
      if (draft.sermonId) continue;

      items.push({
        record: draft,
        kind: "draft",
        published: false,
        modifiedAt: draft.updatedAt ?? draft.createdAt ?? "",
      });
    }

    const seen = new Set<string>();

    return items.filter((item) => {
      const key = `${item.kind}:${item.record.id}`;

      if (seen.has(key)) return false;

      seen.add(key);
      return true;
    });
  }, [sermons, drafts]);

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase();

    return allRecords
      .filter((item) => {
        if (filter === "PUBLISHED" && !item.published) return false;
        if (filter === "DRAFTS" && item.published) return false;

        if (!query) return true;

        return [
          item.record.title,
          item.record.preacher,
          item.record.category,
          item.record.scripture ?? "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);
      })
      .sort((a, b) => {
        return (
          new Date(b.modifiedAt || 0).getTime() -
          new Date(a.modifiedAt || 0).getTime()
        );
      });
  }, [allRecords, filter, search]);

  const publishedCount = sermons.filter(
    (item) => item.published
  ).length;

  const draftCount = allRecords.filter(
    (item) => !item.published
  ).length;

  const pageInputClass =
    "mt-2 w-full rounded-xl border border-[#ccd0d5] bg-white px-3.5 py-3 text-sm text-[#1c1e21] outline-none transition placeholder:text-[#8a8d91] focus:border-[#1877f2] focus:ring-2 focus:ring-[#1877f2]/15";

  const labelClass =
    "block text-sm font-semibold text-[#344054]";

  return (
    <main className="min-h-screen bg-[#f0f2f5] text-[#1c1e21]">
      <header className="sticky top-0 z-30 border-b border-[#e4e6eb] bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/admin/about"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f0f2f5] text-[#606770] transition hover:bg-[#e4e6eb]"
              aria-label="Back to admin"
              title="Back to admin"
            >
              <ArrowLeft size={19} />
            </Link>

            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#1877f2]">
                The Word Ministries
              </p>
              <h1 className="truncate text-lg font-bold tracking-tight sm:text-xl">
                Sermon Studio
              </h1>
            </div>
          </div>

          <button
            type="button"
            onClick={() => openNewSermon()}
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[#1877f2] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#166fe5] focus:outline-none focus:ring-4 focus:ring-[#1877f2]/20"
          >
            <Plus size={17} />
            <span className="hidden sm:inline">New sermon</span>
            <span className="sm:hidden">New</span>
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="mb-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="mb-1 text-sm font-medium text-[#65676b]">
                Admin workspace
              </p>
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Sermon management
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#65676b] sm:text-base">
                Create messages, manage drafts, and publish sermons for
                your church community.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void loadData()}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-full border border-[#ccd0d5] bg-white px-4 py-2.5 text-sm font-semibold text-[#344054] transition hover:bg-[#f7f8fa] disabled:opacity-60"
            >
              <RefreshCw
                size={16}
                className={loading ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </div>
        </div>

        {message && (
          <div
            role="status"
            className="mb-5 flex items-start gap-3 rounded-xl border border-[#b7ebc6] bg-[#eaf8ee] px-4 py-3 text-sm text-[#216e39]"
          >
            <CheckCircle2 size={19} className="mt-0.5 shrink-0" />
            <p className="flex-1">{message}</p>
            <button
              type="button"
              onClick={() => setMessage("")}
              aria-label="Dismiss message"
            >
              <X size={17} />
            </button>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="mb-5 flex items-start gap-3 rounded-xl border border-[#f5c2c7] bg-[#fff0f1] px-4 py-3 text-sm text-[#b42318]"
          >
            <AlertCircle size={19} className="mt-0.5 shrink-0" />
            <p className="flex-1 break-words">{error}</p>
            <button
              type="button"
              onClick={() => setError("")}
              aria-label="Dismiss error"
            >
              <X size={17} />
            </button>
          </div>
        )}

        <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-[#e4e6eb] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-[#65676b]">
                Total sermons
              </span>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e7f3ff] text-[#1877f2]">
                <AudioLines size={20} />
              </span>
            </div>
            <p className="mt-4 text-3xl font-bold">
              {loading ? "" : sermons.length}
            </p>
            <p className="mt-1 text-xs text-[#8a8d91]">
              All saved sermon records
            </p>
          </div>

          <div className="rounded-2xl border border-[#e4e6eb] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-[#65676b]">
                Published
              </span>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e7f8ed] text-[#16803d]">
                <CheckCircle2 size={20} />
              </span>
            </div>
            <p className="mt-4 text-3xl font-bold">
              {loading ? "" : publishedCount}
            </p>
            <p className="mt-1 text-xs text-[#8a8d91]">
              Available to your congregation
            </p>
          </div>

          <div className="rounded-2xl border border-[#e4e6eb] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-[#65676b]">
                Drafts
              </span>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fff4e5] text-[#b54708]">
                <Clock3 size={20} />
              </span>
            </div>
            <p className="mt-4 text-3xl font-bold">
              {loading ? "" : draftCount}
            </p>
            <p className="mt-1 text-xs text-[#8a8d91]">
              Private and unpublished work
            </p>
          </div>
        </section>

        <div className={editorOpen ? "grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]" : "grid grid-cols-1 items-start gap-6"}>
          <section className="min-w-0 overflow-hidden rounded-2xl border border-[#e4e6eb] bg-white shadow-sm">
            <div className="border-b border-[#e4e6eb] p-4 sm:p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold">Your sermons</h3>
                  <p className="mt-1 text-xs text-[#65676b]">
                    Select a record to edit its details.
                  </p>
                </div>
                <span className="rounded-full bg-[#f0f2f5] px-3 py-1 text-xs font-semibold text-[#65676b]">
                  {filteredRecords.length} records
                </span>
              </div>

              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8a8d91]"
                />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search title, preacher, scripture..."
                  aria-label="Search sermons"
                  className="w-full rounded-xl border border-[#ccd0d5] bg-[#f7f8fa] py-3 pl-10 pr-4 text-sm outline-none transition focus:border-[#1877f2] focus:bg-white focus:ring-2 focus:ring-[#1877f2]/15"
                />
              </div>

              <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
                {(
                  [
                    ["ALL", "All"],
                    ["PUBLISHED", "Published"],
                    ["DRAFTS", "Drafts"],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setFilter(value)}
                    className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
                      filter === value
                        ? "bg-[#e7f3ff] text-[#1877f2]"
                        : "bg-[#f0f2f5] text-[#65676b] hover:bg-[#e4e6eb]"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="max-h-[850px] overflow-y-auto">
              {loading ? (
                <div className="flex min-h-64 flex-col items-center justify-center gap-3 px-5 text-center">
                  <LoaderCircle
                    size={28}
                    className="animate-spin text-[#1877f2]"
                  />
                  <p className="text-sm text-[#65676b]">
                    Loading your sermons...
                  </p>
                </div>
              ) : filteredRecords.length === 0 ? (
                <div className="flex min-h-64 flex-col items-center justify-center px-6 py-10 text-center">
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#f0f2f5] text-[#65676b]">
                    <FileAudio size={25} />
                  </span>
                  <h4 className="mt-4 font-bold">No sermons found</h4>
                  <p className="mt-1 max-w-xs text-sm leading-6 text-[#65676b]">
                    {search
                      ? "Try a different search term."
                      : "Create your first sermon or change the selected filter."}
                  </p>
                  {!search && (
                    <button
                      type="button"
                      onClick={() => openNewSermon()}
                      className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#1877f2] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#166fe5]"
                    >
                      <Plus size={16} />
                      Create sermon
                    </button>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-[#e4e6eb]">
                  {filteredRecords.map((item) => {
                    const active =
                      selectedId === item.record.id &&
                      selectedKind === item.kind;

                    return (
                      <button
                        key={`${item.kind}:${item.record.id}`}
                        type="button"
                        onClick={() =>
                          openRecord(item.record, item.kind)
                        }
                        className={`flex w-full items-start gap-3 p-4 text-left transition hover:bg-[#f7f8fa] sm:p-5 ${
                          active
                            ? "bg-[#e7f3ff]/70 ring-1 ring-inset ring-[#1877f2]/30"
                            : "bg-white"
                        }`}
                      >
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#e7f3ff] text-[#1877f2]">
                          {item.record.thumbnail ? (
                            <img
                              src={item.record.thumbnail}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : item.record.mediaType === "VIDEO" ? (
                            <Video size={21} />
                          ) : (
                            <AudioLines size={21} />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
                                item.published
                                  ? "bg-[#eaf8ee] text-[#16803d]"
                                  : "bg-[#fff4e5] text-[#b54708]"
                              }`}
                            >
                              {item.published ? "Published" : "Draft"}
                            </span>

                            {item.kind === "draft" &&
                              item.record.sermonId && (
                                <span className="text-[10px] font-semibold text-[#65676b]">
                                  EDITING LIVE SERMON
                                </span>
                              )}

                            {item.record.featured && (
                              <span className="rounded-full bg-[#f3e8ff] px-2.5 py-1 text-[10px] font-bold text-[#7e22ce]">
                                Featured
                              </span>
                            )}
                          </div>

                          <h4 className="mt-2 truncate text-sm font-bold text-[#1c1e21] sm:text-base">
                            {item.record.title || "Untitled sermon"}
                          </h4>

                          <p className="mt-1 truncate text-xs text-[#65676b]">
                            {item.record.preacher || "No preacher"} {" "}
                            {item.record.category || "Uncategorized"}
                          </p>

                          <p className="mt-2 text-xs text-[#8a8d91]">
                            Updated {formatDate(item.modifiedAt)}
                          </p>
                        </div>

                        <span className="mt-2 shrink-0 text-[#8a8d91]">
                          <Pencil size={16} />
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          {editorOpen && (
          <section className="min-w-0 rounded-2xl border border-[#e4e6eb] bg-white shadow-sm">
            <div className="border-b border-[#e4e6eb] px-4 py-5 sm:px-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.13em] text-[#1877f2]">
                    {isNew ? "Create content" : "Sermon editor"}
                  </p>
                  <h3 className="mt-1 text-xl font-bold">
                    {isNew
                      ? "New sermon"
                      : form.title || "Edit sermon"}
                  </h3>
                  <p className="mt-1 text-sm text-[#65676b]">
                    {isPublished
                      ? "Changes are saved as a draft until published."
                      : "Complete the details and save your work."}
                  </p>
                </div>

                {!isNew && (
                  <IconButton
                    title="Create a new sermon"
                    onClick={() => openNewSermon()}
                  >
                    <Plus size={18} />
                  </IconButton>
                )}
              </div>

              {!isNew && (
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
                      isPublished
                        ? "bg-[#eaf8ee] text-[#16803d]"
                        : "bg-[#fff4e5] text-[#b54708]"
                    }`}
                  >
                    {isPublished ? (
                      <CheckCircle2 size={14} />
                    ) : (
                      <Clock3 size={14} />
                    )}
                    {isPublished ? "Live sermon" : "Unpublished draft"}
                  </span>

                  {hasSavedDraft && (
                    <span className="rounded-full bg-[#e7f3ff] px-3 py-1.5 text-xs font-semibold text-[#1877f2]">
                      Saved changes awaiting publication
                    </span>
                  )}

                  {isDirty && (
                    <span className="rounded-full bg-[#fff4e5] px-3 py-1.5 text-xs font-semibold text-[#b54708]">
                      Unsaved changes
                    </span>
                  )}
                </div>
              )}
            </div>

            <form
              className="space-y-6 p-4 sm:p-6"
              onSubmit={(event) => {
                event.preventDefault();
                void saveDraft();
              }}
            >
              <div>
                <h4 className="text-sm font-bold">Basic information</h4>
                <p className="mt-1 text-xs text-[#65676b]">
                  Give the message a clear title and identify its speaker.
                </p>
              </div>

              <div>
                <label className={labelClass} htmlFor="sermon-title">
                  Sermon title <span className="text-red-500">*</span>
                </label>
                <input
                  id="sermon-title"
                  value={form.title}
                  onChange={(event) =>
                    setField("title", event.target.value)
                  }
                  placeholder="e.g. Walking in the Spirit"
                  className={pageInputClass}
                  required
                />
              </div>

              <div>
                <label className={labelClass} htmlFor="sermon-slug">
                  URL slug <span className="text-red-500">*</span>
                </label>
                <input
                  id="sermon-slug"
                  value={form.slug}
                  onChange={(event) => {
                    setSlugManuallyEdited(true);
                    setField("slug", slugify(event.target.value));
                  }}
                  placeholder="walking-in-the-spirit"
                  className={pageInputClass}
                  required
                />
                <p className="mt-1.5 break-all text-xs text-[#8a8d91]">
                  Public URL: /sermons/{form.slug || "your-sermon-slug"}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass} htmlFor="sermon-preacher">
                    Preacher <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="sermon-preacher"
                    value={form.preacher}
                    onChange={(event) =>
                      setField("preacher", event.target.value)
                    }
                    placeholder="Speaker's name"
                    className={pageInputClass}
                    required
                  />
                </div>

                <div>
                  <label className={labelClass} htmlFor="sermon-category">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="sermon-category"
                    type="text"
                    list="sermon-category-options"
                    value={form.category}
                    onChange={(event) =>
                      setField("category", event.target.value)
                    }
                    placeholder="Enter or select a category"
                    className={pageInputClass}
                    maxLength={100}
                    required
                  />
                  <datalist id="sermon-category-options">
                    {CATEGORIES.map((category) => (
                      <option key={category} value={category} />
                    ))}
                  </datalist>
                  <p className="mt-1.5 text-xs text-[#8a8d91]">
                    Choose a suggested category or enter your own.
                  </p>
                </div>
              </div>

              <div>
                <label className={labelClass} htmlFor="sermon-scripture">
                  Scripture reference
                </label>
                <input
                  id="sermon-scripture"
                  value={form.scripture}
                  onChange={(event) =>
                    setField("scripture", event.target.value)
                  }
                  placeholder="e.g. Galatians 5:16-25"
                  className={pageInputClass}
                />
              </div>

              <div>
                <label
                  className={labelClass}
                  htmlFor="sermon-description"
                >
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="sermon-description"
                  value={form.description}
                  onChange={(event) =>
                    setField("description", event.target.value)
                  }
                  placeholder="Describe the message and what listeners will learn..."
                  rows={5}
                  className={`${pageInputClass} resize-y`}
                  required
                />
              </div>

              <div className="border-t border-[#e4e6eb] pt-6">
                <h4 className="text-sm font-bold">Media and playback</h4>
                <p className="mt-1 text-xs text-[#65676b]">
                  Add the media URLs that your congregation can access.
                </p>
              </div>

              <div>
                <label className={labelClass} htmlFor="sermon-media-type">
                  Media type <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    id="sermon-media-type"
                    value={form.mediaType}
                    onChange={(event) =>
                      setField(
                        "mediaType",
                        event.target.value as MediaType
                      )
                    }
                    className={`${pageInputClass} appearance-none pr-10`}
                  >
                    <option value="AUDIO">Audio sermon</option>
                    <option value="VIDEO">Video sermon</option>
                    <option value="BOTH">Audio and video</option>
                  </select>
                  <ChevronDown
                    size={16}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#65676b]"
                  />
                </div>
              </div>

              {(form.mediaType === "AUDIO" ||
                form.mediaType === "BOTH") && (
                <div>
                  <label className={labelClass} htmlFor="sermon-audio">
                    Audio URL{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <FileAudio
                      size={17}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8a8d91]"
                    />
                    <input
                      id="sermon-audio"
                      type="url"
                      value={form.audioUrl}
                      onChange={(event) =>
                        setField("audioUrl", event.target.value)
                      }
                      placeholder="https://example.com/sermon.mp3"
                      className={`${pageInputClass} pl-10`}
                      required
                    />
                  </div>
                  <p className="mt-1.5 text-xs text-[#8a8d91]">
                    Paste a public audio link, such as an MP3/M4A file or a SoundCloud link.
                  </p>
                </div>
              )}

              {(form.mediaType === "VIDEO" ||
                form.mediaType === "BOTH") && (
                <div>
                  <label className={labelClass} htmlFor="sermon-video">
                    Video URL{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <FileVideo
                      size={17}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8a8d91]"
                    />
                    <input
                      id="sermon-video"
                      type="url"
                      value={form.videoUrl}
                      onChange={(event) =>
                        setField("videoUrl", event.target.value)
                      }
                      placeholder="https://example.com/sermon.mp4"
                      className={`${pageInputClass} pl-10`}
                      required
                    />
                  </div>
                  <p className="mt-1.5 text-xs text-[#8a8d91]">
                    Paste a YouTube link (including Copy/Share links, Shorts or Live), TikTok, Facebook, Instagram, X, Vimeo, or a direct MP4/WebM URL.
                  </p>
                </div>
              )}

             <div className="space-y-4">
  <div>
    <label className={labelClass}>
      Sermon thumbnail
    </label>

    <p className="mt-1 text-xs text-[#65676b]">
      Upload an image from your device or provide a direct image URL.
      Maximum upload size: 5 MB.
    </p>
  </div>

  {/* Hidden file input */}
  <input
    ref={thumbnailInputRef}
    type="file"
    accept="image/jpeg,image/png,image/webp,image/gif"
    onChange={handleThumbnailUpload}
    className="hidden"
  />

  {/* Upload and replace controls */}
  <div className="flex flex-wrap items-center gap-3">
    <button
      type="button"
      onClick={() => thumbnailInputRef.current?.click()}
      disabled={uploadingThumbnail}
      className="inline-flex items-center gap-2 rounded-xl bg-[#1877f2] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#166fe5] disabled:cursor-not-allowed disabled:opacity-60"
    >
      <Plus size={17} />

      {uploadingThumbnail
        ? "Uploading..."
        : form.thumbnail
          ? "Replace image"
          : "Upload image"}
    </button>

    {form.thumbnail && (
      <button
        type="button"
        onClick={() => {
          setField("thumbnail", "");
          setThumbnailUploadError("");
        }}
        disabled={uploadingThumbnail}
        className="inline-flex items-center gap-2 rounded-xl border border-[#e4e6eb] px-4 py-2.5 text-sm font-semibold text-[#65676b] transition hover:bg-[#f0f2f5] disabled:opacity-60"
      >
        <X size={16} />
        Remove image
      </button>
    )}
  </div>

  {/* Upload progress */}
  {uploadingThumbnail && (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-[#65676b]">
        <span>Uploading image to Cloudinary...</span>
        <span className="font-semibold">
          {thumbnailUploadProgress}%
        </span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-[#e4e6eb]">
        <div
          className="h-full rounded-full bg-[#1877f2] transition-all duration-200"
          style={{ width: `${thumbnailUploadProgress}%` }}
        />
      </div>
    </div>
  )}

  {/* Upload errors */}
  {thumbnailUploadError && (
    <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
      {thumbnailUploadError}
    </div>
  )}

  {/* External image URL */}
  <div>
    <label
      className={labelClass}
      htmlFor="sermon-thumbnail"
    >
      Or use an external image URL
    </label>

    <input
      id="sermon-thumbnail"
      type="url"
      value={form.thumbnail}
      onChange={(event) =>
        setField("thumbnail", event.target.value)
      }
      placeholder="https://example.com/sermon-cover.jpg"
      className={pageInputClass}
    />

    <p className="mt-1.5 text-xs text-[#8a8d91]">
      Use a direct image link, not a Google Images results page.
    </p>
  </div>

  {/* Image preview */}
  {form.thumbnail && (
    <div className="overflow-hidden rounded-xl border border-[#e4e6eb] bg-[#f7f8fa]">
      <div className="border-b border-[#e4e6eb] px-3 py-2">
        <span className="text-xs font-semibold text-[#65676b]">
          Thumbnail preview
        </span>
      </div>

      <img
        src={form.thumbnail}
        alt="Sermon thumbnail preview"
        className="max-h-64 w-full object-cover"
        onError={(event) => {
          event.currentTarget.style.display = "none";
        }}
      />
    </div>
  )}
</div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass} htmlFor="sermon-duration">
                    Duration (minutes)
                  </label>
                  <input
                    id="sermon-duration"
                    type="number"
                    min="0"
                    step="1"
                    value={form.duration}
                    onChange={(event) =>
                      setField("duration", event.target.value)
                    }
                    placeholder="e.g. 45"
                    className={pageInputClass}
                  />
                </div>

                <div className="flex items-center">
                  <label className="mt-6 flex w-full cursor-pointer items-center gap-3 rounded-xl border border-[#e4e6eb] bg-[#f7f8fa] p-3.5">
                    <input
                      type="checkbox"
                      checked={form.featured}
                      onChange={(event) =>
                        setField("featured", event.target.checked)
                      }
                      className="h-4 w-4 rounded accent-[#1877f2]"
                    />
                    <span>
                      <span className="block text-sm font-semibold">
                        Featured sermon
                      </span>
                      <span className="mt-0.5 block text-xs text-[#65676b]">
                        Highlight this message
                      </span>
                    </span>
                  </label>
                </div>
              </div>

              <div className="sticky bottom-0 -mx-4 -mb-4 border-t border-[#e4e6eb] bg-white/95 px-4 py-4 backdrop-blur sm:-mx-6 sm:-mb-6 sm:px-6">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="submit"
                    disabled={saving || publishing || deleting}
                    className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full border border-[#ccd0d5] bg-white px-4 py-2.5 text-sm font-semibold text-[#344054] transition hover:bg-[#f7f8fa] disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none"
                  >
                    {saving ? (
                      <LoaderCircle size={17} className="animate-spin" />
                    ) : (
                      <Save size={17} />
                    )}
                    {saving ? "Saving..." : "Save draft"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setError("");
                      setConfirmAction("publish");
                    }}
                    disabled={saving || publishing || deleting}
                    className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full bg-[#1877f2] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#166fe5] disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none"
                  >
                    {publishing ? (
                      <LoaderCircle size={17} className="animate-spin" />
                    ) : (
                      <Send size={16} />
                    )}
                    {publishing ? "Publishing..." : "Publish"}
                  </button>

                  {!isNew && (
                    <button
                      type="button"
                      onClick={() => {
                        setError("");
                        setConfirmAction("delete");
                      }}
                      disabled={saving || publishing || deleting}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#f5c2c7] bg-white px-4 py-2.5 text-sm font-semibold text-[#b42318] transition hover:bg-[#fff0f1] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Trash2 size={16} />
                      <span className="hidden sm:inline">
                        {isPublished ? "Discard draft" : "Delete draft"}
                      </span>
                      <span className="sm:hidden">Delete</span>
                    </button>
                  )}
                </div>

                <p className="mt-3 text-xs leading-5 text-[#8a8d91]">
                  {isPublished
                    ? "Saving changes creates a private draft. Publishing applies those changes to the live sermon."
                    : "Saving keeps this sermon private. Publishing makes it available on the public sermons page."}
                </p>
              </div>
            </form>
          </section>
          )}
        </div>

        <footer className="py-6 text-center text-xs text-[#8a8d91]">
          The Word Ministries International  Sermon Studio
        </footer>
      </div>

      {confirmAction && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#1c1e21]/50 p-4 backdrop-blur-[2px]"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setConfirmAction(null);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="sermon-confirm-title"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
          >
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-full ${
                confirmAction === "publish"
                  ? "bg-[#e7f3ff] text-[#1877f2]"
                  : "bg-[#fff0f1] text-[#b42318]"
              }`}
            >
              {confirmAction === "publish" ? (
                <Send size={22} />
              ) : (
                <Trash2 size={22} />
              )}
            </div>

            <h3
              id="sermon-confirm-title"
              className="mt-4 text-xl font-bold"
            >
              {confirmAction === "publish"
                ? "Publish this sermon?"
                : isPublished
                  ? "Discard saved changes?"
                  : "Delete this draft?"}
            </h3>

            <p className="mt-2 text-sm leading-6 text-[#65676b]">
              {confirmAction === "publish"
                ? "This sermon will become available on the public sermons page. If you are editing a published sermon, your saved changes will replace its live content."
                : isPublished
                  ? "The unpublished changes will be removed. The currently published sermon will remain available."
                  : "This will permanently remove the selected draft. This action cannot be undone."}
            </p>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setConfirmAction(null)}
                disabled={publishing || deleting}
                className="rounded-full border border-[#ccd0d5] px-5 py-2.5 text-sm font-semibold text-[#344054] hover:bg-[#f7f8fa] disabled:opacity-60"
              >
                Cancel
              </button>

              {confirmAction === "publish" ? (
                <button
                  type="button"
                  onClick={() => void publishSermon()}
                  disabled={publishing || saving}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#1877f2] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#166fe5] disabled:opacity-60"
                >
                  {publishing && (
                    <LoaderCircle size={16} className="animate-spin" />
                  )}
                  Confirm publish
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => void deleteDraft()}
                  disabled={deleting}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#d92d20] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#b42318] disabled:opacity-60"
                >
                  {deleting && (
                    <LoaderCircle size={16} className="animate-spin" />
                  )}
                  Confirm delete
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}



