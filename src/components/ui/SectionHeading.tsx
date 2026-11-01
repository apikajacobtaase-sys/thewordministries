
import Link from "next/link";
import { ArrowRight } from "lucide-react";

type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  description?: string;
  href?: string;
  linkLabel?: string;
};

export default function SectionHeading({
  eyebrow,
  title,
  description,
  href,
  linkLabel = "View all",
}: SectionHeadingProps) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div className="min-w-0">
        <span className="section-eyebrow">{eyebrow}</span>

        <h2 className="display-font mt-3 text-[28px] leading-[1.12] tracking-[-0.04em] text-[#1c1e21] sm:text-[34px]">
          {title}
        </h2>

        {description && (
          <p className="mt-3 max-w-[320px] text-[12px] leading-7 text-[#65676b]">
            {description}
          </p>
        )}
      </div>

      {href && (
        <Link
          href={href}
          className="group mb-1 inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-xl px-2 text-[11px] font-bold text-[#1877f2] transition-colors duration-200 hover:bg-[#e7f3ff] hover:text-[#0866ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1877f2]"
        >
          {linkLabel}

          <ArrowRight
            size={14}
            aria-hidden="true"
            className="transition-transform duration-200 group-hover:translate-x-0.5"
          />
        </Link>
      )}
    </div>
  );
}