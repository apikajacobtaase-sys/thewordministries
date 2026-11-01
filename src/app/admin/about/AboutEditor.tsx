 "use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
ArrowLeft,
BookOpen,
CheckCircle2,
Eye,
Globe,
LoaderCircle,
Save,
UserRound,
} from "lucide-react";

type HistoryMilestone = {
  year: string;
  title: string;
  description: string;
};

type AboutForm = {
historyMilestones: HistoryMilestone[];
title: string;
introduction: string;
story: string;
mission: string;
vision: string;
beliefs: string;
values: string;
pastorName: string;
pastorTitle: string;
pastorBiography: string;
pastorImage: string;
heroImage: string;
status: "DRAFT" | "PUBLISHED";
};

const initialForm: AboutForm = {
  historyMilestones: [],
title: "About The Word Ministries International",
introduction: "",
story: "",
mission: "",
vision: "",
beliefs: "",
values: "",
pastorName: "",
pastorTitle: "",
pastorBiography: "",
pastorImage: "",
heroImage: "",
status: "DRAFT",
};

const fields: {
name: keyof AboutForm;
label: string;
description: string;
multiline?: boolean;
}[] = [
{
name: "introduction",
label: "Introduction",
description: "A short introduction visitors see before reading the full story.",
multiline: true,
},
{
name: "story",
label: "Our Story",
description: "The ministry's history, beginnings, experiences, and journey.",
multiline: true,
},
{
name: "mission",
label: "Our Mission",
description: "Explain what the ministry exists to accomplish.",
multiline: true,
},
{
name: "vision",
label: "Our Vision",
description: "Describe the ministry's vision and future direction.",
multiline: true,
},
{
name: "beliefs",
label: "Our Beliefs",
description: "Document the ministry's foundational beliefs.",
multiline: true,
},
{
name: "values",
label: "Our Values",
description: "Describe the principles that guide the ministry.",
multiline: true,
},
];

export default function AdminAboutPage() {
const [editing, setEditing] = useState(false);
const [showPreview, setShowPreview] = useState(false);
const [showPublishConfirmation, setShowPublishConfirmation] = useState(false);
const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
const [form, setForm] = useState<AboutForm>(initialForm);
const savedFormRef = useRef<AboutForm>(initialForm);
const [loading, setLoading] = useState(true);
const [saving, setSaving] = useState(false);
const [message, setMessage] = useState("");
const [error, setError] = useState("");
const [uploadingImage, setUploadingImage] = useState<"heroImage" | "pastorImage" | null>(null);

const [draftId, setDraftId] = useState<string | null>(null);
const [publishedId, setPublishedId] = useState<string | null>(null);
const [showDraftReminder, setShowDraftReminder] = useState(false);
const [deletingDraft, setDeletingDraft] = useState(false);

const loadAbout = useCallback(async () => {
  setLoading(true);
  setError("");
  setMessage("");

  try {
    const response = await fetch("/api/admin/about", {
      cache: "no-store",
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.message || "Unable to load About page content.",
      );
    }

    const published = result.data?.published ?? null;
    const draft = result.data?.draft ?? null;

    setDraftId(draft?.id ?? null);
    setPublishedId(published?.id ?? null);
    setShowDraftReminder(Boolean(draft));

    // Prefer the draft when available, but keep the editor read-only on load.
const content = draft ?? published;
setEditing(false);
setHasUnsavedChanges(false);

     if (!content) {
  savedFormRef.current = initialForm;
  setForm(initialForm);
  setHasUnsavedChanges(false);
  return;
}
   const loadedForm: AboutForm = {
  ...initialForm,
  ...content,
  historyMilestones: Array.isArray(content.historyMilestones)
    ? content.historyMilestones.map((item: unknown) => {
        const milestone = item as Partial<HistoryMilestone>;

        return {
          year: String(milestone.year ?? ""),
          title: String(milestone.title ?? ""),
          description: String(milestone.description ?? ""),
        };
      })
    : [],
  introduction: content.introduction ?? "",
  story: content.story ?? "",
  mission: content.mission ?? "",
  vision: content.vision ?? "",
  beliefs: content.beliefs ?? "",
  values: content.values ?? "",
  pastorName: content.pastorName ?? "",
  pastorTitle: content.pastorTitle ?? "",
  pastorBiography: content.pastorBiography ?? "",
  pastorImage: content.pastorImage ?? "",
  heroImage: content.heroImage ?? "",
  status: content.status === "PUBLISHED" ? "PUBLISHED" : "DRAFT",
};

savedFormRef.current = loadedForm;
setForm(loadedForm);
setHasUnsavedChanges(false);
  } catch (err) {
    setError(
      err instanceof Error
        ? err.message
        : "Unable to load About page content.",
    );
  } finally {
    setLoading(false);
  }
}, []);
useEffect(() => {
void loadAbout();
}, [loadAbout]);

useEffect(() => {
  if (!hasUnsavedChanges) return;

  function handleBeforeUnload(event: BeforeUnloadEvent) {
    event.preventDefault();
    event.returnValue = "";
  }

  window.addEventListener("beforeunload", handleBeforeUnload);

  return () => {
    window.removeEventListener("beforeunload", handleBeforeUnload);
  };
}, [hasUnsavedChanges]);

function updateField<K extends keyof AboutForm>(
  name: K,
  value: AboutForm[K],
) {
  setForm((current) => {
    const updatedForm = {
      ...current,
      [name]: value,
    };

    const hasChanges =
      JSON.stringify(updatedForm) !==
      JSON.stringify(savedFormRef.current);

    setHasUnsavedChanges(hasChanges);

    return updatedForm;
  });

  setMessage("");
  setError("");
}

function addMilestone() {
  setForm((current) => {
    const updatedForm = {
      ...current,
      historyMilestones: [
        ...current.historyMilestones,
        { year: "", title: "", description: "" },
      ],
    };

    setHasUnsavedChanges(
      JSON.stringify(updatedForm) !==
        JSON.stringify(savedFormRef.current),
    );

    return updatedForm;
  });

  setMessage("");
  setError("");
}

function updateMilestone(
  index: number,
  field: keyof HistoryMilestone,
  value: string,
) {
  setForm((current) => {
    const updatedForm = {
      ...current,
      historyMilestones: current.historyMilestones.map((milestone, i) =>
        i === index ? { ...milestone, [field]: value } : milestone,
      ),
    };

    setHasUnsavedChanges(
      JSON.stringify(updatedForm) !==
        JSON.stringify(savedFormRef.current),
    );

    return updatedForm;
  });

  setMessage("");
  setError("");
}

function removeMilestone(index: number) {
  setForm((current) => {
    const updatedForm = {
      ...current,
      historyMilestones: current.historyMilestones.filter(
        (_, i) => i !== index,
      ),
    };

    setHasUnsavedChanges(
      JSON.stringify(updatedForm) !==
        JSON.stringify(savedFormRef.current),
    );

    return updatedForm;
  });

  setMessage("");
  setError("");
}


async function uploadImage(
  file: File,
  field: "heroImage" | "pastorImage",
) {
  setUploadingImage(field);
  setError("");
  setMessage("");

  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/admin/upload", {
      method: "POST",
      body: formData,
    });

    const result = await response.json();

    if (!response.ok || !result.success || !result.data?.url) {
      throw new Error(result.message || "Image upload failed.");
    }

    updateField(field, result.data.url);
    setMessage("Image uploaded successfully. Save your changes to keep the new image URL.");
  } catch (error) {
    setError(
      error instanceof Error ? error.message : "Image upload failed.",
    );
  } finally {
    setUploadingImage(null);
  }
}

async function saveAbout(status: "DRAFT" | "PUBLISHED") {
  setSaving(true);
  setError("");
  setMessage("");

  try {
    const formToSave: AboutForm = {
      ...form,
      historyMilestones: form.historyMilestones.map((milestone) => ({
        ...milestone,
      })),
      status,
    };

    const response = await fetch("/api/admin/about", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...(draftId ? { id: draftId } : {}),
        title: formToSave.title,
        introduction: formToSave.introduction,
        story: formToSave.story,
        mission: formToSave.mission,
        vision: formToSave.vision,
        beliefs: formToSave.beliefs,
        values: formToSave.values,
        pastorName: formToSave.pastorName,
        pastorTitle: formToSave.pastorTitle,
        pastorBiography: formToSave.pastorBiography,
        pastorImage: formToSave.pastorImage,
        heroImage: formToSave.heroImage,
        historyMilestones: formToSave.historyMilestones,
        status,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.message || "Unable to save About page.",
      );
    }

    const savedForm: AboutForm = {
      ...formToSave,
      status,
    };

    savedFormRef.current = savedForm;
    setForm(savedForm);
    setHasUnsavedChanges(false);

    if (status === "PUBLISHED") {
      setDraftId(null);
      setPublishedId(result.data?.id ?? publishedId);
      setShowDraftReminder(false);
      setEditing(false);
      setMessage(
        result.message || "About page published successfully.",
      );
    } else {
      setDraftId(result.data?.id ?? draftId);
      setShowDraftReminder(true);
      setEditing(true);
      setMessage(
        result.message || "Draft saved successfully.",
      );
    }
  } catch (err) {
    setError(
      err instanceof Error
        ? err.message
        : "Unable to save About page.",
    );
  } finally {
    setSaving(false);
  }
}

function editDraft() {
  setEditing(true);
  setShowDraftReminder(false);
  setMessage("You are editing the pending About page draft.");
  setError("");
}

async function deleteDraft() {
  if (!draftId) {
    setError("There is no pending draft to delete.");
    return;
  }

  const confirmed = window.confirm(
    "Delete this About page draft? The currently published About page will remain unchanged.",
  );

  if (!confirmed) return;

  setDeletingDraft(true);
  setError("");
  setMessage("");

  try {
    const response = await fetch("/api/admin/about", {
      method: "DELETE",
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.message || "Unable to delete the draft.",
      );
    }

    setDraftId(null);
    setShowDraftReminder(false);
    setForm(initialForm);
    setMessage(
      result.message || "Draft deleted successfully.",
    );

    await loadAbout();
  } catch (err) {
    setError(
      err instanceof Error
        ? err.message
        : "Unable to delete the draft.",
    );
  } finally {
    setDeletingDraft(false);
  }
}
if (loading) {
return ( <main className="flex min-h-screen items-center justify-center bg-[#f0f2f5] px-4 font-sans text-[#1c1e21]"> <div className="flex items-center gap-3 rounded-2xl border border-[#e4e6eb] bg-white px-6 py-5 shadow-sm"> <LoaderCircle className="animate-spin text-[#1877f2]" size={22} /> <span className="text-sm font-semibold">
Loading About page editor... </span> </div> </main>
);
}

return ( <main className="min-h-screen bg-[#f0f2f5] pb-12 font-sans text-[#1c1e21]"> <header className="sticky top-0 z-30 border-b border-[#e4e6eb] bg-white/95 backdrop-blur"> <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6"> <div className="flex min-w-0 items-center gap-3"> <Link
           href="/"
           aria-label="Return to website"
           className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f0f2f5] text-[#1c1e21] transition hover:bg-[#e4e6eb]"
         > <ArrowLeft size={19} /> </Link>

        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wider text-[#1877f2]">
            Administration
          </p>
          <h1 className="truncate text-lg font-extrabold tracking-tight sm:text-xl">
            About Page Editor
          </h1>
        </div>
      </div>

      <span
        className={`hidden rounded-full px-3 py-1.5 text-xs font-bold sm:inline-flex ${
          form.status === "PUBLISHED"
            ? "bg-[#e7f3ff] text-[#0866ff]"
            : "bg-[#f0f2f5] text-[#65676b]"
        }`}
      >
        {form.status === "PUBLISHED" ? "Published" : "Draft"}
      </span>
    </div>
  </header>
  {showDraftReminder && draftId && (
    <section
      role="alert"
      className="border-b border-amber-200 bg-amber-50"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-5 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-base font-extrabold text-amber-950">
            I am a draft waiting for you!
          </p>

          <p className="mt-1 text-sm text-amber-800">
            What would you like to do with me? Your draft is private
            until you publish it.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={editDraft}
            disabled={saving || deletingDraft}
            className="rounded-xl border border-amber-300 bg-white px-4 py-2 text-sm font-bold text-amber-950 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Edit Draft
          </button>

          <button
            type="button"
            onClick={() => setShowPublishConfirmation(true)}
            disabled={saving || deletingDraft}
            className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Publishing..." : "Publish Draft"}
          </button>

          <button
            type="button"
            onClick={() => void deleteDraft()}
            disabled={saving || deletingDraft}
            className="rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {deletingDraft ? "Deleting..." : "Delete Draft"}
          </button>
        </div>
      </div>
    </section>
  )}
  <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-9">
    <div className="mb-7">
      <Link
        href="/"
        className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-[#1877f2] hover:underline"
      >
        <ArrowLeft size={16} />
        Return to website
      </Link>

      <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
        Tell the ministry&apos;s story.
      </h2>

      <p className="mt-2 max-w-2xl text-sm leading-6 text-[#65676b] sm:text-base">
        Manage the official story, mission, vision, beliefs, values, and
        leadership information displayed on the public About page.
      </p>
      <div className="mt-5 flex flex-wrap items-center gap-3 rounded-2xl border border-[#e4e6eb] bg-white p-4 shadow-sm">
  <div className="min-w-0 flex-1">
    <p className="text-sm font-extrabold text-[#1c1e21]">
      {editing
        ? "Editing mode"
        : draftId
          ? "A draft is available"
          : publishedId
            ? "Published page — read-only"
            : "New About page"}
    </p>

<p className="mt-1 text-sm text-[#65676b]">
  {editing
    ? "Changes remain private until you save and publish them."
    : draftId
      ? "Open the pending draft when you are ready to work on it."
      : "The published page is protected. Enter editing mode to prepare changes."}
</p>

  </div>

{!editing ? (
<button
type="button"
onClick={() => {
setEditing(true);
setShowDraftReminder(false);
setHasUnsavedChanges(false);
setMessage(
draftId
? "You are now editing the pending About page draft."
: "Editing enabled. Your changes will remain private until published.",
);
setError("");
}}
disabled={saving || deletingDraft}
className="rounded-xl bg-[#1877f2] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#0866ff] disabled:cursor-not-allowed disabled:opacity-50"
>
{draftId ? "Go to Draft" : "Edit About Page"} </button>
) : (
<button
type="button"
onClick={() => {
if (
hasUnsavedChanges &&
!window.confirm("Discard your unsaved changes and leave editing mode?")
) {
return;
}
    setEditing(false);
    setHasUnsavedChanges(false);
    void loadAbout();
  }}
  disabled={saving || deletingDraft}
  className="rounded-xl border border-[#ccd0d5] bg-white px-5 py-3 text-sm font-bold text-[#1c1e21] transition hover:bg-[#f0f2f5] disabled:cursor-not-allowed disabled:opacity-50"
>
  Cancel Editing
</button>


)}

</div>

    </div>

    {error && (
      <div
        role="alert"
        className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700"
      >
        {error}
      </div>
    )}

    {message && (
      <div
        role="status"
        className="mb-5 flex items-start gap-3 rounded-xl border border-[#b7dfc5] bg-[#eaf7ee] p-4 text-sm font-semibold text-[#216e39]"
      >
        <CheckCircle2 className="mt-0.5 shrink-0" size={19} />
        {message}
      </div>
    )}

    <form
      onSubmit={(event) => {
        event.preventDefault();
        void saveAbout("DRAFT");
      }}
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-[#e4e6eb] bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-6 flex items-center gap-3 border-b border-[#e4e6eb] pb-5">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e7f3ff] text-[#1877f2]">
                <BookOpen size={22} />
              </span>

              <div>
                <h3 className="text-lg font-extrabold tracking-tight">
                  Ministry information
                </h3>
                <p className="mt-1 text-sm text-[#65676b]">
                  The story visitors come to discover.
                </p>
              </div>
            </div>

            <label className="mb-6 block">
              <span className="mb-2 block text-sm font-bold">
                Page title
              </span>
              <input
              disabled={!editing}
                value={form.title}
                onChange={(event) =>
                  updateField("title", event.target.value)
                }
                maxLength={200}
                required
                className="w-full rounded-xl border border-[#ccd0d5] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#1877f2] focus:ring-2 focus:ring-[#e7f3ff]"
              />
            </label>

            {fields.map((field) => (
              <label key={field.name} className="mb-6 block last:mb-0">
                <span className="mb-1 block text-sm font-bold">
                  {field.label}
                </span>

                <span className="mb-3 block text-xs leading-5 text-[#65676b]">
                  {field.description}
                </span>

                {field.multiline ? (
                  <textarea
                   disabled={!editing}
                    value={form[field.name] as string}
                    onChange={(event) =>
                      updateField(field.name, event.target.value)
                    }
                    rows={field.name === "story" ? 9 : 5}
                    maxLength={50000}
                    placeholder={`Write ${field.label.toLowerCase()} here...`}
                    className="w-full resize-y rounded-xl border border-[#ccd0d5] bg-white px-4 py-3 text-sm leading-7 outline-none transition placeholder:text-[#8a8d91] focus:border-[#1877f2] focus:ring-2 focus:ring-[#e7f3ff]"
                  />
                ) : null}
              </label>
            ))}
          </section>

          <section className="rounded-2xl border border-[#e4e6eb] bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-6 flex items-center gap-3 border-b border-[#e4e6eb] pb-5">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e7f3ff] text-[#1877f2]">
                <UserRound size={22} />
              </span>

              <div>
                <h3 className="text-lg font-extrabold tracking-tight">
          <section className="rounded-2xl border border-[#e4e6eb] bg-white p-5 sm:p-6">
            <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-[#1c1e21]">
                  History milestones
                </h2>
                <p className="mt-1 text-sm leading-5 text-[#65676b]">
                  Add important years and events in the ministry&apos;s history.
                  These entries can appear on the public About page.
                </p>
              </div>

              <button
              disabled={!editing}
                type="button"
                onClick={addMilestone}
                className="rounded-xl bg-[#e7f3ff] px-4 py-2.5 text-sm font-bold text-[#1877f2] transition hover:bg-[#dbeafe]"
              >
                + Add milestone
              </button>
            </div>

            {form.historyMilestones.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#ccd0d5] px-4 py-8 text-center">
                <p className="text-sm font-semibold text-[#65676b]">
                  No history milestones added yet.
                </p>
                <p className="mt-1 text-xs text-[#65676b]">
                  Add a milestone when you are ready to document the ministry&apos;s history.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {form.historyMilestones.map((milestone, index) => (
                  <div
                    key={index}
                    className="rounded-xl border border-[#e4e6eb] p-4 sm:p-5"
                  >
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <h3 className="text-sm font-bold text-[#1c1e21]">
                        Milestone {index + 1}
                      </h3>

                      <button
                       disabled={!editing}
                        type="button"
                        onClick={() => removeMilestone(index)}
                        className="rounded-lg px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                      >
                        Remove
                      </button>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-[140px_minmax(0,1fr)]">
                      <label className="block">
                        <span className="mb-2 block text-sm font-bold">
                          Year
                        </span>
                        <input
                          value={milestone.year}
                          onChange={(event) =>
                            updateMilestone(index, "year", event.target.value)
                          }
                          maxLength={30}
                          placeholder="e.g. 2013"
                          className="w-full rounded-xl border border-[#ccd0d5] bg-white px-3 py-3 text-sm outline-none transition focus:border-[#1877f2] focus:ring-2 focus:ring-[#e7f3ff]"
                        />
                      </label>

                      <label className="block">
                        <span className="mb-2 block text-sm font-bold">
                          Event title
                        </span>
                        <input
                        disabled={!editing}
                          value={milestone.title}
                          onChange={(event) =>
                            updateMilestone(index, "title", event.target.value)
                          }
                          maxLength={200}
                          placeholder="e.g. Ministry established"
                          className="w-full rounded-xl border border-[#ccd0d5] bg-white px-3 py-3 text-sm outline-none transition focus:border-[#1877f2] focus:ring-2 focus:ring-[#e7f3ff]"
                        />
                      </label>
                    </div>

                    <label className="mt-4 block">
                      <span className="mb-2 block text-sm font-bold">
                        Description
                      </span>
                      <textarea
                      disabled={!editing}
                        value={milestone.description}
                        onChange={(event) =>
                          updateMilestone(index, "description", event.target.value)
                        }
                        maxLength={2000}
                        rows={3}
                        placeholder="Describe what happened during this period..."
                        className="w-full resize-y rounded-xl border border-[#ccd0d5] bg-white px-3 py-3 text-sm leading-6 outline-none transition focus:border-[#1877f2] focus:ring-2 focus:ring-[#e7f3ff]"
                      />
                    </label>
                  </div>
                ))}
              </div>
            )}
          </section>
                  Leadership
                </h3>
                <p className="mt-1 text-sm text-[#65676b]">
                  The pastor&apos;s profile and biography.
                </p>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-bold">
                  Pastor&apos;s name
                </span>
                <input
                disabled={!editing}
                  value={form.pastorName}
                  onChange={(event) =>
                    updateField("pastorName", event.target.value)
                  }
                  maxLength={200}
                  className="w-full rounded-xl border border-[#ccd0d5] px-4 py-3 text-sm outline-none focus:border-[#1877f2] focus:ring-2 focus:ring-[#e7f3ff]"
                  placeholder="Enter full name"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-bold">
                  Leadership title
                </span>
                <input
                  value={form.pastorTitle}
                  disabled={!editing}
                  onChange={(event) =>
                    updateField("pastorTitle", event.target.value)
                  }
                  maxLength={200}
                  className="w-full rounded-xl border border-[#ccd0d5] px-4 py-3 text-sm outline-none focus:border-[#1877f2] focus:ring-2 focus:ring-[#e7f3ff]"
                  placeholder="e.g. Senior Pastor"
                />
              </label>
            </div>

            <label className="mt-5 block">
              <span className="mb-2 block text-sm font-bold">
                Pastor&apos;s biography
              </span>
              <textarea
              disabled={!editing}
                value={form.pastorBiography}
                onChange={(event) =>
                  updateField("pastorBiography", event.target.value)
                }
                rows={6}
                maxLength={50000}
                className="w-full rounded-xl border border-[#ccd0d5] px-4 py-3 text-sm leading-7 outline-none focus:border-[#1877f2] focus:ring-2 focus:ring-[#e7f3ff]"
                placeholder="The pastor can narrate his journey, calling, and ministry..."
              />
            </label>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-2xl border border-[#e4e6eb] bg-white p-5 shadow-sm">
            <h3 className="text-base font-extrabold tracking-tight">
              Publish settings
            </h3>

            <p className="mt-2 text-sm leading-6 text-[#65676b]">
              Save your work privately or publish it on the public website.
            </p>

            <div className="mt-5 space-y-3">
              <button
                type="submit"
                disabled={!editing || saving || uploadingImage !== null}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#ccd0d5] bg-white px-4 py-3 text-sm font-bold transition hover:bg-[#f0f2f5] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <LoaderCircle className="animate-spin" size={18} />
                ) : (
                  <Save size={18} />
                )}
                Save draft
              </button>

              <button
                type="button"
                disabled={!editing || saving || uploadingImage !== null}
                onClick={() => setShowPublishConfirmation(true)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1877f2] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#0866ff] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <LoaderCircle className="animate-spin" size={18} />
                ) : (
                  <Globe size={18} />
                )}
                Publish About page
              </button>
            </div>
   <button
  type="button"
  onClick={() => setShowPreview(true)}
  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#e7f3ff] px-4 py-3 text-sm font-bold text-[#0866ff] transition hover:bg-[#d8eaff]"
>
  <Eye size={18} />
  Preview current content
</button>

<Link
  href="/about"
  target="_blank"
  className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-[#e4e6eb] bg-white px-4 py-3 text-sm font-bold text-[#4b5563] transition hover:bg-[#f0f2f5]"
>
  <Globe size={18} />
  View published page
</Link>
          </section>

          <section className="rounded-2xl border border-[#e4e6eb] bg-white p-5 shadow-sm">
            <h3 className="text-base font-extrabold tracking-tight">
              Page imagery
            </h3>

            <p className="mt-2 text-sm leading-6 text-[#65676b]">
              Upload images directly to Cloudinary or enter an image URL.
              Supported formats: JPEG, PNG, WebP and GIF. Maximum size: 5 MB.
            </p>

            <div className="mt-5">
              <label className="block">
                <span className="mb-2 block text-sm font-bold">
                  Hero image
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  disabled={!editing || uploadingImage !== null}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    event.target.value = "";
                    if (file) void uploadImage(file, "heroImage");
                  }}
                  className="block w-full cursor-pointer rounded-xl border border-[#ccd0d5] p-3 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-[#e7f3ff] file:px-3 file:py-2 file:font-bold file:text-[#0866ff] disabled:opacity-60"
                />
              </label>

              {uploadingImage === "heroImage" && (
                <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-[#1877f2]">
                  <LoaderCircle size={16} className="animate-spin" />
                  Uploading hero image...
                </p>
              )}

              <label className="mt-4 block">
                <span className="mb-2 block text-sm font-bold">
                  Hero image URL
                </span>
                <input
                disabled={!editing}
                  type="url"
                  value={form.heroImage}
                  onChange={(event) =>
                    updateField("heroImage", event.target.value)
                  }
                  maxLength={2000}
                  placeholder="https://..."
                  className="w-full rounded-xl border border-[#ccd0d5] px-3 py-3 text-sm outline-none focus:border-[#1877f2] focus:ring-2 focus:ring-[#e7f3ff]"
                />
              </label>

              {form.heroImage && (
                <div className="mt-3">
                  <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[#65676b]">
                    Hero image preview
                  </p>
                  <img
                    src={form.heroImage}
                    alt="About page hero preview"
                    className="max-h-52 w-full rounded-xl border border-[#e4e6eb] object-cover"
                  />
                </div>
              )}
            </div>

            <div className="mt-7 border-t border-[#e4e6eb] pt-5">
              <label className="block">
                <span className="mb-2 block text-sm font-bold">
                  Pastor&apos;s image
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  disabled={uploadingImage !== null}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    event.target.value = "";
                    if (file) void uploadImage(file, "pastorImage");
                  }}
                  className="block w-full cursor-pointer rounded-xl border border-[#ccd0d5] p-3 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-[#e7f3ff] file:px-3 file:py-2 file:font-bold file:text-[#0866ff] disabled:opacity-60"
                />
              </label>

              {uploadingImage === "pastorImage" && (
                <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-[#1877f2]">
                  <LoaderCircle size={16} className="animate-spin" />
                  Uploading pastor&apos;s image...
                </p>
              )}

              <label className="mt-4 block">
                <span className="mb-2 block text-sm font-bold">
                  Pastor&apos;s image URL
                </span>
                <input
                  type="url"
                  value={form.pastorImage}
                  onChange={(event) =>
                    updateField("pastorImage", event.target.value)
                  }
                  maxLength={2000}
                  placeholder="https://..."
                  className="w-full rounded-xl border border-[#ccd0d5] px-3 py-3 text-sm outline-none focus:border-[#1877f2] focus:ring-2 focus:ring-[#e7f3ff]"
                />
              </label>

              {form.pastorImage && (
                <div className="mt-3">
                  <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[#65676b]">
                    Pastor image preview
                  </p>
                  <img
                    src={form.pastorImage}
                    alt="Pastor image preview"
                    className="max-h-64 w-full rounded-xl border border-[#e4e6eb] object-cover object-top"
                  />
                </div>
              )}
            </div>

            <p className="mt-5 rounded-xl bg-[#f0f2f5] p-3 text-xs leading-5 text-[#65676b]">
              After uploading, click Save draft or Publish About page to save
              the image URL to the ministry website.
            </p>
          </section>
          <section className="rounded-2xl border border-[#dbeafe] bg-[#e7f3ff] p-5">
            <h3 className="text-sm font-extrabold text-[#1c1e21]">
              Content ownership
            </h3>
            <p className="mt-2 text-sm leading-6 text-[#4b5563]">
              The ministry&apos;s official story should be reviewed and
              approved by its leadership before publication.
            </p>
          </section>
        </aside>
  </div>
</form>

  </div>

{showPreview && (
<div
className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/70 p-3 py-6 sm:p-8"
onClick={() => setShowPreview(false)}
>
<div
role="dialog"
aria-modal="true"
aria-labelledby="about-preview-title"
className="relative my-auto w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl"
onClick={(event) => event.stopPropagation()}
> <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-[#e4e6eb] bg-white px-5 py-4"> <div> <h2
           id="about-preview-title"
           className="text-lg font-extrabold text-[#1c1e21]"
         >
About Page Preview </h2> <p className="mt-1 text-xs text-[#65676b]">
Private preview. These changes are not published. </p> </div>
      <button
        type="button"
        onClick={() => setShowPreview(false)}
        className="shrink-0 rounded-xl bg-[#f0f2f5] px-4 py-2 text-sm font-bold text-[#1c1e21] hover:bg-[#e4e6eb]"
      >
        Close Preview
      </button>
    </div>

    <div className="max-h-[80vh] overflow-y-auto">
      {form.heroImage && (
        <div className="relative">
          <img
            src={form.heroImage}
            alt="Ministry hero"
            className="h-56 w-full object-cover sm:h-80"
          />
        </div>
      )}

      <article className="mx-auto max-w-4xl space-y-10 px-5 py-8 sm:px-10 sm:py-12">
        <header className="text-center">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#1877f2]">
            The Word Ministries International
          </p>
          <h1 className="mt-4 text-3xl font-extrabold leading-tight text-[#1c1e21] sm:text-5xl">
            {form.title || "About The Word Ministries International"}
          </h1>
          {form.introduction && (
            <p className="mx-auto mt-5 max-w-3xl whitespace-pre-wrap text-base leading-8 text-[#65676b] sm:text-lg">
              {form.introduction}
            </p>
          )}
        </header>

        {form.story && (
          <section>
            <h2 className="text-2xl font-extrabold text-[#1c1e21]">
              Our Story
            </h2>
            <p className="mt-4 whitespace-pre-wrap text-base leading-8 text-[#4b5563]">
              {form.story}
            </p>
          </section>
        )}

        <div className="grid gap-6 sm:grid-cols-2">
          {[
            { title: "Our Mission", content: form.mission },
            { title: "Our Vision", content: form.vision },
            { title: "Our Beliefs", content: form.beliefs },
            { title: "Our Values", content: form.values },
          ]
            .filter((section) => section.content.trim())
            .map((section) => (
              <section
                key={section.title}
                className="rounded-2xl border border-[#e4e6eb] p-6"
              >
                <h2 className="text-xl font-extrabold text-[#1c1e21]">
                  {section.title}
                </h2>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[#4b5563]">
                  {section.content}
                </p>
              </section>
            ))}
        </div>

        {form.historyMilestones.some(
          (milestone) =>
            milestone.year.trim() ||
            milestone.title.trim() ||
            milestone.description.trim(),
        ) && (
          <section>
            <h2 className="text-2xl font-extrabold text-[#1c1e21]">
              Our History
            </h2>

            <div className="mt-6 space-y-5">
              {form.historyMilestones
                .filter(
                  (milestone) =>
                    milestone.year.trim() ||
                    milestone.title.trim() ||
                    milestone.description.trim(),
                )
                .map((milestone, index) => (
                  <div
                    key={`${milestone.year}-${milestone.title}-${index}`}
                    className="border-l-4 border-[#1877f2] pl-5"
                  >
                    {milestone.year && (
                      <p className="text-sm font-bold text-[#1877f2]">
                        {milestone.year}
                      </p>
                    )}
                    {milestone.title && (
                      <h3 className="mt-1 text-lg font-bold text-[#1c1e21]">
                        {milestone.title}
                      </h3>
                    )}
                    {milestone.description && (
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-[#4b5563]">
                        {milestone.description}
                      </p>
                    )}
                  </div>
                ))}
            </div>
          </section>
        )}

        {(form.pastorName ||
          form.pastorTitle ||
          form.pastorBiography ||
          form.pastorImage) && (
          <section className="border-t border-[#e4e6eb] pt-8">
            <h2 className="text-2xl font-extrabold text-[#1c1e21]">
              Our Leadership
            </h2>

            <div className="mt-5 grid gap-6 sm:grid-cols-[220px_1fr]">
              {form.pastorImage && (
                <img
                  src={form.pastorImage}
                  alt={form.pastorName || "Pastor"}
                  className="max-h-80 w-full rounded-2xl object-cover object-top"
                />
              )}

              <div>
                {form.pastorName && (
                  <h3 className="text-xl font-extrabold text-[#1c1e21]">
                    {form.pastorName}
                  </h3>
                )}
                {form.pastorTitle && (
                  <p className="mt-1 font-semibold text-[#1877f2]">
                    {form.pastorTitle}
                  </p>
                )}
                {form.pastorBiography && (
                  <p className="mt-4 whitespace-pre-wrap text-sm leading-8 text-[#4b5563]">
                    {form.pastorBiography}
                  </p>
                )}
              </div>
            </div>
          </section>
        )}

        <footer className="border-t border-[#e4e6eb] pt-6 text-center text-sm text-[#65676b]">
          End of About Page Preview
        </footer>
      </article>
    </div>
  </div>
</div>


)}


{showPublishConfirmation && (
  <div
    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
    onMouseDown={(event) => {
      if (event.target === event.currentTarget) {
        setShowPublishConfirmation(false);
      }
    }}
  >
    <section
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="publish-confirmation-title"
      aria-describedby="publish-confirmation-description"
      className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-700">
        <Globe size={24} />
      </div>

      <h2
        id="publish-confirmation-title"
        className="mt-4 text-xl font-extrabold text-[#1c1e21]"
      >
        Publish About page?
      </h2>

      <p
        id="publish-confirmation-description"
        className="mt-3 text-sm leading-6 text-[#65676b]"
      >
        You are about to publish the content currently shown in the editor.
        Any unsaved changes will be included. If publication succeeds, this
        content will replace the existing published About page.
      </p>

      <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm leading-5 text-amber-900">
        Please preview your content and check your changes before publishing.
        Canceling will leave the published page unchanged.
      </div>

      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={() => setShowPublishConfirmation(false)}
          disabled={saving}
          className="rounded-xl border border-[#e4e6eb] px-5 py-3 text-sm font-bold text-[#4b5563] transition hover:bg-[#f0f2f5] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={() => {
            setShowPublishConfirmation(false);
            void saveAbout("PUBLISHED");
          }}
          disabled={saving || deletingDraft || uploadingImage !== null}
          className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Globe size={17} />
          {saving ? "Publishing..." : "Publish Now"}
        </button>
      </div>
    </section>
  </div>
)}
</main>

);
}










