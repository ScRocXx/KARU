"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Bell,
  CloudOff,
  Coins,
  HeartHandshake,
  HelpCircle,
  Home,
  Inbox,
  Package,
  Plus,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState, type ReactNode } from "react";
import { Wordmark } from "@/components/karu/badges";
import { LanguageSwitcher } from "@/components/karu/language";
import { Button } from "@/components/ui/button";
import { ProgressRing } from "@/components/ui/progress-ring";
import { api } from "@/lib/api";
import { cx } from "@/lib/format";
import { useMe, useOnline } from "@/lib/hooks";
import { onOutboxChange, pendingCount, processOutbox, wireOutbox } from "@/lib/offline";

/** Artisan desktop 248px sidebar + top bar, with mobile header & FAB (spec §6.4 & §7.2). */
export function ArtisanShell({ children }: { children: ReactNode }) {
  const t = useTranslations("sell.nav");
  const path = usePathname();
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

  const isStart = path.startsWith("/sell/start");
  if (isStart) {
    return (
      <div className="min-h-dvh bg-surface-alt">
        <header className="border-b border-line bg-surface py-3.5 px-4">
          <div className="mx-auto flex max-w-5xl items-center justify-between">
            <Link href="/" aria-label="Karu Home">
              <Wordmark />
            </Link>
            <LanguageSwitcher signedIn={!!me} />
          </div>
        </header>
        <main>{children}</main>
      </div>
    );
  }

  const navItems = [
    { href: "/sell", icon: Home, label: t("home") || "Home", exact: true },
    { href: "/sell/products", icon: Package, label: "Products" },
    { href: "/sell/orders", icon: Package, label: t("orders") || "Orders" },
    { href: "/sell/requests", icon: Inbox, label: t("requests") || "Custom Requests" },
    { href: "/sell/payouts", icon: Coins, label: "Payouts" },
    { href: "/sell/passport", icon: ShieldCheck, label: t("me") || "Passport" },
    { href: "/sell/help", icon: HelpCircle, label: "Help & Academy" },
    { href: "/sell/settings", icon: Settings, label: "Settings" },
  ];

  return (
    <div className="min-h-dvh bg-surface-alt flex flex-col lg:flex-row">
      {/* 1. Desktop Sidebar (248px, visible on lg+) */}
      <aside className="hidden lg:flex flex-col w-[248px] shrink-0 border-e border-line bg-surface min-h-dvh sticky top-0 h-dvh justify-between p-4 z-30">
        <div className="flex flex-col gap-6">
          {/* Logo & Studio Tag */}
          <div className="flex items-center gap-2.5 px-2 pt-2">
            <Link href="/" aria-label="Karu">
              <Wordmark />
            </Link>
            <span className="rounded-full bg-brand px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
              STUDIO
            </span>
          </div>

          {/* New Product Action Button */}
          <Link href="/sell/new">
            <Button variant="primary" size="L" block icon={<Plus className="size-5" />}>
              + New Product
            </Button>
          </Link>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1">
            {navItems.map((it) => {
              const active = it.exact ? path === it.href : path.startsWith(it.href);
              return (
                <Link
                  key={it.href}
                  href={it.href}
                  className={cx(
                    "flex items-center gap-3 rounded-xs px-3 py-2.5 text-body-s font-medium transition-colors",
                    active
                      ? "bg-surface-alt text-brand font-semibold border-s-2 border-brand"
                      : "text-ink-800 hover:bg-surface-alt hover:text-ink-900"
                  )}
                >
                  <it.icon className={cx("size-4.5", active ? "text-brand" : "text-muted")} />
                  <span>{it.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Profile Summary */}
        <div className="border-t border-line pt-3 flex items-center justify-between px-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <ProgressRing value={dash?.profile_completion ?? 100} size={36}>
              <UserRound className="size-4 text-brand" />
            </ProgressRing>
            <div className="min-w-0">
              <p className="font-medium text-body-s text-ink-900 truncate">
                {me?.display_name || "Master Artisan"}
              </p>
              <p className="text-[11px] text-muted truncate">
                {dash?.profile_completion ?? 100}% completed
              </p>
            </div>
          </div>
          <LanguageSwitcher signedIn={!!me} />
        </div>
      </aside>

      {/* 2. Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Desktop Top Bar (64px, visible on lg+) */}
        <header className="hidden lg:flex h-16 shrink-0 items-center justify-between border-b border-line bg-surface/95 px-8 backdrop-blur sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <span className="font-serif text-lg font-medium text-ink-900">
              Artisan Workshop Studio
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/sell/notifications"
              className="relative p-2 text-ink-800 hover:text-brand transition-colors rounded-full hover:bg-surface-alt"
              aria-label={t("notifications") || "Notifications"}
            >
              <Bell className="size-5" />
              {notes?.unread ? (
                <span className="absolute top-1.5 end-1.5 size-2 rounded-full bg-brand" />
              ) : null}
            </Link>

            <Link href="/" target="_blank" className="text-caption text-muted hover:text-brand">
              View Public Shop ↗
            </Link>
          </div>
        </header>

        {/* Mobile Header (< lg) */}
        <header className="sticky top-0 z-40 border-b border-line bg-surface/95 backdrop-blur lg:hidden">
          <div className="mx-auto flex h-16 items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <Link href="/sell" aria-label="Karu">
                <Wordmark />
              </Link>
              <span className="rounded-full bg-brand px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                STUDIO
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <LanguageSwitcher signedIn={!!me} />
              {me?.has_artisan_profile && (
                <>
                  <Link
                    href="/sell/notifications"
                    className="tap relative inline-flex items-center justify-center p-2 rounded-full hover:bg-surface-alt"
                    aria-label={t("notifications")}
                  >
                    <Bell className="size-5.5 text-ink-900" />
                    {notes?.unread ? (
                      <span className="absolute end-1.5 top-1.5 size-2 rounded-full bg-brand" />
                    ) : null}
                  </Link>
                  <Link href="/sell/passport" aria-label={t("me")} className="tap inline-flex items-center justify-center">
                    <ProgressRing value={dash?.profile_completion ?? 100} size={36}>
                      <UserRound className="size-4.5 text-brand" />
                    </ProgressRing>
                  </Link>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Queue Banner */}
        <div className="px-4 lg:px-8">
          <UploadQueueBanner />
        </div>

        {/* Page Content */}
        <main className="flex-1 pb-24 lg:pb-12">
          {children}
        </main>

        {/* Mobile Bottom Navigation with Centre 64px FAB (< lg) */}
        <nav
          className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden"
          aria-label={t("main")}
        >
          <ul className="mx-auto grid max-w-lg grid-cols-5 items-end">
            <li>
              <Link
                href="/sell"
                className={cx(
                  "flex min-h-15 flex-col items-center justify-center gap-0.5 text-caption font-semibold",
                  path === "/sell" ? "text-brand" : "text-muted"
                )}
              >
                <Home className="size-5.5" />
                <span>{t("home") || "Home"}</span>
              </Link>
            </li>
            <li>
              <Link
                href="/sell/orders"
                className={cx(
                  "flex min-h-15 flex-col items-center justify-center gap-0.5 text-caption font-semibold",
                  path.startsWith("/sell/orders") ? "text-brand" : "text-muted"
                )}
              >
                <Package className="size-5.5" />
                <span>{t("orders") || "Orders"}</span>
              </Link>
            </li>
            <li className="flex justify-center">
              <Link
                href="/sell/new"
                className="-mt-6 flex size-15 items-center justify-center rounded-full bg-brand text-white shadow-lift ring-4 ring-surface hover:bg-brand-hover transition-transform active:scale-95"
                aria-label={t("new") || "New Product"}
              >
                <Plus className="size-7" />
              </Link>
            </li>
            <li>
              <Link
                href="/sell/requests"
                className={cx(
                  "flex min-h-15 flex-col items-center justify-center gap-0.5 text-caption font-semibold",
                  path.startsWith("/sell/requests") ? "text-brand" : "text-muted"
                )}
              >
                <Inbox className="size-5.5" />
                <span>{t("requests") || "Requests"}</span>
              </Link>
            </li>
            <li>
              <Link
                href="/sell/passport"
                className={cx(
                  "flex min-h-15 flex-col items-center justify-center gap-0.5 text-caption font-semibold",
                  ["/sell/passport", "/sell/settings", "/sell/payouts", "/sell/help"].some((p) => path.startsWith(p))
                    ? "text-brand"
                    : "text-muted"
                )}
              >
                <UserRound className="size-5.5" />
                <span>{t("me") || "Passport"}</span>
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
}

export function ArtisanHeader() {
  return null; // Integrated into ArtisanShell
}

export function ArtisanBottomNav() {
  return null; // Integrated into ArtisanShell
}

/** UploadQueueBanner: offline / uploading N items / failed with retry. */
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
    <div
      className={cx(
        "my-3 flex items-center gap-3 rounded-xs border px-4 py-3 text-body-s font-medium",
        online
          ? "border-brand/20 bg-brand-soft text-brand"
          : "border-gold-300 bg-gold-50 text-gold-900"
      )}
      role="status"
    >
      {online ? (
        <RefreshCw className={cx("size-4.5", counts.pending > 0 && "animate-spin")} />
      ) : (
        <CloudOff className="size-4.5" />
      )}
      <span className="flex-1">
        {!online
          ? t("offline", { n: counts.pending + counts.failed }) || "Offline. Drafts saved locally."
          : counts.pending
          ? t("uploading", { n: counts.pending }) || `Syncing ${counts.pending} items...`
          : t("failed", { n: counts.failed }) || "Upload failed. Tap to retry."}
      </span>
      {online && counts.failed > 0 && (
        <button
          type="button"
          className="font-semibold underline underline-offset-4 hover:text-brand"
          onClick={() => void processOutbox()}
        >
          {t("retry") || "Retry"}
        </button>
      )}
    </div>
  );
}

export function SellPage({
  children,
  title,
  back,
}: {
  children: ReactNode;
  title?: ReactNode;
  back?: string;
}) {
  return (
    <div className="mx-auto max-w-6xl px-4 lg:px-8 py-6">
      {title && (
        <div className="flex items-center gap-3 mb-6">
          {back && (
            <Link
              href={back}
              className="tap -ms-2 inline-flex items-center justify-center p-2 rounded-full hover:bg-surface-alt transition-colors"
              aria-label="Back"
            >
              <span className="flip-rtl text-lg">←</span>
            </Link>
          )}
          <h1 className="font-serif text-h2 text-ink-900">{title}</h1>
        </div>
      )}
      {children}
    </div>
  );
}
