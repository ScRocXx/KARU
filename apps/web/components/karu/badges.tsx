// Server-safe presentational components (no client JS) — used on the lightweight Karu ID page too.
import { BadgeCheck, CircleDashed, Clock3, ShieldOff } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ProofCheck, Stock, VerificationStatus } from "@/lib/types";
import { cx } from "@/lib/format";

/** VerifiedBadge: never colour alone — icon + text (Part 1 §9.8). Small (cards) and large (product/Karu ID). */
export function VerifiedBadge({ status, size = "sm", className }: { status: VerificationStatus; size?: "sm" | "lg"; className?: string }) {
  const t = useTranslations("badge");
  const lg = size === "lg";
  const base = cx("inline-flex items-center gap-1 rounded-full font-semibold whitespace-nowrap", lg ? "px-3.5 py-1.5 text-[15px]" : "px-2 py-0.5 text-xs", className);
  if (status === "verified")
    return (
      <span className={cx(base, "animate-settle bg-peacock-600 text-white")}>
        <BadgeCheck className={lg ? "size-5" : "size-3.5"} aria-hidden />
        {t("verified")}
      </span>
    );
  if (status === "checking")
    return (
      <span className={cx(base, "bg-indigo-50 text-indigo-900")}>
        <Clock3 className={lg ? "size-5" : "size-3.5"} aria-hidden />
        {t("checking")}
        <span className="inline-flex gap-0.5" aria-hidden>
          <span className="size-1 animate-bounce rounded-full bg-current [animation-delay:-0.2s]" />
          <span className="size-1 animate-bounce rounded-full bg-current [animation-delay:-0.1s]" />
          <span className="size-1 animate-bounce rounded-full bg-current" />
        </span>
      </span>
    );
  if (status === "revoked")
    return (
      <span className={cx(base, "bg-ink-100 text-ink-900")}>
        <ShieldOff className={lg ? "size-5" : "size-3.5"} aria-hidden />
        {t("revoked")}
      </span>
    );
  return (
    <span className={cx(base, "bg-unverified text-white")}>
      <CircleDashed className={lg ? "size-5" : "size-3.5"} aria-hidden />
      {t("not_verified")}
    </span>
  );
}

export function StockPill({ stock, className }: { stock: Stock; className?: string }) {
  const t = useTranslations("stock");
  if (stock.state === "out") return <span className={cx("rounded-full bg-ink-100 px-2 py-0.5 text-xs font-semibold text-ink-600", className)}>{t("out")}</span>;
  if (stock.state === "low")
    return <span className={cx("rounded-full bg-terracotta-600/10 px-2 py-0.5 text-xs font-semibold text-terracotta-600", className)}>{t("low", { n: stock.count })}</span>;
  return <span className={cx("rounded-full bg-peacock-50 px-2 py-0.5 text-xs font-semibold text-peacock-600", className)}>{t("in")}</span>;
}

/** Three plain-language checks with a "how we checked" expander; never raw scores (Part 1 §3.3 rule 5). */
export function ProofChecks({ checks, photosOriginal, registry }: { checks: ProofCheck[]; photosOriginal?: boolean | null; registry?: { kind: string; date: string }[] }) {
  const t = useTranslations("proof");
  const icon = (state: ProofCheck["state"]) =>
    state === "passed" ? (
      <span className="flex size-7 items-center justify-center rounded-full bg-peacock-600 text-sm font-bold text-white">✓</span>
    ) : state === "new_maker" ? (
      <span className="flex size-7 items-center justify-center rounded-full bg-indigo-50 text-sm font-bold text-indigo-900">★</span>
    ) : state === "pending" ? (
      <span className="flex size-7 items-center justify-center rounded-full bg-indigo-50 text-sm text-indigo-900">…</span>
    ) : (
      <span className="flex size-7 items-center justify-center rounded-full bg-ink-100 text-sm font-bold text-ink-600">–</span>
    );
  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-2.5">
        {checks.map((c) => (
          <li key={c.key} className="flex items-center gap-3">
            {icon(c.state)}
            <span className="text-[15px] text-ink-900">{t(`check.${c.key}.${c.state}`)}</span>
          </li>
        ))}
        {photosOriginal && (
          <li className="flex items-center gap-3">
            {icon("passed")}
            <span className="text-[15px] text-ink-900">{t("photos_original")}</span>
          </li>
        )}
        {(registry || []).map((r) => (
          <li key={r.kind} className="flex items-center gap-3">
            {icon("passed")}
            <span className="text-[15px] text-ink-900">{t(`registry.${r.kind}`, { date: r.date })}</span>
          </li>
        ))}
      </ul>
      <details className="group rounded-[10px] bg-khadi-50 px-3 py-2 text-sm text-ink-600">
        <summary className="cursor-pointer font-semibold text-indigo-900">{t("how_we_checked")}</summary>
        <ul className="mt-2 list-disc space-y-1 ps-5">
          <li>{t("how.l1")}</li>
          <li>{t("how.l2")}</li>
          <li>{t("how.l3")}</li>
          <li>{t("how.no_scores")}</li>
        </ul>
      </details>
    </div>
  );
}

export function Wordmark({ className, light }: { className?: string; light?: boolean }) {
  return (
    <span className={cx("font-display inline-flex items-baseline gap-1 text-2xl font-semibold tracking-tight", light ? "text-white" : "text-indigo-900", className)}>
      <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden className="self-center">
        <path d="M3 6h18M3 12h18M3 18h18" stroke="var(--color-haldi-500)" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M7 3v18M12 3v18M17 3v18" stroke={light ? "#fff" : "var(--color-indigo-900)"} strokeWidth="2" strokeLinecap="round" opacity=".85" />
      </svg>
      karu
    </span>
  );
}

export function Woven({ className }: { className?: string }) {
  return <div className={cx("woven w-full", className)} aria-hidden />;
}
