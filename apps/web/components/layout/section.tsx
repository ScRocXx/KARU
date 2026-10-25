import { cx } from "@/lib/format";

export interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  tone?: "bg" | "alt" | "deep" | "brand";
  bleed?: boolean;
  pad?: "default" | "tight" | "none";
  labelledBy?: string;
}

export function Section({
  children,
  tone = "bg",
  pad = "default",
  className,
  labelledBy,
  ...rest
}: SectionProps) {
  const toneClasses = {
    bg: "bg-bg text-text",
    alt: "bg-surface-alt text-text paper-grain",
    deep: "bg-surface-deep text-on-dark",
    brand: "bg-brand text-on-dark",
  }[tone];

  const padClasses = {
    default: "py-14 md:py-20 lg:py-24",
    tight: "py-8 md:py-12 lg:py-14",
    none: "py-0",
  }[pad];

  return (
    <section
      aria-labelledby={labelledBy}
      className={cx("relative w-full", toneClasses, padClasses, className)}
      {...rest}
    >
      {children}
    </section>
  );
}
