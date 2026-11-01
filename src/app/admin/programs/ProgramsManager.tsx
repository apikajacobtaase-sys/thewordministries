"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  ImagePlus,
  LoaderCircle,
  MapPin,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Users,
  X,
} from "lucide-react";

type EventStatus = "DRAFT" | "PUBLISHED" | "CANCELLED" | "COMPLETED";
type FilterType = "ALL" | EventStatus;

type Program = {
  id: string;
  title: string;
  slug: string;
  description: string;
  location: string | null;
  image: string | null;
  startDate: string;
  endDate: string | null;
  status: EventStatus;
  registrationRequired: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    registrations: number;
  };
};

type ProgramFields = {
  title: string;
  slug: string;
  description: string;
  location: string;
  image: string;
  startDate: string;
  endDate: string;
  status: EventStatus;
  registrationRequired: boolean;
};

const EMPTY_FORM: ProgramFields = {
  title: "",
  slug: "",
  description: "",
  location: "",
  image: "",
  startDate: "",
  endDate: "",
  status: "DRAFT",
  registrationRequired: false,
};

const BLUE = "#1877f2";

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

function toISO(value: string) {
  return value ? new Date(value).toISOString() : null;
}

function formatDate(value?: string | null) {
  if (!value) return "Not specified";

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

function getFields(program: Program): ProgramFields {
  return {
    title: program.title,
    slug: program.slug,
    description: program.description,
    location: program.location ?? "",
    image: program.image ?? "",
    startDate: toLocalInput(program.startDate),
    endDate: toLocalInput(program.endDate),
    status: program.status,
    registrationRequired: program.registrationRequired,
  };
}

const statusStyles: Record<EventStatus, string> = {
  DRAFT: "bg-[#f0f2f5] text-[#606770]",
  PUBLISHED: "bg-[#e7f3ff] text-[#1877f2]",
  CANCELLED: "bg-[#ffebe9] text-[#c0392b]",
  COMPLETED: "bg-[#e8f5e9] text-[#2e7d32]",
};

export default function ProgramsManager() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<ProgramFields>(EMPTY_FORM);
  const [initialForm, setInitialForm] = useState<ProgramFields>(EMPTY_FORM);
  const [editorOpen, setEditorOpen] = useState(false);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [filter, setFilter] = useState<FilterType>("ALL");
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const imageInputRef = useRef<HTMLInputElement>(null);

  const isDirty = useMemo(
    () => JSON.stringify(form) !== JSON.stringify(initialForm),
    [form, initialForm],
  );

  const selectedProgram = useMemo(
    () => programs.find((item) => item.id === selectedId) ?? null,
    [programs, selectedId],
  );

  const loadPrograms = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/programs", {
        cache: "no-store",
      });
      const body = await response.json();

      if (!response.ok || !body.success) {
        throw new Error(getErrorMessage(body, "Unable to load programs."));
      }

      setPrograms(body.data ?? []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load programs.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPrograms();
  }, [loadPrograms]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!editorOpen || !isDirty) return;
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [editorOpen, isDirty]);

  const updateField = <K extends keyof ProgramFields>(
    field: K,
    value: ProgramFields[K],
  ) => {
    setForm((current) => {
      const next = { ...current, [field]: value };

      if (field === "title" && !slugManuallyEdited) {
        next.slug = slugify(String(value));
      }

      return next;
    });
  };

  const openNewProgram = (skipConfirmation = false) => {
    if (!skipConfirmation && editorOpen && isDirty) {
      if (!window.confirm("Discard your unsaved changes?")) return;
    }

    setSelectedId(null);
    setForm(EMPTY_FORM);
    setInitialForm(EMPTY_FORM);
    setSlugManuallyEdited(false);
    setMessage("");
    setError("");
    setEditorOpen(true);
  };

  const openProgram = (program: Program) => {
    if (editorOpen && isDirty) {
      if (!window.confirm("Discard your unsaved changes?")) return;
    }

    const fields = getFields(program);

    setSelectedId(program.id);
    setForm(fields);
    setInitialForm(fields);
    setSlugManuallyEdited(true);
    setMessage("");
    setError("");
    setEditorOpen(true);
  };

  const closeEditor = () => {
    if (isDirty && !window.confirm("Discard your unsaved changes?")) return;
    setEditorOpen(false);
    setSelectedId(null);
    setForm(EMPTY_FORM);
    setInitialForm(EMPTY_FORM);
    setError("");
  };

  const uploadImage = async (file?: File) => {
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
      setError("Choose a JPG, PNG, WebP or GIF image.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image must not exceed 5MB.");
      return;
    }

    setUploading(true);
    setError("");

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
      setMessage("Program image uploaded successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Image upload failed.");
    } finally {
      setUploading(false);
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  };

  const saveProgram = async (status: EventStatus) => {
    setError("");
    setMessage("");

    if (!form.title.trim() || !form.slug.trim() || !form.description.trim()) {
      setError("Title, slug and description are required.");
      return;
    }

    if (!form.startDate) {
      setError("Please select a program start date.");
      return;
    }

    if (form.endDate && new Date(form.endDate) < new Date(form.startDate)) {
      setError("End date cannot be earlier than start date.");
      return;
    }

    const payload = {
      ...form,
      status,
      startDate: toISO(form.startDate),
      endDate: toISO(form.endDate),
      location: form.location.trim() || null,
      image: form.image.trim() || null,
    };

    setSaving(true);

    try {
      const response = await fetch(
        selectedId
          ? `/api/admin/programs/${selectedId}`
          : "/api/admin/programs",
        {
          method: selectedId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      const body = await response.json();

      if (!response.ok || !body.success) {
        throw new Error(getErrorMessage(body, "Unable to save program."));
      }

            setMessage(body.message || "Program saved successfully.");

      // Clear the editor and return to All Programs.
      setForm(EMPTY_FORM);
      setInitialForm(EMPTY_FORM);
      setSelectedId(null);
      setSlugManuallyEdited(false);
      setEditorOpen(false);

      if (imageInputRef.current) {
        imageInputRef.current.value = "";
      }

      setFilter("ALL");
      setSearch("");
      await loadPrograms();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save program.");
    } finally {
      setSaving(false);
    }
  };

  const deleteProgram = async (program: Program) => {
    const registrations = program._count?.registrations ?? 0;

    if (registrations > 0) {
      setError(
        "This program has registrations and cannot be deleted. Cancel or complete it instead.",
      );
      return;
    }

    if (!window.confirm(`Permanently delete "${program.title}"?`)) return;

    setError("");
    setMessage("");

    try {
      const response = await fetch(`/api/admin/programs/${program.id}`, {
        method: "DELETE",
      });

      const body = await response.json();

      if (!response.ok || !body.success) {
        throw new Error(getErrorMessage(body, "Unable to delete program."));
      }

      setMessage(body.message || "Program deleted.");
      if (selectedId === program.id) {
        setEditorOpen(false);
        setSelectedId(null);
      }

      await loadPrograms();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete program.");
    }
  };

  const filteredPrograms = useMemo(() => {
    const query = search.trim().toLowerCase();

    return programs.filter((program) => {
      const matchesFilter = filter === "ALL" || program.status === filter;
      const matchesSearch =
        !query ||
        program.title.toLowerCase().includes(query) ||
        program.location?.toLowerCase().includes(query) ||
        program.slug.toLowerCase().includes(query);

      return matchesFilter && matchesSearch;
    });
  }, [programs, filter, search]);

  const counts = useMemo(
    () => ({
      total: programs.length,
      published: programs.filter((item) => item.status === "PUBLISHED").length,
      drafts: programs.filter((item) => item.status === "DRAFT").length,
      registrations: programs.reduce(
        (total, item) => total + (item._count?.registrations ?? 0),
        0,
      ),
    }),
    [programs],
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
              <h1 className="text-lg font-bold">Programs</h1>
            </div>
          </div>

          <button
            type="button"
            onClick={() => openNewProgram()}
            className="inline-flex items-center gap-2 rounded-full bg-[#1877f2] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#166fe5]"
          >
            <Plus size={17} />
            <span className="hidden sm:inline">New program</span>
            <span className="sm:hidden">Create</span>
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-6xl space-y-5 px-4 py-5 sm:px-6">
        {message && (
          <div className="flex items-start gap-2 rounded-xl border border-[#b7dfc0] bg-[#e8f5e9] p-3 text-sm text-[#256b35]">
            <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
            <p>{message}</p>
            <button onClick={() => setMessage("")} className="ml-auto">
              <X size={16} />
            </button>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-[#f5c2c7] bg-[#ffebe9] p-3 text-sm text-[#a52834]">
            <p>{error}</p>
            <button onClick={() => setError("")} className="ml-auto">
              <X size={16} />
            </button>
          </div>
        )}

        {!editorOpen && (
          <>
            <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[
                { label: "Total programs", value: counts.total, icon: CalendarDays },
                { label: "Published", value: counts.published, icon: CheckCircle2 },
                { label: "Drafts", value: counts.drafts, icon: Clock3 },
                { label: "Registrations", value: counts.registrations, icon: Users },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="rounded-2xl border border-[#e4e6eb] bg-white p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-[#65676b]">{item.label}</p>
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
                  <h2 className="font-bold">All programs</h2>
                  <p className="mt-1 text-xs text-[#65676b]">
                    Create, publish and manage church programs.
                  </p>
                </div>
                <button
                  onClick={() => void loadPrograms()}
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-lg border border-[#e4e6eb] px-3 py-2 text-sm font-medium hover:bg-[#f0f2f5] disabled:opacity-50"
                >
                  <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
                  Refresh
                </button>
              </div>

              <div className="space-y-3 p-4">
                <div className="relative">
                  <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a8d91]" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search programs..."
                    className="w-full rounded-xl border border-[#e4e6eb] bg-[#f7f8fa] py-3 pl-10 pr-3 text-sm outline-none focus:border-[#1877f2]"
                  />
                </div>

                <div className="flex gap-2 overflow-x-auto pb-1">
                  {(["ALL", "PUBLISHED", "DRAFT", "CANCELLED", "COMPLETED"] as FilterType[]).map((item) => (
                    <button
                      key={item}
                      onClick={() => setFilter(item)}
                      className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition ${
                        filter === item
                          ? "bg-[#1877f2] text-white"
                          : "bg-[#f0f2f5] text-[#606770] hover:bg-[#e4e6eb]"
                      }`}
                    >
                      {item === "ALL" ? "All" : item.charAt(0) + item.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center gap-2 py-16 text-sm text-[#65676b]">
                  <LoaderCircle size={20} className="animate-spin" />
                  Loading programs...
                </div>
              ) : filteredPrograms.length === 0 ? (
                <div className="px-5 py-16 text-center">
                  <CalendarDays size={36} className="mx-auto text-[#bcc0c4]" />
                  <h3 className="mt-3 font-semibold">No programs found</h3>
                  <p className="mt-1 text-sm text-[#65676b]">
                    Create a program or change your search filter.
                  </p>
                  <button
                    onClick={() => openNewProgram()}
                    className="mt-4 rounded-full bg-[#1877f2] px-5 py-2.5 text-sm font-semibold text-white"
                  >
                    Create program
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-[#e4e6eb]">
                  {filteredPrograms.map((program) => (
                    <article key={program.id} className="flex gap-3 p-4">
                      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-[#f0f2f5]">
                        {program.image ? (
                          <img src={program.image} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <CalendarDays size={26} className="m-auto mt-6 text-[#aeb4bd]" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate text-sm font-bold">{program.title}</h3>
                          <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${statusStyles[program.status]}`}>
                            {program.status}
                          </span>
                        </div>
                        <p className="mt-1 flex items-center gap-1 text-xs text-[#65676b]">
                          <CalendarDays size={13} />
                          {formatDate(program.startDate)}
                        </p>
                        {program.location && (
                          <p className="mt-1 flex items-center gap-1 truncate text-xs text-[#65676b]">
                            <MapPin size={13} />
                            {program.location}
                          </p>
                        )}
                        <p className="mt-1 flex items-center gap-1 text-xs text-[#65676b]">
                          <Users size={13} />
                          {program._count?.registrations ?? 0} registrations
                        </p>
                      </div>

                      <div className="flex shrink-0 flex-col gap-2">
                        <button
                          onClick={() => openProgram(program)}
                          aria-label={`Edit ${program.title}`}
                          className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e7f3ff] text-[#1877f2]"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => void deleteProgram(program)}
                          aria-label={`Delete ${program.title}`}
                          disabled={(program._count?.registrations ?? 0) > 0}
                          title={(program._count?.registrations ?? 0) > 0 ? "Cannot delete a program with registrations" : "Delete program"}
                          className="flex h-9 w-9 items-center justify-center rounded-full bg-[#ffebe9] text-[#c0392b] disabled:cursor-not-allowed disabled:opacity-30"
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
                  {selectedId ? "Edit program" : "Create program"}
                </h2>
                <p className="mt-1 text-xs text-[#65676b]">
                  {selectedId ? "Update this program's details." : "Add a new church program or event."}
                </p>
              </div>
              <button
                onClick={closeEditor}
                aria-label="Close editor"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f0f2f5] text-[#606770]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-5 p-4 sm:p-6">
              <div>
                <label className="mb-2 block text-sm font-semibold">Program image</label>
                {form.image ? (
                  <div className="relative overflow-hidden rounded-xl border border-[#e4e6eb]">
                    <img src={form.image} alt="Program preview" className="h-48 w-full object-cover" />
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
                    <span className="mt-2 text-sm font-semibold">Upload program image</span>
                    <span className="mt-1 text-xs">JPG, PNG, WebP or GIF  Maximum 5MB</span>
                  </button>
                )}
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={(event) => void uploadImage(event.target.files?.[0])}
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
                  <label className="mb-1.5 block text-sm font-semibold">Program title *</label>
                  <input
                    value={form.title}
                    onChange={(event) => updateField("title", event.target.value)}
                    maxLength={200}
                    placeholder="e.g. Annual Convention 2026"
                    className="w-full rounded-xl border border-[#ccd0d5] px-3 py-3 text-sm outline-none focus:border-[#1877f2]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-semibold">URL slug *</label>
                  <input
                    value={form.slug}
                    onChange={(event) => {
                      setSlugManuallyEdited(true);
                      updateField("slug", slugify(event.target.value));
                    }}
                    maxLength={220}
                    placeholder="annual-convention-2026"
                    className="w-full rounded-xl border border-[#ccd0d5] px-3 py-3 text-sm outline-none focus:border-[#1877f2]"
                  />
                  <p className="mt-1 text-xs text-[#65676b]">
                    Automatically generated from the title. You can edit it.
                  </p>
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-semibold">Description *</label>
                  <textarea
                    value={form.description}
                    onChange={(event) => updateField("description", event.target.value)}
                    maxLength={50000}
                    rows={6}
                    placeholder="Describe the program, its purpose and what attendees should expect..."
                    className="w-full resize-y rounded-xl border border-[#ccd0d5] px-3 py-3 text-sm outline-none focus:border-[#1877f2]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-semibold">Location</label>
                  <input
                    value={form.location}
                    onChange={(event) => updateField("location", event.target.value)}
                    maxLength={300}
                    placeholder="e.g. The Word Ministries International, Zorkor"
                    className="w-full rounded-xl border border-[#ccd0d5] px-3 py-3 text-sm outline-none focus:border-[#1877f2]"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold">Start date and time *</label>
                  <input
                    type="datetime-local"
                    value={form.startDate}
                    onChange={(event) => updateField("startDate", event.target.value)}
                    className="w-full rounded-xl border border-[#ccd0d5] px-3 py-3 text-sm outline-none focus:border-[#1877f2]"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold">End date and time</label>
                  <input
                    type="datetime-local"
                    value={form.endDate}
                    onChange={(event) => updateField("endDate", event.target.value)}
                    min={form.startDate || undefined}
                    className="w-full rounded-xl border border-[#ccd0d5] px-3 py-3 text-sm outline-none focus:border-[#1877f2]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-semibold">Program status</label>
                  <select
                    value={form.status}
                    onChange={(event) => updateField("status", event.target.value as EventStatus)}
                    className="w-full rounded-xl border border-[#ccd0d5] bg-white px-3 py-3 text-sm outline-none focus:border-[#1877f2]"
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="PUBLISHED">Published</option>
                    <option value="CANCELLED">Cancelled</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>

                <label className="sm:col-span-2 flex cursor-pointer items-center gap-3 rounded-xl border border-[#e4e6eb] bg-[#f7f8fa] p-4">
                  <input
                    type="checkbox"
                    checked={form.registrationRequired}
                    onChange={(event) => updateField("registrationRequired", event.target.checked)}
                    className="h-4 w-4 accent-[#1877f2]"
                  />
                  <span>
                    <span className="block text-sm font-semibold">Registration required</span>
                    <span className="mt-1 block text-xs text-[#65676b]">
                      Indicate that attendees need to register for this program.
                    </span>
                  </span>
                </label>
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
                {selectedProgram && selectedProgram.status === "PUBLISHED" && (
                  <button
                    onClick={() => void saveProgram("CANCELLED")}
                    disabled={saving || uploading}
                    className="rounded-full border border-[#e4b6b6] bg-white px-5 py-2.5 text-sm font-semibold text-[#c0392b] disabled:opacity-50"
                  >
                    Cancel program
                  </button>
                )}

                <button
                  onClick={() => void saveProgram("DRAFT")}
                  disabled={saving || uploading}
                  className="rounded-full border border-[#ccd0d5] bg-white px-5 py-2.5 text-sm font-semibold hover:bg-[#f0f2f5] disabled:opacity-50"
                >
                  Save draft
                </button>

                <button
                  onClick={() => void saveProgram(form.status)}
                  disabled={saving || uploading}
                  className="rounded-full border border-[#ccd0d5] bg-white px-5 py-2.5 text-sm font-semibold hover:bg-[#f0f2f5] disabled:opacity-50"
                >
                  Save selected status
                </button>

                <button
                  onClick={() => void saveProgram("PUBLISHED")}
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
    </main>
  );
}

