import { notFound } from "next/navigation";
import Link from "next/link";
import SermonMedia from "@/components/sermons/SermonMedia";
import SermonInteractions from "@/components/sermons/SermonInteractions";
import { db } from "@/lib/prisma";
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  Headphones,
  Play,
  UserRound,
  BookOpen,
  Video,
} from "lucide-react";

type SermonPageProps = {
  params: Promise<{ id: string }>;
};

export default async function SermonDetailPage({
  params,
}: SermonPageProps) {
  const { id } = await params;

  const sermon = await db.sermon.findFirst({
    where: {
      OR: [{ id }, { slug: id }],
      published: true,
    },
  });

  if (!sermon) {
    notFound();
  }

  const recommendations = await db.sermon.findMany({
    where: {
      published: true,
      id: { not: sermon.id },
      OR: [
        { category: sermon.category },
        { preacher: sermon.preacher },
      ],
    },
    orderBy: [
      { featured: "desc" },
      { publishedAt: "desc" },
      { createdAt: "desc" },
    ],
    take: 6,
    select: {
      id: true,
      slug: true,
      title: true,
      preacher: true,
      category: true,
      thumbnail: true,
      duration: true,
      videoUrl: true,
      audioUrl: true,
    },
  });

  return (
    <main className="min-h-screen bg-[#f0f2f5] px-3 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <Link
          href="/sermons"
          className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-[#1877f2] transition hover:text-[#0866ff]"
        >
          <ArrowLeft size={18} />
          Sermon Library
        </Link>

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_370px]">
          <div className="min-w-0">
            <section className="overflow-hidden rounded-2xl border border-[#e4e6eb] bg-white shadow-sm">
              {sermon.videoUrl ? (
                <SermonMedia
                  url={sermon.videoUrl}
                  title={sermon.title}
                  kind="video"
                  thumbnail={sermon.thumbnail}
                  className="mt-0"
                />
              ) : sermon.audioUrl ? (
                <SermonMedia
                  url={sermon.audioUrl}
                  title={sermon.title}
                  kind="audio"
                />
              ) : (
                <div className="flex aspect-video flex-col items-center justify-center gap-4 bg-gradient-to-br from-[#0b3d91] to-[#1877f2] text-white">
                  <Headphones size={52} strokeWidth={1.4} />
                  <p className="text-sm font-semibold">
                    Recording coming soon
                  </p>
                </div>
              )}

              <div className="p-4 sm:p-6">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[#e7f3ff] px-3 py-1 text-xs font-bold text-[#1877f2]">
                    {sermon.category}
                  </span>

                  {sermon.scripture && (
                    <span className="rounded-full bg-[#f0f2f5] px-3 py-1 text-xs font-medium text-[#65676b]">
                      {sermon.scripture}
                    </span>
                  )}
                </div>

                <h1 className="mt-4 text-xl font-extrabold leading-tight tracking-tight text-[#1c1e21] sm:text-3xl">
                  {sermon.title}
                </h1>

                <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm text-[#65676b]">
                  <span className="inline-flex items-center gap-2">
                    <UserRound size={17} className="text-[#1877f2]" />
                    {sermon.preacher}
                  </span>

                  {sermon.duration != null && (
                    <span className="inline-flex items-center gap-2">
                      <Clock3 size={17} className="text-[#1877f2]" />
                      {sermon.duration} minutes
                    </span>
                  )}

                  {sermon.publishedAt && (
                    <span className="inline-flex items-center gap-2">
                      <CalendarDays size={17} className="text-[#1877f2]" />
                      {new Intl.DateTimeFormat("en-GH", {
                        dateStyle: "long",
                      }).format(sermon.publishedAt)}
                    </span>
                  )}
                </div>

                <SermonInteractions sermonId={sermon.id} sermonTitle={sermon.title} preacher={sermon.preacher} />

                <div className="my-6 border-t border-[#e4e6eb]" />

                <div>
                  <h2 className="text-lg font-bold text-[#1c1e21]">
                    About This Sermon
                  </h2>

                  <p className="mt-3 whitespace-pre-line text-sm leading-7 text-[#65676b]">
                    {sermon.description}
                  </p>
                </div>

                {sermon.videoUrl && sermon.audioUrl && (
                  <div className="mt-7 border-t border-[#e4e6eb] pt-6">
                    <SermonMedia
                      url={sermon.audioUrl}
                      title={sermon.title}
                      kind="audio"
                    />
                  </div>
                )}
              </div>
            </section>



            <section className="mt-6 rounded-2xl border border-[#e4e6eb] bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e7f3ff] text-[#1877f2]">
                  <BookOpen size={21} />
                </div>

                <div>
                  <h2 className="font-bold text-[#1c1e21]">
                    Grow Through the Word
                  </h2>
                  <p className="mt-1 text-xs text-[#65676b]">
                    Explore more teachings and messages from the ministry.
                  </p>
                </div>
              </div>

              <Link
                href="/sermons"
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#1877f2] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0866ff]"
              >
                <Play size={16} fill="currentColor" />
                Explore Sermon Library
              </Link>
            </section>
          </div>

          <aside className="min-w-0">
            <section className="rounded-2xl border border-[#e4e6eb] bg-white p-4 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-2">
                <h2 className="font-bold text-[#1c1e21]">
                  Recommended Sermons
                </h2>
                <Video size={19} className="text-[#1877f2]" />
              </div>

              {recommendations.length > 0 ? (
                <div className="space-y-4">
                  {recommendations.map((item) => (
                    <Link
                      key={item.id}
                      href={`/sermons/${item.slug}`}
                      className="group flex min-w-0 gap-3"
                    >
                      <div className="relative aspect-video w-32 shrink-0 overflow-hidden rounded-xl bg-[#e7f3ff] sm:w-36">
                        {item.thumbnail ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.thumbnail}
                            alt=""
                            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-[#1877f2]">
                            {item.videoUrl ? (
                              <Play size={25} />
                            ) : (
                              <Headphones size={25} />
                            )}
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="line-clamp-2 text-sm font-semibold leading-5 text-[#1c1e21] transition group-hover:text-[#1877f2]">
                          {item.title}
                        </h3>

                        <p className="mt-1 truncate text-xs text-[#65676b]">
                          {item.preacher}
                        </p>

                        <p className="mt-1 truncate text-[11px] text-[#8a8d91]">
                          {item.category}
                        </p>

                        {item.duration != null && (
                          <p className="mt-1 text-[11px] text-[#8a8d91]">
                            {item.duration} minutes
                          </p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="py-6 text-center text-sm text-[#65676b]">
                  More sermons will appear here as they are published.
                </p>
              )}

              <Link
                href="/sermons"
                className="mt-5 block rounded-xl border border-[#1877f2]/20 bg-[#e7f3ff] py-3 text-center text-sm font-semibold text-[#1877f2] transition hover:bg-[#dbeafe]"
              >
                View All Sermons
              </Link>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}



