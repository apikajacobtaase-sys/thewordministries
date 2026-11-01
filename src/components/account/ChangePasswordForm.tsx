"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  LockKeyhole,
  Save,
  ShieldCheck,
} from "lucide-react";

export default function ChangePasswordForm() {
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (saving) return;

    setError("");
    setMessage("");

    if (newPassword.length < 12 || newPassword.length > 128) {
      setError("Your new password must be between 12 and 128 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Your new passwords do not match.");
      return;
    }

    if (currentPassword === newPassword) {
      setError("Your new password must be different from your current password.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/account/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to change your password.");
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setMessage("Your password has been changed successfully. Please sign in again.");

      router.replace("/login?passwordChanged=1");
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
    "mt-2 min-h-12 w-full rounded-xl border border-[#e4e6eb] bg-white px-4 pr-12 text-sm text-[#1c1e21] outline-none transition placeholder:text-[#8a8d91] focus:border-[#1877f2] focus:ring-2 focus:ring-[#1877f2]/10";

  function renderPasswordField(
    id: string,
    label: string,
    value: string,
    setValue: (value: string) => void,
    visible: boolean,
    toggleVisibility: () => void,
    autoComplete: string,
    icon: React.ReactNode,
  ) {
    return (
      <div>
        <label
          htmlFor={id}
          className="flex items-center gap-2 text-sm font-bold text-[#1c1e21]"
        >
          {icon}
          {label}
        </label>

        <div className="relative">
          <input
            id={id}
            type={visible ? "text" : "password"}
            autoComplete={autoComplete}
            required
            maxLength={128}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            className={inputClass}
            placeholder={`Enter ${label.toLowerCase()}`}
          />

          <button
            type="button"
            onClick={toggleVisibility}
            aria-label={visible ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-[#65676b] transition hover:bg-[#f0f2f5]"
          >
            {visible ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {renderPasswordField(
        "current-password",
        "Current password",
        currentPassword,
        setCurrentPassword,
        showCurrent,
        () => setShowCurrent((value) => !value),
        "current-password",
        <LockKeyhole size={17} className="text-[#1877f2]" />,
      )}

      {renderPasswordField(
        "new-password",
        "New password",
        newPassword,
        setNewPassword,
        showNew,
        () => setShowNew((value) => !value),
        "new-password",
        <KeyRound size={17} className="text-[#1877f2]" />,
      )}

      <p className="-mt-2 text-xs leading-5 text-[#65676b]">
        Use a password between 12 and 128 characters.
      </p>

      {renderPasswordField(
        "confirm-password",
        "Confirm new password",
        confirmPassword,
        setConfirmPassword,
        showConfirm,
        () => setShowConfirm((value) => !value),
        "new-password",
        <ShieldCheck size={17} className="text-[#1877f2]" />,
      )}

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
            Updating password...
          </>
        ) : (
          <>
            <Save size={18} />
            Change Password
          </>
        )}
      </button>
    </form>
  );
}

