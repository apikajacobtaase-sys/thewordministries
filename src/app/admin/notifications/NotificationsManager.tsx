"use client";

import { useState } from "react";
import { Bell, Send, Users, CheckCircle2, XCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";

type BroadcastResult = {
  notificationId: string;
  subscriptions: number;
  sent: number;
  failed: number;
  removed: number;
};

export default function NotificationsManager() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [url, setUrl] = useState("/");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BroadcastResult | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!title.trim() || !message.trim()) {
      toast.error("Enter a notification title and message.");
      return;
    }

    if (!window.confirm(
      "Send this notification to all subscribed church devices? This action cannot be undone."
    )) return;

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          message: message.trim(),
          url: url.trim() || "/",
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to send notification.");
      }

      setResult(data.data);
      setTitle("");
      setMessage("");
      setUrl("/");
      toast.success("Church notification broadcast successfully.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f0f2f5] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-7">
          <div className="flex items-center gap-2 text-[#1877f2]">
            <Bell size={19} />
            <span className="text-xs font-extrabold uppercase tracking-widest">
              Communication Centre
            </span>
          </div>

          <h1 className="mt-3 text-3xl font-extrabold text-[#1c1e21]">
            Church Notifications
          </h1>

          <p className="mt-2 text-sm leading-6 text-[#65676b]">
            Send important announcements and updates directly to members
            who have enabled notifications on their devices.
          </p>
        </div>

        <section className="rounded-2xl border border-[#e4e6eb] bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e7f3ff] text-[#1877f2]">
              <Send size={21} />
            </div>
            <div>
              <h2 className="font-extrabold text-[#1c1e21]">
                Compose announcement
              </h2>
              <p className="text-xs text-[#65676b]">
                Your message will be sent to all active push subscriptions.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <div className="mb-2 flex justify-between">
                <label htmlFor="title" className="text-sm font-bold text-[#1c1e21]">
                  Notification title
                </label>
                <span className="text-xs text-[#8a8d91]">{title.length}/120</span>
              </div>
              <input
                id="title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                maxLength={120}
                required
                placeholder="e.g. Sunday Worship Service"
                className="w-full rounded-xl border border-[#dddfe2] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#1877f2] focus:ring-2 focus:ring-[#1877f2]/10"
              />
            </div>

            <div>
              <div className="mb-2 flex justify-between">
                <label htmlFor="message" className="text-sm font-bold text-[#1c1e21]">
                  Message
                </label>
                <span className="text-xs text-[#8a8d91]">{message.length}/1000</span>
              </div>
              <textarea
                id="message"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                maxLength={1000}
                required
                rows={5}
                placeholder="Write your announcement here..."
                className="w-full resize-y rounded-xl border border-[#dddfe2] bg-white px-4 py-3 text-sm leading-6 outline-none transition focus:border-[#1877f2] focus:ring-2 focus:ring-[#1877f2]/10"
              />
            </div>

            <div>
              <label htmlFor="url" className="mb-2 block text-sm font-bold text-[#1c1e21]">
                Destination path
              </label>
              <input
                id="url"
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                placeholder="/programs"
                className="w-full rounded-xl border border-[#dddfe2] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#1877f2] focus:ring-2 focus:ring-[#1877f2]/10"
              />
              <p className="mt-2 text-xs text-[#8a8d91]">
                Where users go when they tap the notification. Use an internal path, such as /programs or /sermons.
              </p>
            </div>

            <div className="rounded-xl bg-[#f0f2f5] p-4">
              <div className="flex items-start gap-3">
                <Bell size={18} className="mt-0.5 shrink-0 text-[#1877f2]" />
                <p className="text-xs leading-5 text-[#65676b]">
                  Only users who have granted browser notification permission
                  and subscribed on their devices can receive push notifications.
                  In-app announcements are also saved for signed-in users.
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#1877f2] px-5 py-3 text-sm font-extrabold text-white transition hover:bg-[#166fe5] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Send size={17} />
              {loading ? "Sending notification..." : "Broadcast to all subscribed devices"}
            </button>
          </form>
        </section>

        {result && (
          <section className="mt-6 rounded-2xl border border-[#e4e6eb] bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-5">
              <div className="flex items-center gap-2 text-[#1877f2]">
                <CheckCircle2 size={20} />
                <h2 className="font-extrabold text-[#1c1e21]">
                  Broadcast report
                </h2>
              </div>
              <p className="mt-1 break-all text-xs text-[#8a8d91]">
                Notification ID: {result.notificationId}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: "Subscriptions", value: result.subscriptions, icon: Users, color: "text-[#1877f2]", bg: "bg-[#e7f3ff]" },
                { label: "Sent", value: result.sent, icon: CheckCircle2, color: "text-[#2e7d32]", bg: "bg-[#e8f5e9]" },
                { label: "Failed", value: result.failed, icon: XCircle, color: "text-[#d93036]", bg: "bg-[#ffecec]" },
                { label: "Removed", value: result.removed, icon: Trash2, color: "text-[#65676b]", bg: "bg-[#f0f2f5]" },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="rounded-xl border border-[#e4e6eb] p-4">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${item.bg} ${item.color}`}>
                      <Icon size={18} />
                    </div>
                    <p className="mt-3 text-2xl font-extrabold text-[#1c1e21]">
                      {item.value.toLocaleString()}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-[#65676b]">
                      {item.label}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
