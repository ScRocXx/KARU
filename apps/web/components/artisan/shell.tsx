"use client";

import { useQuery } from "@tanstack/react-query";
import { Bell, CloudOff, Home, Inbox, Package, Plus, RefreshCw, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState, type ReactNode } from "react";
import { Wordmark } from "@/components/karu/badges";
import { LanguageSwitcher } from "@/components/karu/language";
import { ProgressRing } from "@/components/ui";
import { api } from "@/lib/api";
import { cx } from "@/lib/format";
import { useMe, useOnline } from "@/lib/hooks";
import { onOutboxChange, pendingCount, processOutbox, wireOutbox } from "@/lib/offline";

export function ArtisanHeader() {
  const t = useTranslations("sell.nav");
  const { data: me } = useMe();
  const { data: notes } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => api<{ unread: number }>("/me/notifications?limit=1"),
    enabled: !!me,
    refetchInterval: 60_000,
  });
  const { data: dash } = useQuery({
    queryKey: ["sell-dashboard"],
    queryFn: () => api<{ profile_completion: number }>("/artisan/dashboard"),
    enabled: !!me?.has_artisan_profile,
  });
  return (
    <header className="sticky top-0 z-40 border-b border-ink-100 bg-khadi-50/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-3xl items-center gap-2 px-4">
        <Link href="/sell" aria-label="Karu">
          <Wordmark />
        </Link>
        <span className="rounded-full bg-indigo-900 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white">{t("badge")}</span>
        <div className="ms-auto flex items-center gap-1">
          <LanguageSwitcher signedIn={!!me} />
          {me?.has_artisan_profile && (
            <>
              <Link href="/sell/notifications" className="tap relative inline-flex items-center justify-center rounded-full hover:bg-indigo-50" aria-label={t("notifications")}>
                <Bell className="size-6" />
                {notes?.unread ? <span className="absolute end-2 top-2 size-2.5 rounded-full bg-terracotta-600" /> : null}
              </Link>
              <Link href="/sell/passport" aria-label={t("me")} className="tap inline-flex items-center justify-center">
                <ProgressRing value={dash?.profile_completion ?? 100} size={40}>
                  <UserRound className="size-5 text-indigo-900" />
                </ProgressRing>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

/** Artisan bottom navigation: Home · Orders · + (New) · Requests · Me. */
export function ArtisanBottomNav() {
  const t = useTranslations("sell.nav");
  const path = usePathname();
  const { data: me } = useMe();
  if (path.startsWith("/sell/start") || !me?.has_artisan_profile) return null;
  const items = [
    { href: "/sell", icon: Home, label: t("home"), active: path === "/sell" },
    { href: "/sell/orders", icon: Package, label: t("orders"), active: path.startsWith("/sell/orders") },
    null,
    { href: "/sell/requests", icon: Inbox, label: t("requests"), active: path.startsWith("/sell/requests") },
    { href: "/sell/passport", icon: UserRound, label: t("me"), active: ["/sell/passport", "/sell/settings", "/sell/payouts", "/sell/help"].some((p) => path.startsWith(p)) },
  ];
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-100 bg-white pb-[env(safe-area-inset-bottom)]" aria-label={t("main")}>
      <ul className="mx-auto grid max-w-3xl grid-cols-5 items-end">
        {items.map((it, i) =>
          it === null ? (
            <li key="new" className="flex justify-center">
              <Link href="/sell/new" className="-mt-7 flex size-16 items-center justify-center rounded-full bg-indigo-900 text-white shadow-lg ring-4 ring-khadi-50 hover:bg-indigo-700" aria-label={t("new")}>
                <Plus className="size-8" />
              </Link>
            </li>
          ) : (
            <li key={i}>
              <Link href={it.href} className={cx("flex min-h-16 flex-col items-center justify-center gap-0.5 text-xs font-semibold", it.active ? "text-indigo-900" : "text-ink-600")}>
                <it.icon className="size-6" aria-hidden />
                {it.label}
              </Link>
            </li>
          ),
        )}
      </ul>
    </nav>
  );
}

/** UploadQueueBanner: offline / uploading N items / failed with retry (Part 1 §9.6). */
export function UploadQueueBanner() {
  const t = useTranslations("sell.queue");
  const online = useOnline();
  const [counts, setCounts] = useState({ pending: 0, failed: 0 });
  useEffect(() => {
    wireOutbox();
    const refresh = () => void pendingCount().then(setCounts);
    refresh();
    const off = onOutboxChange(refresh);
    const id = setInterval(refresh, 5000);
    return () => {
      off();
      clearInterval(id);
    };
  }, []);
  if (online && !counts.pending && !counts.failed) return null;
  return (
    <div className={cx("mx-auto mt-3 flex max-w-3xl items-center gap-3 rounded-[12px] px-4 py-3 text-[15px] font-medium", online ? "bg-indigo-50 text-indigo-900" : "bg-haldi-100 text-ink-900")} role="status">
      {online ? <RefreshCw className={cx("size-5", counts.pending > 0 && "animate-spin")} /> : <CloudOff className="size-5" />}
      <span className="flex-1">
        {!online ? t("offline", { n: counts.pending + counts.failed }) : counts.pending ? t("uploading", { n: counts.pending }) : t("failed", { n: counts.failed })}
      </span>
      {online && counts.failed > 0 && (
        <button className="font-semibold underline" onClick={() => void processOutbox()}>
          {t("retry")}
        </button>
      )}
    </div>
  );
}

export function SellPage({ children, title, back }: { children: ReactNode; title?: ReactNode; back?: string }) {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5 px-4 pb-28 pt-4">
      {title && (
        <div className="flex items-center gap-2">
          {back && (
            <Link href={back} className="tap -ms-3 inline-flex items-center justify-center rounded-full text-2xl hover:bg-indigo-50" aria-label="Back">
              <span className="flip-rtl">←</span>
            </Link>
          )}
          <h1 className="font-display text-[26px] leading-tight">{title}</h1>
        </div>
      )}
      {children}
    </div>
  );
}
