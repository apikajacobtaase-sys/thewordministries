"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, Mail, UserRound, Phone } from "lucide-react";

type ProfileFormProps = {
  name: string;
  email: string;
  phone: string;
};

export default function ProfileForm({
  name: initialName,
  email,
  phone: initialPhone,
}: ProfileFormProps) {
  const router = useRouter();

  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (saving) return;

    setMessage("");
    setError("");

    if (name.trim().length < 2 || name.trim().length > 80) {
      setError("Name must be between 2 and 80 characters.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to update your profile.");
      }

      setName(result.user.name);
      setPhone(result.user.phone || "");
      setMessage("Your profile has been updated successfully.");

      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "mt-2 min-h-12 w-full rounded-xl border border-[#e4e6eb] bg-white px-4 text-sm text-[#1c1e21] outline-none transition placeholder:text-[#8a8d91] focus:border-[#1877f2] focus:ring-2 focus:ring-[#1877f2]/10";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label
          htmlFor="profile-name"
          className="flex items-center gap-2 text-sm font-bold text-[#1c1e21]"
        >
          <UserRound size={17} className="text-[#1877f2]" />
          Full name
        </label>

        <input
          id="profile-name"
          type="text"
          autoComplete="name"
          maxLength={80}
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
          className={inputClass}
          placeholder="Enter your full name"
        />
      </div>

      <div>
        <label
          htmlFor="profile-email"
          className="flex items-center gap-2 text-sm font-bold text-[#1c1e21]"
        >
          <Mail size={17} className="text-[#1877f2]" />
          Email address
        </label>

        <input
          id="profile-email"
          type="email"
          value={email}
          readOnly
          aria-describedby="email-note"
          className={`${inputClass} cursor-not-allowed bg-[#f0f2f5] text-[#65676b]`}
        />

        <p id="email-note" className="mt-2 text-xs text-[#65676b]">
          Your email address cannot be changed here.
        </p>
      </div>

      <div>
        <label
          htmlFor="profile-phone"
          className="flex items-center gap-2 text-sm font-bold text-[#1c1e21]"
        >
          <Phone size={17} className="text-[#1877f2]" />
          Phone number
        </label>

        <input
          id="profile-phone"
          type="tel"
          autoComplete="tel"
          maxLength={20}
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          className={inputClass}
          placeholder="e.g. 0241234567"
        />

        <p className="mt-2 text-xs text-[#65676b]">
          Use a Ghanaian number. You can leave this field empty.
        </p>
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600"
        >
          {error}
        </p>
      )}

      {message && (
        <p
          role="status"
          className="rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-700"
        >
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#1877f2] px-5 text-sm font-bold text-white transition hover:bg-[#0866ff] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {saving ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            Saving changes...
          </>
        ) : (
          <>
            <Save size={18} />
            Save Changes
          </>
        )}
      </button>
    </form>
  );
}
