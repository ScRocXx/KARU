"use client";

import { useQuery } from "@tanstack/react-query";
import { Heart, Home, LayoutGrid, Search, ShoppingBag, Store, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Wordmark } from "@/components/karu/badges";
import { LanguageSwitcher } from "@/components/karu/language";
import { api } from "@/lib/api";
import { cx } from "@/lib/format";
import { useMe } from "@/lib/hooks";

function useCartCount(enabled: boolean) {
  return useQuery({
    queryKey: ["cart"],
    queryFn: () => api<{ count: number }>("/cart/items"),
    enabled,
    select: (d) => d.count,
  });
}

export function SearchBox({ autoFocus, initial = "", className }: { autoFocus?: boolean; initial?: string; className?: string }) {
  const t = useTranslations("nav");
  const router = useRouter();
  const [q, setQ] = useState(initial);
  return (
    <form
      role="search"
      className={cx("relative", className)}
      onSubmit={(e) => {
        e.preventDefault();
        router.push(`/search?q=${encodeURIComponent(q.trim())}`);
      }}
    >
      <Search className="pointer-events-none absolute start-3 top-1/2 size-5 -translate-y-1/2 text-ink-600" aria-hidden />
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        autoFocus={autoFocus}
        placeholder={t("search_placeholder")}
        aria-label={t("search")}
        className="min-h-11 w-full rounded-full border border-ink-300 bg-white ps-10 pe-4 text-[15px] focus:border-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-900/20"
      />
    </form>
  );
}

export function MarketHeader() {
  const t = useTranslations("nav");
  const { data: me } = useMe();
  const { data: cartCount } = useCartCount(!!me);
  return (
    <header className="sticky top-0 z-40 border-b border-ink-100 bg-khadi-50/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1280px] items-center gap-4 px-4">
        <Link href="/" aria-label="Karu home">
          <Wordmark />
        </Link>
        <nav className="hidden items-center gap-1 text-[15px] font-medium text-ink-900 lg:flex">
          <Link href="/categories" className="rounded-full px-3 py-2 hover:bg-indigo-50">
            {t("categories")}
          </Link>
          <Link href="/categories#crafts" className="rounded-full px-3 py-2 hover:bg-indigo-50">
            {t("crafts")}
          </Link>
          <Link href="/verification-explained" className="rounded-full px-3 py-2 hover:bg-indigo-50">
            {t("how_verification_works")}
          </Link>
        </nav>
        <SearchBox className="hidden flex-1 md:block" />
        <div className="ms-auto flex items-center gap-1 md:ms-0">
          <LanguageSwitcher signedIn={!!me} className="hidden sm:inline-flex" />
          <Link href="/sell" className="hidden min-h-10 items-center gap-1.5 rounded-full px-3 text-[15px] font-semibold text-indigo-900 hover:bg-indigo-50 md:inline-flex">
            <Store className="size-5" /> {t("sell")}
          </Link>
          <Link href="/account/wishlist" className="tap hidden items-center justify-center rounded-full hover:bg-indigo-50 md:inline-flex" aria-label={t("wishlist")}>
            <Heart className="size-5" />
          </Link>
          <Link href="/cart" className="tap relative inline-flex items-center justify-center rounded-full hover:bg-indigo-50" aria-label={t("cart")}>
            <ShoppingBag className="size-5" />
            {cartCount ? (
              <span className="absolute end-1 top-1 min-w-5 rounded-full bg-terracotta-600 px-1 text-center text-xs font-bold text-white">{cartCount}</span>
            ) : null}
          </Link>
          <Link
            href={me ? "/account" : "/login"}
            className="hidden min-h-10 items-center gap-1.5 rounded-full px-3 text-[15px] font-semibold hover:bg-indigo-50 md:inline-flex"
          >
            <UserRound className="size-5" /> {me ? me.display_name?.split(" ")[0] || t("account") : t("login")}
          </Link>
        </div>
      </div>
    </header>
  );
}

/** Buyer bottom navigation (mobile): Home · Categories · Search · Wishlist · Account. */
export function MarketBottomNav() {
  const t = useTranslations("nav");
  const path = usePathname();
  const { data: me } = useMe();
  const items = [
    { href: "/", icon: Home, label: t("home"), active: path === "/" },
    { href: "/categories", icon: LayoutGrid, label: t("categories"), active: path.startsWith("/c") || path === "/categories" },
    { href: "/search", icon: Search, label: t("search"), active: path.startsWith("/search") },
    { href: "/account/wishlist", icon: Heart, label: t("wishlist"), active: path.startsWith("/account/wishlist") },
    { href: me ? "/account" : "/login", icon: UserRound, label: t("account"), active: path.startsWith("/account") && !path.startsWith("/account/wishlist") },
  ];
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-100 bg-white pb-[env(safe-area-inset-bottom)] md:hidden" aria-label={t("main")}>
      <ul className="grid grid-cols-5">
        {items.map(({ href, icon: Icon, label, active }) => (
          <li key={label}>
            <Link href={href} className={cx("flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold", active ? "text-indigo-900" : "text-ink-600")}>
              <Icon className="size-5" aria-hidden />
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function MarketFooter() {
  const t = useTranslations("footer");
  const { data: me } = useMe();
  return (
    <footer className="mt-16 border-t border-ink-100 bg-white pb-24 md:pb-8">
      <div className="woven" />
      <div className="mx-auto grid max-w-[1280px] gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-3">
          <Wordmark />
          <p className="max-w-xs text-sm text-ink-600">{t("tagline")}</p>
          <LanguageSwitcher signedIn={!!me} className="w-fit" />
        </div>
        <FooterCol title={t("shop")} links={[["/categories", t("all_categories")], ["/search?verified=true", t("verified_only")], ["/impact", t("impact")]]} />
        <FooterCol
          title={t("karu")}
          links={[["/about", t("about")], ["/verification-explained", t("verification")], ["/sell", t("sell_on_karu")], ["/business", t("business")]]}
        />
        <FooterCol title={t("help")} links={[["/help", t("help_centre")], ["/terms", t("terms")], ["/privacy", t("privacy")]]} />
      </div>
      <p className="mx-auto max-w-[1280px] px-4 text-xs text-ink-600">{t("promise")}</p>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-ink-600">{title}</h3>
      <ul className="flex flex-col gap-2">
        {links.map(([href, label]) => (
          <li key={href}>
            <Link href={href} className="text-[15px] text-ink-900 hover:text-indigo-900 hover:underline">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
