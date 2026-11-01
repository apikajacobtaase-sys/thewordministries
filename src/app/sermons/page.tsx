 import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, Search } from "lucide-react";

import AppHeader from "@/components/layout/AppHeader";
import BottomNavigation from "@/components/layout/BottomNavigation";
import SermonCard from "@/components/sermons/SermonCard";
import { db } from "@/lib/prisma";

export const metadata = {
  title: "Sermon Library",
  description:
    "Explore published sermons and teachings from The Word Ministries International.",
};

type SermonsPageProps = {
  searchParams: Promise<{
    q?: string;
    category?: string;
  }>;
};

export default function SermonsPage({
  searchParams,
}: SermonsPageProps) {
  return (
    <div className="page-shell">
      <AppHeader />

      <Suspense
        fallback={
          <main className="container-mobile min-h-screen px-5 pb-28 pt-10">
            <p className="text-sm text-[#65676b]">
              Loading sermon library...
            </p>
          </main>
        }
      >
        <SermonsContent searchParams={searchParams} />
      </Suspense>

      <BottomNavigation />
    </div>
  );
}

async function SermonsContent({
  searchParams,
}: SermonsPageProps) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const selectedCategory = params.category?.trim() ?? "All";

  const where = {
    published: true,
    ...(selectedCategory !== "All"
      ? { category: selectedCategory }
      : {}),
    ...(query
      ? {
          OR: [
            { title: { contains: query, mode: "insensitive" as const } },
            { preacher: { contains: query, mode: "insensitive" as const } },
            { scripture: { contains: query, mode: "insensitive" as const } },
            { description: { contains: query, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [sermons, categories] = await Promise.all([
    db.sermon.findMany({
      where,
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    }),
    db.sermon.findMany({
      where: { published: true },
      select: { category: true },
      distinct: ["category"],
      orderBy: { category: "asc" },
    }),
  ]);

  const categoryNames = [
    "All",
    ...categories.map((item) => item.category),
  ];

  return (
    <div className="page-shell">
      <main className="container-mobile min-h-screen pb-28">
        <section className="px-5 pb-6 pt-7">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-medium text-[#65676b] transition-colors hover:text-[#1877f2]"
          >
            <ArrowLeft size={15} aria-hidden="true" />
            Back to Home
          </Link>

          <div className="mt-7 flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#1877f2]/15 bg-[#e7f3ff] text-[#1877f2]">
              <BookOpen size={22} strokeWidth={1.7} aria-hidden="true" />
            </div>

            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-[#1877f2]">
                Feed Your Spirit
              </p>

              <h1 className="display-font mt-1 text-[30px] leading-tight text-[#1c1e21]">
                Sermon Library
              </h1>
            </div>
          </div>

          <p className="mt-4 max-w-md text-[12px] leading-6 text-[#65676b]">
            Explore messages from The Word Ministries International and grow
            through the teaching of God&apos;s Word.
          </p>
        </section>

        <section className="px-5">
          <form action="/sermons" method="GET" className="relative">
            <Search
              size={17}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#65676b]"
              aria-hidden="true"
            />

            <input
              type="search"
              name="q"
              defaultValue={query}
              placeholder="Search sermons, speakers, Scripture..."
              aria-label="Search sermons"
              className="h-12 w-full rounded-2xl border border-[#e4e6eb] bg-white pl-11 pr-4 text-sm text-[#1c1e21] outline-none placeholder:text-[#8a8d91] focus:border-[#1877f2] focus:ring-2 focus:ring-[#1877f2]/10"
            />

            {selectedCategory !== "All" && (
              <input
                type="hidden"
                name="category"
                value={selectedCategory}
              />
            )}
          </form>
        </section>

        <section className="px-5 pt-5">
          <div className="flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {categoryNames.map((category) => {
              const isActive = category === selectedCategory;

              const searchParams = new URLSearchParams();

              if (query) {
                searchParams.set("q", query);
              }

              if (category !== "All") {
                searchParams.set("category", category);
              }

              const queryString = searchParams.toString();

              return (
                <Link
                  key={category}
                  href={`/sermons${queryString ? `?${queryString}` : ""}`}
                  aria-current={isActive ? "page" : undefined}
                  className={`shrink-0 rounded-full border px-4 py-2 text-[11px] font-semibold transition-colors ${
                    isActive
                      ? "border-[#1877f2] bg-[#1877f2] text-white"
                      : "border-[#e4e6eb] bg-white text-[#65676b] hover:border-[#1877f2]/40 hover:bg-[#e7f3ff] hover:text-[#1877f2]"
                  }`}
                >
                  {category}
                </Link>
              );
            })}
          </div>
        </section>

        <section className="px-5 pb-8 pt-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-sm font-bold text-[#1c1e21]">
              {query ? "Search Results" : "Published Messages"}
            </h2>

            <span className="text-[10px] text-[#65676b]">
              {sermons.length}{" "}
              {sermons.length === 1 ? "sermon" : "sermons"}
            </span>
          </div>

          {sermons.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
              {sermons.map((sermon) => (
                <SermonCard key={sermon.id} sermon={sermon} />
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-[#e4e6eb] bg-white px-5 py-12 text-center shadow-sm">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e7f3ff] text-[#1877f2]">
                <BookOpen size={25} strokeWidth={1.5} aria-hidden="true" />
              </div>

              <h3 className="display-font mt-5 text-xl text-[#1c1e21]">
                {query ? "No Messages Found" : "Messages Coming Soon"}
              </h3>

              <p className="mx-auto mt-3 max-w-xs text-xs leading-6 text-[#65676b]">
                {query
                  ? "Try a different search term or choose another category."
                  : "Published sermons will appear here when the ministry adds them to the library."}
              </p>

              {(query || selectedCategory !== "All") && (
                <Link href="/sermons" className="gold-button mt-5">
                  View All Sermons
                </Link>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}