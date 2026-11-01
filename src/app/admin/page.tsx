import Link from "next/link";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  Church,
  FileText,
  HeartHandshake,
  LayoutDashboard,
  Newspaper,
  Plus,
  Users,
  Video,
  Bell,
} from "lucide-react";

import { auth } from "@/lib/auth";
import { db } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const modules = [
  {
    title: "About Ministry",
    description: "Manage the church story, vision, mission and leadership.",
    href: "/admin/about",
    icon: Church,
    label: "Manage About",
  },
  {
    title: "News & Announcements",
    description: "Create announcements, publish news and manage updates.",
    href: "/admin/news",
    icon: Newspaper,
    label: "Manage News",
  },
  {
    title: "Programs & Events",
    description: "Organise ministry programs, events and registrations.",
    href: "/admin/programs",
    icon: CalendarDays,
    label: "Manage Programs",
  },
  {
    title: "Sermon Library",
    description: "Upload, edit and publish audio and video teachings.",
    href: "/admin/sermons",
    icon: Video,
    label: "Manage Sermons",
  },
  {
    title: "Prayer Requests",
    description: "Review prayer needs and track their progress.",
    href: "/admin/prayer",
    icon: HeartHandshake,
    label: "Manage Prayer",
  },  {
    title: "Church Notifications",
    description: "Send important announcements to subscribed church members and devices.",
    href: "/admin/notifications",
    icon: Bell,
    label: "Manage Notifications",
  },
];

export default async function AdminDashboardPage() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    redirect("/login?callbackUrl=%2Fadmin");
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      role: true,
      isActive: true,
    },
  });

  if (!user || !user.isActive) {
    redirect("/login?callbackUrl=%2Fadmin");
  }

  if (
    user.role !== UserRole.ADMIN &&
    user.role !== UserRole.SUPER_ADMIN
  ) {
    redirect("/");
  }

  const [
    members,
    publishedNews,
    publishedPrograms,
    publishedSermons,
    pendingPrayers,
    sermonDrafts,
  ] = await Promise.all([
    db.user.count({ where: { isActive: true } }),
    db.announcement.count({ where: { status: "PUBLISHED" } }),
    db.event.count({ where: { status: "PUBLISHED" } }),
    db.sermon.count({ where: { published: true } }),
    db.prayerRequest.count({ where: { status: "PENDING" } }),
    db.sermonDraft.count(),
  ]);

  const statistics = [
    {
      label: "Active Members",
      value: members,
      icon: Users,
      color: "bg-[#e7f3ff] text-[#1877f2]",
    },
    {
      label: "Published News",
      value: publishedNews,
      icon: Newspaper,
      color: "bg-[#e8f5e9] text-[#2e7d32]",
    },
    {
      label: "Published Programs",
      value: publishedPrograms,
      icon: CalendarDays,
      color: "bg-[#fff4e5] text-[#b76e00]",
    },
    {
      label: "Published Sermons",
      value: publishedSermons,
      icon: BookOpen,
      color: "bg-[#f0eaff] text-[#7545c8]",
    },
    {
      label: "Pending Prayers",
      value: pendingPrayers,
      icon: HeartHandshake,
      color: "bg-[#ffecec] text-[#d93036]",
      href: "/admin/prayer",
    },
    {
      label: "Sermon Drafts",
      value: sermonDrafts,
      icon: FileText,
      color: "bg-[#f1f3f5] text-[#65676b]",
      href: "/admin/sermons",
    },
  ];

  const displayName = user.name?.trim() || "Administrator";

  return (
    <main className="min-h-screen bg-[#f0f2f5] px-4 pb-16 pt-6 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-[1600px]">
        <header className="mb-8 flex justify-end">
          <span className="rounded-full bg-[#e7f3ff] px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wide text-[#1877f2]">
            {user.role === UserRole.SUPER_ADMIN ? "Super Admin" : "Administrator"}
          </span>
        </header>

        <section className="mb-8">
          <div className="flex items-center gap-2 text-[#1877f2]">
            <LayoutDashboard size={18} />
            <span className="text-xs font-extrabold uppercase tracking-[0.16em]">
              Administration
            </span>
          </div>

          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-[#1c1e21] sm:text-4xl">
            Welcome, {displayName.split(" ")[0]}
          </h1>

          <p className="mt-2 max-w-xl text-sm leading-6 text-[#65676b]">
            Your central workspace for managing The Word Ministries
            International website, content and community.
          </p>
        </section>

        <section className="mb-9">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-[#1c1e21]">
              Ministry Overview
            </h2>
            <span className="text-xs text-[#65676b]">Live database statistics</span>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {statistics.map((stat) => {
              const Icon = stat.icon;
              const content = (
                <div className="h-full rounded-2xl border border-[#e4e6eb] bg-white p-4 shadow-sm transition hover:shadow-md">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.color}`}>
                    <Icon size={19} />
                  </div>
                  <p className="mt-4 text-2xl font-extrabold text-[#1c1e21]">
                    {stat.value.toLocaleString()}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-[#65676b]">
                    {stat.label}
                  </p>
                </div>
              );

              return stat.href ? (
                <Link key={stat.label} href={stat.href}>
                  {content}
                </Link>
              ) : (
                <div key={stat.label}>{content}</div>
              );
            })}
          </div>
        </section>

        <section>
          <div className="mb-4">
            <h2 className="text-lg font-extrabold text-[#1c1e21]">
              Management Centre
            </h2>
            <p className="mt-1 text-sm text-[#65676b]">
              Select a department to manage its content and activities.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {modules.map((module) => {
              const Icon = module.icon;

              return (
                <Link
                  key={module.href}
                  href={module.href}
                  className="group flex min-h-[180px] flex-col rounded-2xl border border-[#e4e6eb] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#1877f2]/30 hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#e7f3ff] text-[#1877f2]">
                      <Icon size={23} />
                    </span>

                    <ArrowRight
                      size={19}
                      className="text-[#a0a3a8] transition group-hover:translate-x-1 group-hover:text-[#1877f2]"
                    />
                  </div>

                  <h3 className="mt-5 text-base font-extrabold text-[#1c1e21]">
                    {module.title}
                  </h3>

                  <p className="mt-2 flex-1 text-xs leading-5 text-[#65676b]">
                    {module.description}
                  </p>

                  <span className="mt-4 text-xs font-bold text-[#1877f2]">
                    {module.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-[#1877f2]/15 bg-[#e7f3ff] p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#1877f2]">
              <Plus size={21} />
            </div>

            <div>
              <h2 className="text-sm font-extrabold text-[#1c1e21]">
                Your administration workspace
              </h2>
              <p className="mt-1 text-xs leading-5 text-[#65676b]">
                Manage your ministry content from one place. Changes made
                through these management sections are reflected on the
                public website according to their publishing status.
              </p>
            </div>
          </div>
        </section>

        <footer className="mt-8 border-t border-[#e4e6eb] pt-5 text-center text-xs text-[#8a8d91]">
          The Word Ministries International  Administration
        </footer>
      </div>
    </main>
  );
}



