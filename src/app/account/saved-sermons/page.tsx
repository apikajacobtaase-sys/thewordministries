import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Bookmark } from "lucide-react";
import AppHeader from "@/components/layout/AppHeader";
import BottomNavigation from "@/components/layout/BottomNavigation";
import SavedSermonsLibrary from "@/components/sermons/SavedSermonsLibrary";
import { auth } from "@/lib/auth";
import { db } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Saved Sermons",
  description: "Your personal collection of saved sermons from The Word Ministries International.",
};

export default async function SavedSermonsPage() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    redirect("/login?callbackUrl=%2Faccount%2Fsaved-sermons");
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, isActive: true },
  });

  if (!user || !user.isActive) {
    redirect("/login?callbackUrl=%2Faccount%2Fsaved-sermons");
  }

  const savedSermons = await db.savedSermon.findMany({
    where: {
      userId: user.id,
      sermon: { published: true },
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      createdAt: true,
      sermon: {
        select: {
          id: true,
          title: true,
          preacher: true,
          category: true,
          scripture: true,
          description: true,
          thumbnail: true,
          mediaType: true,
          audioUrl: true,
          videoUrl: true,
          duration: true,
          publishedAt: true,
        },
      },
    },
  });

  return (
    <div className="page-shell">
      <AppHeader />

      <main className="container-mobile min-h-screen px-5 pb-28 pt-7">
        <Link
          href="/sermons"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#65676b] transition hover:text-[#1877f2]"
        >
          <ArrowLeft size={16} />
          Sermon Library
        </Link>

        <section className="mb-7 mt-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e7f3ff] text-[#1877f2]">
              <Bookmark size={23} />
            </div>

            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-[#1c1e21]">
                Saved Sermons
              </h1>
              <p className="mt-1 text-xs text-[#65676b]">
                Your personal collection of teachings.
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-[#e4e6eb] bg-white px-4 py-3">
            <p className="text-sm font-semibold text-[#1c1e21]">
              {savedSermons.length}{" "}
              {savedSermons.length === 1 ? "sermon" : "sermons"} saved
            </p>
          </div>
        </section>

        <SavedSermonsLibrary initialSermons={savedSermons} />
      </main>

      <BottomNavigation />
    </div>
  );
}
