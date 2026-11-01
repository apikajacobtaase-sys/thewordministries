import Link from "next/link";
import { ArrowLeft, Church, ShieldCheck, UserRound } from "lucide-react";

import AppHeader from "@/components/layout/AppHeader";
import BottomNavigation from "@/components/layout/BottomNavigation";
import { db } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Church Leadership",
  description:
    "Meet the leaders and executive team of The Word Ministries International.",
};

export default async function LeadershipPage() {
  const positions = await db.churchPosition.findMany({
    where: {
      isActive: true,
      users: {
        some: {
          isActive: true,
        },
      },
    },
    select: {
      id: true,
      name: true,
      description: true,
      isExecutive: true,
      users: {
        where: {
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          image: true,
        },
        orderBy: {
          name: "asc",
        },
      },
    },
    orderBy: [
      { isExecutive: "desc" },
      { name: "asc" },
    ],
  });

  return (
    <div className="page-shell">
      <AppHeader />

      <main className="container-mobile min-h-screen px-5 pb-32 pt-7">
        <Link
          href="/more"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#65676b] transition hover:text-[#1877f2]"
        >
          <ArrowLeft size={16} />
          More
        </Link>

        <section className="mb-7 mt-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e7f3ff] text-[#1877f2]">
            <Church size={25} />
          </div>

          <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-[#1877f2]">
            Our Ministry
          </p>

          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-[#1c1e21]">
            Church Leadership
          </h1>

          <p className="mt-2 text-sm leading-6 text-[#65676b]">
            Meet the people entrusted with serving and providing leadership
            within The Word Ministries International.
          </p>
        </section>

        {positions.length > 0 ? (
          <div className="space-y-5">
            {positions.map((position) => (
              <section
                key={position.id}
                className="overflow-hidden rounded-2xl border border-[#e4e6eb] bg-white shadow-sm"
              >
                <div className="border-b border-[#e4e6eb] px-4 py-4">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-extrabold text-[#1c1e21]">
                      {position.name}
                    </h2>

                    {position.isExecutive && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#e7f3ff] px-2 py-1 text-[9px] font-bold text-[#1877f2]">
                        <ShieldCheck size={11} />
                        Executive
                      </span>
                    )}
                  </div>

                  {position.description && (
                    <p className="mt-1 text-xs leading-5 text-[#65676b]">
                      {position.description}
                    </p>
                  )}
                </div>

                <div className="divide-y divide-[#e4e6eb]">
                  {position.users.map((member) => {
                    const displayName = member.name?.trim() || "Church Member";

                    const initials = displayName
                      .split(/\s+/)
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((part) => part[0].toUpperCase())
                      .join("");

                    return (
                      <div
                        key={member.id}
                        className="flex items-center gap-3 px-4 py-4"
                      >
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#e7f3ff] text-sm font-extrabold text-[#1877f2]">
                          {member.image ? (
                            <img
                              src={member.image}
                              alt={displayName}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            initials || <UserRound size={21} />
                          )}
                        </div>

                        <div className="min-w-0">
                          <h3 className="truncate text-sm font-bold text-[#1c1e21]">
                            {displayName}
                          </h3>

                          <p className="mt-1 text-xs text-[#65676b]">
                            {position.name}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <section className="rounded-2xl border border-[#e4e6eb] bg-white px-5 py-12 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e7f3ff] text-[#1877f2]">
              <Church size={27} />
            </div>

            <h2 className="mt-4 text-base font-extrabold text-[#1c1e21]">
              Leadership information coming soon
            </h2>

            <p className="mx-auto mt-2 max-w-[280px] text-sm leading-6 text-[#65676b]">
              Our church leadership directory will appear here as appointments
              are added.
            </p>
          </section>
        )}

        <p className="mt-8 text-center text-xs text-[#8a8d91]">
          The Word Ministries International
        </p>
      </main>

      <BottomNavigation />
    </div>
  );
}
