"use client";

import { useEffect, useState } from "react";
import { Eye } from "lucide-react";

type SermonViewCountProps = {
  sermonId: string;
  initialCount: number;
};

export default function SermonViewCount({
  sermonId,
  initialCount,
}: SermonViewCountProps) {
  const [count, setCount] = useState(initialCount);

  useEffect(() => {
    let active = true;

    async function trackView() {
      try {
        const response = await fetch(`/api/sermons/${sermonId}/view`, {
          method: "POST",
          credentials: "same-origin",
          cache: "no-store",
        });

        if (!response.ok) return;

        const data = await response.json();

        if (active && data.success && typeof data.viewCount === "number") {
          setCount(data.viewCount);
        }
      } catch (error) {
        console.error("Unable to track sermon view:", error);
      }
    }

    trackView();

    return () => {
      active = false;
    };
  }, [sermonId]);

  return (
    <span
      className="inline-flex items-center gap-2"
      aria-label={`${count.toLocaleString()} views`}
    >
      <Eye size={17} className="text-[#1877f2]" />
      {count.toLocaleString()} {count === 1 ? "view" : "views"}
    </span>
  );
}