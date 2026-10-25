import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cx } from "@/lib/format";

export interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  accentWord?: string;
  intro?: string;
  action?: { href: string; label: string };
  align?: "split" | "center";
  id?: string;
  className?: string;
  tone?: "light" | "dark";
}

export function SectionHeader({
  eyebrow,
  title,
  accentWord,
  intro,
  action,
  align = "split",
  id,
  className,
  tone = "light",
}: SectionHeaderProps) {
  const isDark = tone === "dark";

  return (
    <div
      className={cx(
        "mb-8 lg:mb-10",
        align === "center"
          ? "mx-auto max-w-[46ch] text-center flex flex-col items-center"
          : "flex flex-col sm:flex-row sm:items-end justify-between gap-4",
        className
      )}
    >
      <div className={align === "center" ? "flex flex-col items-center" : "max-w-2xl"}>
        {eyebrow && (
          <p
            className={cx(
              "text-eyebrow mb-2",
              isDark ? "text-gold-300" : "text-brand"
            )}
          >
            {eyebrow}
          </p>
        )}
        <h2
          id={id}
          className={cx(
            "text-h2",
            isDark ? "text-on-dark" : "text-text"
          )}
        >
          {title}{" "}
          {accentWord && (
            <span className={cx("italic", isDark ? "text-gold-400" : "text-brand")}>
              {accentWord}
            </span>
          )}
        </h2>
        {intro && (
          <p
            className={cx(
              "mt-2 text-body-s sm:text-body max-w-[46ch]",
              isDark ? "text-on-dark/80" : "text-muted"
            )}
          >
            {intro}
          </p>
        )}
      </div>

      {action && (
        <Link
          href={action.href}
          className={cx(
            "group inline-flex items-center gap-1.5 text-eyebrow shrink-0 transition-colors",
            isDark
              ? "text-gold-300 hover:text-white"
              : "text-brand hover:text-brand-hover",
            align === "center" && "mt-4"
          )}
        >
          <span>{action.label}</span>
          <ArrowRight className="size-3.5 flip-rtl transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}
