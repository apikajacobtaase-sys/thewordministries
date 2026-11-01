import Link from "next/link";
import { ArrowLeft, Users, UserRound, ShieldCheck } from "lucide-react";

import AppHeader from "@/components/layout/AppHeader";
import BottomNavigation from "@/components/layout/BottomNavigation";
import { db } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Our Members",
  description: "Meet the members of The Word Ministries International.",
};

export default async function MembersPage() {
  const members = await db.user.findMany({
    where: {
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      image: true,
      churchPosition: {
        select: {
          name: true,
          isActive: true,
          isExecutive: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  return (
    <div className="page-shell">
      <AppHeader />

      <main className="container-mobile min-h-screen px-5 pb-32 pt-7">
        <Link
          href="/more"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#65676b] hover:text-[#1877f2]"
        >
          <ArrowLeft size={16} />
          More
        </Link>

        <section className="mb-7 mt-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e7f3ff] text-[#1877f2]">
            <Users size={25} />
          </div>

          <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-[#1877f2]">
            Our Church Family
          </p>

          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-[#1c1e21]">
            Our Members
          </h1>

          <p className="mt-2 text-sm leading-6 text-[#65676b]">
            Meet the people who make up The Word Ministries International.
            Every member is part of our church family.
          </p>

          <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#e7f3ff] px-3 py-2 text-xs font-bold text-[#1877f2]">
            <Users size={14} />
            {members.length} {members.length === 1 ? "Member" : "Members"}
          </div>
        </section>

        {members.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {members.map((member) => {
              const displayName = member.name?.trim() || "Church Member";
              const position = member.churchPosition?.isActive
                ? member.churchPosition
                : null;

              const initials = displayName
                .split(/\s+/)
                .filter(Boolean)
                .slice(0, 2)
                .map((part) => part[0].toUpperCase())
                .join("");

              return (
                <article
                  key={member.id}
                  className="overflow-hidden rounded-2xl border border-[#e4e6eb] bg-white p-3 shadow-sm"
                >
                  <div className="relative mx-auto flex aspect-square w-full max-w-[150px] items-center justify-center overflow-hidden rounded-xl bg-[#e7f3ff]">
                    {member.image ? (
                      <img
                        src={member.image}
                        alt={displayName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-3xl font-extrabold text-[#1877f2]">
                        {initials || <UserRound size={35} />}
                      </div>
                    )}
                  </div>

                  <div className="mt-3 text-center">
                    <h2 className="line-clamp-2 text-sm font-bold text-[#1c1e21]">
                      {displayName}
                    </h2>

                    {position ? (
                      <div className="mt-2 inline-flex max-w-full items-center justify-center gap-1 rounded-full bg-[#e7f3ff] px-2.5 py-1">
                        {position.isExecutive && (
                          <ShieldCheck size={11} className="shrink-0 text-[#1877f2]" />
                        )}
                        <span className="truncate text-[10px] font-bold text-[#1877f2]">
                          {position.name}
                        </span>
                      </div>
                    ) : (
                      <p className="mt-2 text-[11px] font-medium text-[#65676b]">
                        Church Member
                      </p>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-[#e4e6eb] bg-white px-5 py-12 text-center">
            <Users size={32} className="mx-auto text-[#1877f2]" />
            <h2 className="mt-4 text-base font-bold text-[#1c1e21]">
              Members coming soon
            </h2>
            <p className="mt-2 text-sm text-[#65676b]">
              Our church family directory will appear here.
            </p>
          </div>
        )}
      </main>

      <BottomNavigation />
    </div>
  );
}
