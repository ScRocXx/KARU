// Server-safe presentational components (no client JS) — used on the lightweight Karu ID page too.
import { BadgeCheck, CircleDashed, Clock3, ShieldOff, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ProofCheck, Stock, VerificationStatus } from "@/lib/types";
import { cx } from "@/lib/format";

/** VerifiedBadge: never colour alone — icon + text (Part 1 §9.8). Small (cards) and large (product/Karu ID). */
export function VerifiedBadge({ status, size = "sm", className }: { status: VerificationStatus; size?: "sm" | "lg"; className?: string }) {
  const t = useTranslations("badge");
  const lg = size === "lg";
  const base = cx(
    "inline-flex items-center gap-1.5 rounded-full font-medium whitespace-nowrap tracking-wide transition-all",
    lg ? "px-3.5 py-1.5 text-[14px]" : "px-2.5 py-0.5 text-[11px]",
    className
  );
  if (status === "verified")
    return (
      <span className={cx(base, "animate-settle bg-peacock-700 text-white shadow-xs border border-peacock-600/30")}>
        <BadgeCheck className={lg ? "size-4.5 text-gold-500" : "size-3.5 text-gold-500"} aria-hidden />
        <span>{t("verified")}</span>
      </span>
    );
  if (status === "checking")
    return (
      <span className={cx(base, "bg-sand-100 text-ink-800 border border-sand-200")}>
        <Clock3 className={lg ? "size-4.5" : "size-3.5"} aria-hidden />
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
      <span className={cx(base, "bg-ink-100 text-ink-900 border border-ink-200")}>
        <ShieldOff className={lg ? "size-4.5 text-danger-600" : "size-3.5 text-danger-600"} aria-hidden />
        {t("revoked")}
      </span>
    );
  return (
    <span className={cx(base, "bg-stone-500/90 text-white border border-stone-400/40")}>
      <CircleDashed className={lg ? "size-4.5" : "size-3.5"} aria-hidden />
      {t("not_verified")}
    </span>
  );
}

export function StockPill({ stock, className }: { stock: Stock; className?: string }) {
  const t = useTranslations("stock");
  if (stock.state === "out")
    return <span className={cx("rounded-full bg-sand-100 px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wider text-ink-600", className)}>{t("out")}</span>;
  if (stock.state === "low")
    return <span className={cx("rounded-full bg-terracotta-100 px-2.5 py-0.5 text-[11px] font-medium tracking-wider text-terracotta-800 border border-terracotta-600/20", className)}>{t("low", { n: stock.count })}</span>;
  return <span className={cx("rounded-full bg-peacock-50 px-2.5 py-0.5 text-[11px] font-medium tracking-wider text-peacock-700 border border-peacock-600/20", className)}>{t("in")}</span>;
}

/** Three plain-language checks with a "how we checked" expander; never raw scores (Part 1 §3.3 rule 5). */
export function ProofChecks({ checks, photosOriginal, registry }: { checks: ProofCheck[]; photosOriginal?: boolean | null; registry?: { kind: string; date: string }[] }) {
  const t = useTranslations("proof");
  const icon = (state: ProofCheck["state"]) =>
    state === "passed" ? (
      <span className="flex size-6 items-center justify-center rounded-full bg-peacock-700 text-xs font-bold text-white shadow-xs">✓</span>
    ) : state === "new_maker" ? (
      <span className="flex size-6 items-center justify-center rounded-full bg-gold-100 text-xs font-bold text-gold-600">★</span>
    ) : state === "pending" ? (
      <span className="flex size-6 items-center justify-center rounded-full bg-sand-100 text-xs text-ink-600">…</span>
    ) : (
      <span className="flex size-6 items-center justify-center rounded-full bg-sand-100 text-xs font-bold text-ink-600">–</span>
    );
  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-2.5">
        {checks.map((c) => (
          <li key={c.key} className="flex items-center gap-3">
            {icon(c.state)}
            <span className="text-[14px] text-ink-900 font-medium">{t(`check.${c.key}.${c.state}`)}</span>
          </li>
        ))}
        {photosOriginal && (
          <li className="flex items-center gap-3">
            {icon("passed")}
            <span className="text-[14px] text-ink-900 font-medium">{t("photos_original")}</span>
          </li>
        )}
        {(registry || []).map((r) => (
          <li key={r.kind} className="flex items-center gap-3">
            {icon("passed")}
            <span className="text-[14px] text-ink-900 font-medium">{t(`registry.${r.kind}`, { date: r.date })}</span>
          </li>
        ))}
      </ul>
      <details className="group rounded-[10px] bg-sand-50 border border-sand-100 px-3.5 py-2.5 text-xs text-ink-600">
        <summary className="cursor-pointer font-semibold text-terracotta-800 hover:text-terracotta-900">{t("how_we_checked")}</summary>
        <ul className="mt-2 list-disc space-y-1 ps-5 text-ink-600">
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
    <span className={cx("inline-flex items-center gap-2.5 select-none transition-opacity hover:opacity-90", className)}>
      <span className={cx("flex size-9 items-center justify-center rounded-full border shadow-xs", light ? "border-gold-500/30 bg-white/10 text-gold-500" : "border-sand-200 bg-sand-50 text-terracotta-800")}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" stroke="currentColor" />
        </svg>
      </span>
      <span className="flex flex-col">
        <span className={cx("font-serif text-[22px] font-semibold tracking-[0.06em] leading-none uppercase", light ? "text-white" : "text-ink-950")}>
          Karu
        </span>
        <span className={cx("text-[8.5px] font-semibold tracking-[0.24em] uppercase leading-tight mt-0.5", light ? "text-gold-500/90" : "text-terracotta-700")}>
          Indian Handmade · Proven
        </span>
      </span>
    </span>
  );
}

export function Woven({ className }: { className?: string }) {
  return <div className={cx("woven w-full", className)} aria-hidden />;
}
