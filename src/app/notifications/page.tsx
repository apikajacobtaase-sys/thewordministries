"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Bell,
  BellRing,
  Check,
  CheckCheck,
  ChevronRight,
  LoaderCircle,
  MessageSquare,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  url: string | null;
  createdAt: string;
  isRead: boolean;
  readAt: string | null;
};

function decodeVapidKey(value: string): Uint8Array {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const raw = window.atob(base64);

  return Uint8Array.from(raw, (character) => character.charCodeAt(0));
}

export default function NotificationsPage() {
  const { data: session, status } = useSession();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");

  const loadNotifications = useCallback(async () => {
    if (!session?.user) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/notifications", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Unable to load notifications.");
      }

      const result = await response.json();

      setNotifications(result.data ?? []);
      setUnreadCount(result.unreadCount ?? 0);
    } catch {
      toast.error("Could not load your notifications.");
    } finally {
      setLoading(false);
    }
  }, [session?.user]);

  useEffect(() => {
    if (status !== "loading") {
      void loadNotifications();
    }
  }, [status, loadNotifications]);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("Notification" in window) ||
      !("serviceWorker" in navigator) ||
      !("PushManager" in window)
    ) {
      setPermission("unsupported");
      return;
    }

    setPermission(Notification.permission);

    navigator.serviceWorker
      .getRegistration("/")
      .then(async (registration) => {
        if (!registration) return;

        const subscription =
          await registration.pushManager.getSubscription();

        setPushEnabled(Boolean(subscription));
      })
      .catch(() => {
        setPushEnabled(false);
      });
  }, []);

  async function enablePushNotifications() {
    if (
      !("Notification" in window) ||
      !("serviceWorker" in navigator) ||
      !("PushManager" in window)
    ) {
      toast.error("Push notifications are not supported by this browser.");
      return;
    }

    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

    if (!publicKey) {
      toast.error("Notification service is not configured.");
      return;
    }

    setPushLoading(true);

    try {
      const permissionResult = await Notification.requestPermission();

      setPermission(permissionResult);

      if (permissionResult !== "granted") {
        toast.error(
          permissionResult === "denied"
            ? "Notification permission was denied. Change it in your browser settings."
            : "Notification permission was not granted.",
        );
        return;
      }

      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
      });

      await navigator.serviceWorker.ready;

      let subscription =
        await registration.pushManager.getSubscription();

      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: decodeVapidKey(publicKey) as BufferSource,
        });
      }

      const response = await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(subscription.toJSON()),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Could not save your notification subscription.",
        );
      }

      setPushEnabled(true);
      toast.success("Push notifications enabled successfully.");
    } catch (error) {
      console.error("Push notification activation failed:", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Could not enable push notifications.",
      );
    } finally {
      setPushLoading(false);
    }
  }

  async function markAsRead(notificationId: string) {
    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notificationId }),
      });

      if (!response.ok) {
        throw new Error("Unable to update notification.");
      }

      setNotifications((current) =>
        current.map((item) =>
          item.id === notificationId
            ? { ...item, isRead: true, readAt: new Date().toISOString() }
            : item,
        ),
      );

      setUnreadCount((current) => Math.max(0, current - 1));
    } catch {
      toast.error("Could not mark notification as read.");
    }
  }

  async function markAllAsRead() {
    if (unreadCount === 0) return;

    setMarkingAll(true);

    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ markAll: true }),
      });

      if (!response.ok) {
        throw new Error("Unable to update notifications.");
      }

      setNotifications((current) =>
        current.map((item) => ({
          ...item,
          isRead: true,
          readAt: item.readAt ?? new Date().toISOString(),
        })),
      );

      setUnreadCount(0);
      toast.success("All notifications marked as read.");
    } catch {
      toast.error("Could not update notifications.");
    } finally {
      setMarkingAll(false);
    }
  }

  function formatDate(value: string) {
    return new Intl.DateTimeFormat("en", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  }

  if (status === "loading") {
    return (
      <main className="min-h-screen bg-[#f0f2f5] px-5 py-16">
        <div className="mx-auto flex max-w-[480px] justify-center">
          <LoaderCircle className="animate-spin text-[#1877f2]" size={28} />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f0f2f5] px-4 pb-32 pt-6">
      <div className="mx-auto max-w-[480px] space-y-5">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#1877f2]">
              Stay connected
            </p>
            <h1 className="mt-1 text-2xl font-extrabold text-[#1c1e21]">
              Notifications
            </h1>
            <p className="mt-1 text-sm text-[#65676b]">
              Ministry updates, announcements and reminders.
            </p>
          </div>

          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e7f3ff] text-[#1877f2]">
            <BellRing size={23} />
          </div>
        </header>

        <section className="rounded-3xl border border-[#e4e6eb] bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#e7f3ff] text-[#1877f2]">
              <ShieldCheck size={22} />
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="font-bold text-[#1c1e21]">
                Church push notifications
              </h2>
              <p className="mt-1 text-xs leading-5 text-[#65676b]">
                Receive important ministry announcements and updates on this
                device, even when the website is closed.
              </p>
            </div>
          </div>

          <div className="mt-4">
            {permission === "unsupported" ? (
              <p className="rounded-xl bg-[#f0f2f5] p-3 text-xs text-[#65676b]">
                Push notifications are not supported by this browser.
              </p>
            ) : pushEnabled ? (
              <div className="flex items-center gap-2 rounded-xl bg-[#e7f3ff] p-3 text-sm font-semibold text-[#1877f2]">
                <Check size={18} />
                Notifications are enabled on this device.
              </div>
            ) : permission === "denied" ? (
              <p className="rounded-xl bg-[#fff4e5] p-3 text-xs leading-5 text-[#8a5700]">
                Notifications are blocked by your browser. Allow them in your
                browser site settings to enable this feature.
              </p>
            ) : (
              <button
                type="button"
                onClick={enablePushNotifications}
                disabled={pushLoading}
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#1877f2] px-4 text-sm font-bold text-white transition hover:bg-[#166fe5] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {pushLoading ? (
                  <LoaderCircle size={18} className="animate-spin" />
                ) : (
                  <Bell size={18} />
                )}
                {pushLoading ? "Enabling..." : "Enable notifications"}
              </button>
            )}
          </div>

          <p className="mt-3 text-[10px] leading-4 text-[#8a8d91]">
            You can change notification permissions at any time in your
            browser settings.
          </p>
        </section>

        <section className="overflow-hidden rounded-3xl border border-[#e4e6eb] bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-[#f0f2f5] px-5 py-4">
            <div>
              <h2 className="font-extrabold text-[#1c1e21]">
                Recent updates
              </h2>
              <p className="mt-1 text-xs text-[#65676b]">
                {session?.user
                  ? `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`
                  : "Sign in to view your notification history."}
              </p>
            </div>

            {session?.user && unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                disabled={markingAll}
                className="flex items-center gap-1 text-xs font-bold text-[#1877f2] disabled:opacity-50"
              >
                {markingAll ? (
                  <LoaderCircle size={14} className="animate-spin" />
                ) : (
                  <CheckCheck size={15} />
                )}
                <span className="hidden sm:inline">Mark all read</span>
                <span className="sm:hidden">Read all</span>
              </button>
            )}
          </div>

          {!session?.user ? (
            <div className="px-6 py-12 text-center">
              <MessageSquare
                size={30}
                className="mx-auto text-[#bcc0c4]"
              />
              <h3 className="mt-4 font-bold text-[#1c1e21]">
                Your updates are waiting
              </h3>
              <p className="mx-auto mt-2 max-w-[260px] text-sm leading-6 text-[#65676b]">
                Sign in to access your personal notification history.
                You can still enable push notifications for this device.
              </p>
              <Link
                href="/login?callbackUrl=%2Fnotifications"
                className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#1877f2] px-5 text-sm font-bold text-white"
              >
                Sign in
                <ChevronRight size={16} />
              </Link>
            </div>
          ) : loading ? (
            <div className="flex justify-center py-12">
              <LoaderCircle
                size={25}
                className="animate-spin text-[#1877f2]"
              />
            </div>
          ) : notifications.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <Bell
                size={30}
                className="mx-auto text-[#bcc0c4]"
              />
              <h3 className="mt-4 font-bold text-[#1c1e21]">
                You're all caught up
              </h3>
              <p className="mt-2 text-sm text-[#65676b]">
                New ministry announcements will appear here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#f0f2f5]">
              {notifications.map((item) => (
                <article
                  key={item.id}
                  className={`flex gap-3 px-5 py-4 transition ${
                    item.isRead ? "bg-white" : "bg-[#f4f9ff]"
                  }`}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e7f3ff] text-[#1877f2]">
                    <Bell size={18} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-bold text-[#1c1e21]">
                        {item.title}
                      </h3>
                      {!item.isRead && (
                        <span
                          aria-label="Unread"
                          className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#1877f2]"
                        />
                      )}
                    </div>

                    <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-[#65676b]">
                      {item.message}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                      <time className="text-[10px] text-[#8a8d91]">
                        {formatDate(item.createdAt)}
                      </time>

                      <div className="flex items-center gap-3">
                        {item.url && (
                          <Link
                            href={item.url}
                            onClick={() => {
                              if (!item.isRead) {
                                void markAsRead(item.id);
                              }
                            }}
                            className="text-xs font-bold text-[#1877f2]"
                          >
                            View
                          </Link>
                        )}

                        {!item.isRead && (
                          <button
                            type="button"
                            onClick={() => markAsRead(item.id)}
                            className="text-xs font-semibold text-[#65676b] hover:text-[#1877f2]"
                          >
                            Mark read
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
