"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Archive,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  ImagePlus,
  LoaderCircle,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Send,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";

type NewsStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
type FilterType = "ALL" | NewsStatus;

type NewsArticle = {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  content: string;
  image: string | null;
  status: NewsStatus;
  publishedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type NewsFields = {
  title: string;
  slug: string;
  summary: string;
  content: string;
  image: string;
  status: NewsStatus;
  expiresAt: string;
};

type ConfirmAction = {
  title: string;
  description: string;
  label: string;
  danger?: boolean;
  action: () => void;
};

const EMPTY_FORM: NewsFields = {
  title: "",
  slug: "",
  summary: "",
  content: "",
  image: "",
  status: "DRAFT",
  expiresAt: "",
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toLocalInput(value?: string | null) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function formatDate(value?: string | null) {
  if (!value) return "Not published";

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

function getFields(article: NewsArticle): NewsFields {
  return {
    title: article.title,
    slug: article.slug,
    summary: article.summary ?? "",
    content: article.content,
    image: article.image ?? "",
    status: article.status,
    expiresAt: toLocalInput(article.expiresAt),
  };
}

const statusStyles: Record<NewsStatus, string> = {
  DRAFT: "bg-[#f0f2f5] text-[#606770]",
  PUBLISHED: "bg-[#e7f3ff] text-[#1877f2]",
  ARCHIVED: "bg-[#fff4e5] text-[#a65d03]",
};

export default function NewsManager() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<NewsFields>(EMPTY_FORM);
  const [initialForm, setInitialForm] = useState<NewsFields>(EMPTY_FORM);
  const [editorOpen, setEditorOpen] = useState(false);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [filter, setFilter] = useState<FilterType>("ALL");
  const [search, setSearch] = useState("");
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const isDirty = useMemo(
    () => JSON.stringify(form) !== JSON.stringify(initialForm),
    [form, initialForm],
  );

  const isEditing = useMemo(
    () => articles.find((item) => item.id === selectedId) ?? null,
    [articles, selectedId],
  );

  const loadNews = useCallback(async () => {
    setLoading(true);

    try {
      const response = await fetch("/api/admin/news", {
        cache: "no-store",
      });

      const body = await response.json();

      if (!response.ok || !body.success) {
        throw new Error(getErrorMessage(body, "Unable to load news."));
      }

      setArticles(body.data ?? []);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to load news.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadNews();
  }, [loadNews]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!editorOpen || !isDirty) return;
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [editorOpen, isDirty]);

  const updateField = <K extends keyof NewsFields>(
    field: K,
    value: NewsFields[K],
  ) => {
    setForm((current) => {
      const next = { ...current, [field]: value };

      if (field === "title" && !slugManuallyEdited) {
        next.slug = slugify(String(value));
      }

      return next;
    });
  };

  const openNewArticle = () => {
    if (editorOpen && isDirty) {
      setConfirmAction({
        title: "Discard changes?",
        description: "Your unsaved article changes will be lost.",
        label: "Discard changes",
        danger: true,
        action: () => {
          setConfirmAction(null);
          resetEditor();
          setEditorOpen(true);
        },
      });
      return;
    }

    resetEditor();
    setEditorOpen(true);
  };

  const resetEditor = () => {
    setSelectedId(null);
    setForm(EMPTY_FORM);
    setInitialForm(EMPTY_FORM);
    setSlugManuallyEdited(false);

    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  };

  const openArticle = (article: NewsArticle) => {
    if (editorOpen && isDirty) {
      setConfirmAction({
        title: "Discard changes?",
        description: "Your unsaved changes will be lost.",
        label: "Discard changes",
        danger: true,
        action: () => {
          setConfirmAction(null);
          const fields = getFields(article);
          setSelectedId(article.id);
          setForm(fields);
          setInitialForm(fields);
          setSlugManuallyEdited(true);
          setEditorOpen(true);
        },
      });
      return;
    }

    const fields = getFields(article);
    setSelectedId(article.id);
    setForm(fields);
    setInitialForm(fields);
    setSlugManuallyEdited(true);
    setEditorOpen(true);
  };

  const closeEditor = () => {
    if (isDirty) {
      setConfirmAction({
        title: "Discard article changes?",
        description: "Any unsaved changes will be permanently lost.",
        label: "Discard changes",
        danger: true,
        action: () => {
          setConfirmAction(null);
          resetEditor();
          setEditorOpen(false);
        },
      });
      return;
    }

    resetEditor();
    setEditorOpen(false);
  };

  const uploadImage = async (file?: File) => {
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
      toast.error("Choose a JPG, PNG, WebP or GIF image.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must not exceed 5MB.");
      return;
    }

    setUploading(true);
    const toastId = toast.loading("Uploading cover image...");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      const body = await response.json();

      if (!response.ok || !body.success || !body.data?.url) {
        throw new Error(getErrorMessage(body, "Image upload failed."));
      }

      updateField("image", body.data.url);
      toast.success("Cover image uploaded.", { id: toastId });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Image upload failed.",
        { id: toastId },
      );
    } finally {
      setUploading(false);
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  };

  const saveArticle = async (status: NewsStatus) => {
    if (!form.title.trim() || !form.slug.trim() || !form.content.trim()) {
      toast.error("Title, slug and content are required.");
      return;
    }

    if (form.expiresAt && new Date(form.expiresAt).getTime() <= Date.now()) {
      toast.error("Expiry date must be in the future.");
      return;
    }

    const payload = {
      ...form,
      title: form.title.trim(),
      slug: form.slug.trim(),
      summary: form.summary.trim() || null,
      content: form.content.trim(),
      image: form.image.trim() || null,
      status,
      expiresAt: form.expiresAt
        ? new Date(form.expiresAt).toISOString()
        : null,
    };

    setSaving(true);
    const toastId = toast.loading(
      selectedId ? "Updating article..." : "Creating article...",
    );

    try {
      const response = await fetch(
        selectedId
          ? `/api/admin/news/${selectedId}`
          : "/api/admin/news",
        {
          method: selectedId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      const body = await response.json();

      if (!response.ok || !body.success) {
        throw new Error(getErrorMessage(body, "Unable to save article."));
      }

      toast.success(body.message || "Article saved successfully.", {
        id: toastId,
      });

      resetEditor();
      setEditorOpen(false);
      setFilter("ALL");
      setSearch("");
      await loadNews();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to save article.",
        { id: toastId },
      );
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (
    article: NewsArticle,
    status: NewsStatus,
  ) => {
    const toastId = toast.loading(
      status === "ARCHIVED" ? "Archiving article..." : "Publishing article...",
    );

    try {
      const response = await fetch(`/api/admin/news/${article.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: article.title,
          slug: article.slug,
          summary: article.summary,
          content: article.content,
          image: article.image,
          expiresAt: article.expiresAt,
          status,
        }),
      });

      const body = await response.json();

      if (!response.ok || !body.success) {
        throw new Error(getErrorMessage(body, "Unable to update article."));
      }

      toast.success(body.message || "Article status updated.", {
        id: toastId,
      });

      await loadNews();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to update article.",
        { id: toastId },
      );
    }
  };

  const deleteArticle = async (article: NewsArticle) => {
    const toastId = toast.loading("Deleting article...");

    try {
      const response = await fetch(`/api/admin/news/${article.id}`, {
        method: "DELETE",
      });

      const body = await response.json();

      if (!response.ok || !body.success) {
        throw new Error(getErrorMessage(body, "Unable to delete article."));
      }

      toast.success(body.message || "Article deleted.", { id: toastId });

      if (selectedId === article.id) {
        resetEditor();
        setEditorOpen(false);
      }

      await loadNews();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to delete article.",
        { id: toastId },
      );
    }
  };

  const filteredArticles = useMemo(() => {
    const query = search.trim().toLowerCase();

    return articles.filter((article) => {
      const matchesFilter = filter === "ALL" || article.status === filter;
      const matchesSearch =
        !query ||
        article.title.toLowerCase().includes(query) ||
        article.slug.toLowerCase().includes(query) ||
        article.summary?.toLowerCase().includes(query) ||
        article.content.toLowerCase().includes(query);

      return matchesFilter && matchesSearch;
    });
  }, [articles, filter, search]);

  const counts = useMemo(
    () => ({
      total: articles.length,
      published: articles.filter((item) => item.status === "PUBLISHED").length,
      drafts: articles.filter((item) => item.status === "DRAFT").length,
      archived: articles.filter((item) => item.status === "ARCHIVED").length,
    }),
    [articles],
  );

  return (
    <main className="min-h-screen bg-[#f0f2f5] pb-24 text-[#1c1e21]">
      <header className="sticky top-0 z-30 border-b border-[#e4e6eb] bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              href="/more"
              aria-label="Back"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f0f2f5] text-[#606770] hover:bg-[#e4e6eb]"
            >
              <ArrowLeft size={19} />
            </Link>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#1877f2]">
                Administration
              </p>
              <h1 className="text-lg font-bold">News Management</h1>
            </div>
          </div>

          <button
            type="button"
            onClick={openNewArticle}
            className="inline-flex items-center gap-2 rounded-full bg-[#1877f2] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#166fe5]"
          >
            <Plus size={17} />
            <span className="hidden sm:inline">New article</span>
            <span className="sm:hidden">Create</span>
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-6xl space-y-5 px-4 py-5 sm:px-6">
        {!editorOpen && (
          <>
            <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[
                { label: "Total articles", value: counts.total, icon: FileText },
                { label: "Published", value: counts.published, icon: Send },
                { label: "Drafts", value: counts.drafts, icon: Clock3 },
                { label: "Archived", value: counts.archived, icon: Archive },
              ].map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-[#e4e6eb] bg-white p-4"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-[#65676b]">
                        {item.label}
                      </p>
                      <Icon size={18} className="text-[#1877f2]" />
                    </div>
                    <p className="mt-2 text-2xl font-bold">{item.value}</p>
                  </div>
                );
              })}
            </section>

            <section className="overflow-hidden rounded-2xl border border-[#e4e6eb] bg-white">
              <div className="space-y-3 border-b border-[#e4e6eb] p-4 sm:flex sm:items-center sm:justify-between sm:space-y-0">
                <div>
                  <h2 className="font-bold">All news</h2>
                  <p className="mt-1 text-xs text-[#65676b]">
                    Create, publish and manage church announcements.
                  </p>
                </div>

                <button
                  onClick={() => void loadNews()}
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-lg border border-[#e4e6eb] px-3 py-2 text-sm font-medium hover:bg-[#f0f2f5] disabled:opacity-50"
                >
                  <RefreshCw
                    size={15}
                    className={loading ? "animate-spin" : ""}
                  />
                  Refresh
                </button>
              </div>

              <div className="space-y-3 p-4">
                <div className="relative">
                  <Search
                    size={17}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a8d91]"
                  />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search news..."
                    className="w-full rounded-xl border border-[#e4e6eb] bg-[#f7f8fa] py-3 pl-10 pr-3 text-sm outline-none focus:border-[#1877f2]"
                  />
                </div>

                <div className="flex gap-2 overflow-x-auto pb-1">
                  {(["ALL", "PUBLISHED", "DRAFT", "ARCHIVED"] as FilterType[]).map(
                    (item) => (
                      <button
                        key={item}
                        onClick={() => setFilter(item)}
                        className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition ${
                          filter === item
                            ? "bg-[#1877f2] text-white"
                            : "bg-[#f0f2f5] text-[#606770] hover:bg-[#e4e6eb]"
                        }`}
                      >
                        {item === "ALL"
                          ? "All"
                          : item.charAt(0) + item.slice(1).toLowerCase()}
                      </button>
                    ),
                  )}
                </div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center gap-2 py-16 text-sm text-[#65676b]">
                  <LoaderCircle size={20} className="animate-spin" />
                  Loading news...
                </div>
              ) : filteredArticles.length === 0 ? (
                <div className="px-5 py-16 text-center">
                  <FileText size={36} className="mx-auto text-[#bcc0c4]" />
                  <h3 className="mt-3 font-semibold">No articles found</h3>
                  <p className="mt-1 text-sm text-[#65676b]">
                    Create an article or change your search filter.
                  </p>
                  <button
                    onClick={openNewArticle}
                    className="mt-4 rounded-full bg-[#1877f2] px-5 py-2.5 text-sm font-semibold text-white"
                  >
                    Create article
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-[#e4e6eb]">
                  {filteredArticles.map((article) => (
                    <article key={article.id} className="flex gap-3 p-4">
                      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-[#f0f2f5]">
                        {article.image ? (
                          <img
                            src={article.image}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <FileText
                            size={26}
                            className="m-auto mt-6 text-[#aeb4bd]"
                          />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate text-sm font-bold">
                            {article.title}
                          </h3>
                          <span
                            className={`rounded-full px-2 py-1 text-[10px] font-bold ${statusStyles[article.status]}`}
                          >
                            {article.status}
                          </span>
                        </div>

                        <p className="mt-1 line-clamp-2 text-xs text-[#65676b]">
                          {article.summary || article.content}
                        </p>

                        <p className="mt-2 flex items-center gap-1 text-xs text-[#65676b]">
                          <CalendarDays size={13} />
                          {formatDate(article.publishedAt)}
                        </p>

                        {article.expiresAt && (
                          <p className="mt-1 text-xs text-[#8a8d91]">
                            Expires: {formatDate(article.expiresAt)}
                          </p>
                        )}
                      </div>

                      <div className="flex shrink-0 flex-col gap-2">
                        <button
                          onClick={() => openArticle(article)}
                          aria-label={`Edit ${article.title}`}
                          className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e7f3ff] text-[#1877f2]"
                        >
                          <Pencil size={16} />
                        </button>

                        {article.status !== "ARCHIVED" && (
                          <button
                            onClick={() =>
                              setConfirmAction({
                                title: "Archive article?",
                                description: `"${article.title}" will no longer appear in public news.`,
                                label: "Archive article",
                                action: () => {
                                  setConfirmAction(null);
                                  void changeStatus(article, "ARCHIVED");
                                },
                              })
                            }
                            aria-label={`Archive ${article.title}`}
                            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#fff4e5] text-[#a65d03]"
                          >
                            <Archive size={16} />
                          </button>
                        )}

                        <button
                          onClick={() =>
                            setConfirmAction({
                              title: "Delete article permanently?",
                              description: `"${article.title}" will be permanently deleted. This action cannot be undone.`,
                              label: "Delete permanently",
                              danger: true,
                              action: () => {
                                setConfirmAction(null);
                                void deleteArticle(article);
                              },
                            })
                          }
                          aria-label={`Delete ${article.title}`}
                          className="flex h-9 w-9 items-center justify-center rounded-full bg-[#ffebe9] text-[#c0392b]"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        {editorOpen && (
          <section className="overflow-hidden rounded-2xl border border-[#e4e6eb] bg-white">
            <div className="flex items-center justify-between border-b border-[#e4e6eb] p-4">
              <div>
                <h2 className="font-bold">
                  {selectedId ? "Edit article" : "Create article"}
                </h2>
                <p className="mt-1 text-xs text-[#65676b]">
                  {selectedId
                    ? "Update this news article."
                    : "Write and publish a church announcement."}
                </p>
              </div>

              <button
                onClick={closeEditor}
                aria-label="Close editor"
                disabled={saving || uploading}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f0f2f5] text-[#606770]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-5 p-4 sm:p-6">
              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Cover image
                </label>

                {form.image ? (
                  <div className="relative overflow-hidden rounded-xl border border-[#e4e6eb]">
                    <img
                      src={form.image}
                      alt="Article preview"
                      className="h-48 w-full object-cover"
                    />
                    <button
                      onClick={() => updateField("image", "")}
                      className="absolute right-3 top-3 rounded-full bg-black/70 p-2 text-white"
                      aria-label="Remove image"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    className="flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#ccd0d5] bg-[#f7f8fa] px-4 py-8 text-[#65676b] hover:border-[#1877f2]"
                  >
                    <ImagePlus size={28} />
                    <span className="mt-2 text-sm font-semibold">
                      Upload cover image
                    </span>
                    <span className="mt-1 text-xs">
                      JPG, PNG, WebP or GIF  Maximum 5MB
                    </span>
                  </button>
                )}

                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={(event) =>
                    void uploadImage(event.target.files?.[0])
                  }
                />

                {uploading && (
                  <p className="mt-2 flex items-center gap-2 text-xs text-[#1877f2]">
                    <LoaderCircle size={14} className="animate-spin" />
                    Uploading image...
                  </p>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-semibold">
                    Article title *
                  </label>
                  <input
                    value={form.title}
                    onChange={(event) =>
                      updateField("title", event.target.value)
                    }
                    maxLength={200}
                    placeholder="Enter your news headline"
                    className="w-full rounded-xl border border-[#ccd0d5] px-3 py-3 text-sm outline-none focus:border-[#1877f2]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-semibold">
                    URL slug *
                  </label>
                  <input
                    value={form.slug}
                    onChange={(event) => {
                      setSlugManuallyEdited(true);
                      updateField("slug", slugify(event.target.value));
                    }}
                    maxLength={220}
                    placeholder="church-announcement-2026"
                    className="w-full rounded-xl border border-[#ccd0d5] px-3 py-3 text-sm outline-none focus:border-[#1877f2]"
                  />
                  <p className="mt-1 text-xs text-[#65676b]">
                    Automatically generated from the title. You can edit it.
                  </p>
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-semibold">
                    Summary
                  </label>
                  <textarea
                    value={form.summary}
                    onChange={(event) =>
                      updateField("summary", event.target.value)
                    }
                    maxLength={500}
                    rows={3}
                    placeholder="A short introduction to this announcement..."
                    className="w-full resize-y rounded-xl border border-[#ccd0d5] px-3 py-3 text-sm outline-none focus:border-[#1877f2]"
                  />
                  <p className="mt-1 text-right text-xs text-[#8a8d91]">
                    {form.summary.length}/500
                  </p>
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-semibold">
                    Article content *
                  </label>
                  <textarea
                    value={form.content}
                    onChange={(event) =>
                      updateField("content", event.target.value)
                    }
                    maxLength={50000}
                    rows={12}
                    placeholder="Write the full announcement here..."
                    className="w-full resize-y rounded-xl border border-[#ccd0d5] px-3 py-3 text-sm leading-6 outline-none focus:border-[#1877f2]"
                  />
                  <p className="mt-1 text-xs text-[#65676b]">
                    {form.content.length.toLocaleString()} / 50,000 characters
                  </p>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold">
                    Article status
                  </label>
                  <select
                    value={form.status}
                    onChange={(event) =>
                      updateField("status", event.target.value as NewsStatus)
                    }
                    className="w-full rounded-xl border border-[#ccd0d5] bg-white px-3 py-3 text-sm outline-none focus:border-[#1877f2]"
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="PUBLISHED">Published</option>
                    <option value="ARCHIVED">Archived</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold">
                    Expiry date (optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={form.expiresAt}
                    onChange={(event) =>
                      updateField("expiresAt", event.target.value)
                    }
                    min={toLocalInput(new Date().toISOString())}
                    className="w-full rounded-xl border border-[#ccd0d5] px-3 py-3 text-sm outline-none focus:border-[#1877f2]"
                  />
                  <p className="mt-1 text-xs text-[#65676b]">
                    The article stops appearing publicly after this date.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-[#e4e6eb] bg-[#f7f8fa] p-4 sm:flex-row sm:items-center sm:justify-between">
              <button
                onClick={closeEditor}
                disabled={saving || uploading}
                className="rounded-full border border-[#ccd0d5] bg-white px-5 py-2.5 text-sm font-semibold text-[#606770] hover:bg-[#f0f2f5] disabled:opacity-50"
              >
                Close
              </button>

              <div className="flex flex-col gap-2 sm:flex-row">
                {isEditing?.status === "PUBLISHED" && (
                  <button
                    onClick={() => void saveArticle("ARCHIVED")}
                    disabled={saving || uploading}
                    className="rounded-full border border-[#e4b6b6] bg-white px-5 py-2.5 text-sm font-semibold text-[#a65d03] disabled:opacity-50"
                  >
                    Archive
                  </button>
                )}

                <button
                  onClick={() => void saveArticle("DRAFT")}
                  disabled={saving || uploading}
                  className="rounded-full border border-[#ccd0d5] bg-white px-5 py-2.5 text-sm font-semibold hover:bg-[#f0f2f5] disabled:opacity-50"
                >
                  Save draft
                </button>

                <button
                  onClick={() => void saveArticle(form.status)}
                  disabled={saving || uploading}
                  className="rounded-full border border-[#ccd0d5] bg-white px-5 py-2.5 text-sm font-semibold hover:bg-[#f0f2f5] disabled:opacity-50"
                >
                  Save selected status
                </button>

                <button
                  onClick={() => void saveArticle("PUBLISHED")}
                  disabled={saving || uploading}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#1877f2] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#166fe5] disabled:opacity-50"
                >
                  {saving ? (
                    <LoaderCircle size={16} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={16} />
                  )}
                  {saving ? "Saving..." : "Publish"}
                </button>
              </div>
            </div>
          </section>
        )}
      </div>

      {confirmAction && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="news-confirm-title"
            className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl"
          >
            <h2 id="news-confirm-title" className="text-lg font-bold">
              {confirmAction.title}
            </h2>

            <p className="mt-2 text-sm leading-6 text-[#65676b]">
              {confirmAction.description}
            </p>

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setConfirmAction(null)}
                className="rounded-full border border-[#e4e6eb] px-4 py-2.5 text-sm font-semibold text-[#606770] hover:bg-[#f0f2f5]"
              >
                Keep editing
              </button>

              <button
                onClick={confirmAction.action}
                className={`rounded-full px-4 py-2.5 text-sm font-semibold text-white ${
                  confirmAction.danger
                    ? "bg-[#d93025] hover:bg-[#b3261e]"
                    : "bg-[#1877f2] hover:bg-[#166fe5]"
                }`}
              >
                {confirmAction.label}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
