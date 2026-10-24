"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Camera, Heart, Home, LayoutGrid, Search, ShieldCheck, ShoppingBag, Store, UserRound } from "lucide-react";
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
        if (q.trim()) router.push(`/search?q=${encodeURIComponent(q.trim())}`);
      }}
    >
      <Search className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-400" aria-hidden />
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        autoFocus={autoFocus}
        placeholder={t("search_placeholder")}
        aria-label={t("search")}
        className="min-h-10 w-full rounded-full border border-sand-200 bg-sand-50/70 ps-9 pe-4 text-xs font-normal text-ink-900 placeholder:text-ink-400 focus:border-terracotta-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-terracotta-700/15 transition-all"
      />
    </form>
  );
}

export function TopBanner() {
  return (
    <div className="bg-terracotta-800 text-sand-50 py-1.5 px-4 text-center text-[10.5px] md:text-[11.5px] font-medium tracking-editorial uppercase transition-all">
      <div className="mx-auto flex max-w-[1360px] items-center justify-center gap-3">
        <span>Direct from Master Indian Artisans</span>
        <span className="hidden sm:inline text-gold-500 opacity-80">•</span>
        <span className="hidden sm:inline">100% Provenance with Karu ID</span>
        <span className="text-gold-500 opacity-80">•</span>
        <span>Free Shipping over ₹999</span>
      </div>
    </div>
  );
}

export function MarketHeader() {
  const t = useTranslations("nav");
  const path = usePathname();
  const { data: me } = useMe();
  const { data: cartCount } = useCartCount(!!me);

  const links = [
    { href: "/categories", label: t("categories") },
    { href: "/c/sarees", label: "Sarees" },
    { href: "/c/pottery-terracotta", label: "Pottery" },
    { href: "/c/metal-brass", label: "Metalcraft" },
    { href: "/verification-explained", label: t("how_verification_works") },
  ];

  return (
    <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-sand-100 shadow-2xs">
      <TopBanner />
      <header className="mx-auto flex h-18 max-w-[1360px] items-center justify-between gap-4 px-4 md:px-8">
        {/* Left: Brand Wordmark */}
        <div className="flex items-center gap-8 shrink-0">
          <Link href="/" aria-label="Karu home">
            <Wordmark />
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden items-center gap-1.5 text-[13px] font-medium tracking-wide text-ink-800 lg:flex">
            {links.map((item) => {
              const active = path === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cx(
                    "rounded-full px-3.5 py-1.5 transition-all",
                    active
                      ? "text-terracotta-800 font-semibold bg-terracotta-50/70"
                      : "hover:text-terracotta-800 hover:bg-sand-50"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Center: Search Box */}
        <div className="hidden flex-1 max-w-xs md:block lg:max-w-sm">
          <SearchBox />
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <LanguageSwitcher signedIn={!!me} className="hidden sm:inline-flex" />

          <Link
            href="/sell"
            className="hidden items-center gap-1.5 rounded-full border border-terracotta-800/20 bg-terracotta-50/60 px-3.5 py-1.5 text-xs font-semibold text-terracotta-800 hover:bg-terracotta-100 transition-all md:inline-flex"
          >
            <Store className="size-3.5 text-terracotta-800" />
            <span>{t("sell")}</span>
          </Link>

          <Link
            href="/account/wishlist"
            className="tap hidden items-center justify-center rounded-full text-ink-700 hover:text-terracotta-800 hover:bg-sand-50 transition-all md:inline-flex"
            aria-label={t("wishlist")}
          >
            <Heart className="size-5" />
          </Link>

          <Link
            href="/cart"
            className="tap relative inline-flex items-center justify-center rounded-full text-ink-800 hover:text-terracotta-800 hover:bg-sand-50 transition-all"
            aria-label={t("cart")}
          >
            <ShoppingBag className="size-5" />
            {cartCount ? (
              <span className="absolute -end-0.5 -top-0.5 flex size-4.5 items-center justify-center rounded-full bg-terracotta-800 text-[10px] font-bold text-white shadow-2xs">
                {cartCount}
              </span>
            ) : null}
          </Link>

          <Link
            href={me ? "/account" : "/login"}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-sand-200 bg-sand-50/60 px-3 text-xs font-medium text-ink-800 hover:bg-sand-100 transition-all"
          >
            <UserRound className="size-3.5 text-ink-600" />
            <span className="hidden sm:inline">{me ? me.display_name?.split(" ")[0] || t("account") : t("login")}</span>
          </Link>
        </div>
      </header>
    </div>
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
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-sand-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden" aria-label={t("main")}>
      <ul className="grid grid-cols-5">
        {items.map(({ href, icon: Icon, label, active }) => (
          <li key={label}>
            <Link
              href={href}
              className={cx(
                "flex min-h-14 flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors",
                active ? "text-terracotta-800 font-semibold" : "text-ink-600 hover:text-ink-900"
              )}
            >
              <Icon className="size-4.5" aria-hidden />
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
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail("");
    }
  };

  return (
    <footer className="mt-20 border-t border-sand-200 bg-[#FAF7F2] pb-24 md:pb-12 text-ink-900">
      <div className="woven" />
      <div className="mx-auto max-w-[1360px] px-6 py-14 lg:py-16">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand info */}
          <div className="flex flex-col gap-4 lg:col-span-2">
            <Wordmark />
            <p className="max-w-sm text-sm leading-relaxed text-ink-600">
              India's verified handmade marketplace. Connecting conscious patrons worldwide directly with master weavers, potters, and sculptors with immutable provenance on every piece.
            </p>
            <div className="pt-2">
              <LanguageSwitcher signedIn={!!me} className="w-fit" />
            </div>
          </div>

          {/* Column: Shop */}
          <FooterCol
            title={t("shop")}
            links={[
              ["/categories", t("all_categories")],
              ["/c/sarees", "Handloom Sarees"],
              ["/c/pottery-terracotta", "Clay & Pottery"],
              ["/c/metal-brass", "Brass & Bell Metal"],
              ["/search?verified=true", t("verified_only")],
              ["/impact", t("impact")],
            ]}
          />

          {/* Column: Karu Guild */}
          <FooterCol
            title={t("karu")}
            links={[
              ["/about", t("about")],
              ["/verification-explained", t("verification")],
              ["/sell", t("sell_on_karu")],
              ["/business", t("business")],
              ["/help", t("help_centre")],
              ["/terms", t("terms")],
              ["/privacy", t("privacy")],
            ]}
          />

          {/* Column: Newsletter */}
          <div className="flex flex-col gap-3">
            <h3 className="font-serif text-sm font-semibold tracking-wider text-ink-950 uppercase">The Karu Journal</h3>
            <p className="text-xs text-ink-600 leading-relaxed">
              Stories from India's living craft clusters, new seasonal drops, and master artisan profiles.
            </p>
            {subscribed ? (
              <p className="rounded-lg bg-peacock-50 border border-peacock-600/20 px-3 py-2 text-xs font-medium text-peacock-700">
                ✓ Welcome to the Karu Circle.
              </p>
            ) : (
              <form onSubmit={handleSubscribe} className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email address"
                  required
                  className="min-h-10 w-full rounded-full border border-sand-200 bg-white px-3.5 text-xs text-ink-900 placeholder:text-ink-400 focus:border-terracotta-700 focus:outline-none"
                />
                <button
                  type="submit"
                  className="flex size-10 shrink-0 items-center justify-center rounded-full bg-terracotta-800 text-white hover:bg-terracotta-900 transition-colors shadow-2xs"
                  aria-label="Subscribe"
                >
                  <ArrowRight className="size-4" />
                </button>
              </form>
            )}
            <div className="pt-2 flex items-center gap-3 text-ink-600">
              <span className="text-[11px] uppercase tracking-wider font-semibold">Follow Us</span>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="p-1 hover:text-terracotta-800 transition-colors" aria-label="Instagram">
                <svg className="size-4 fill-none stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom divider & promise */}
        <div className="mt-12 pt-6 border-t border-sand-200/80 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-ink-500">
          <p className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-peacock-700" />
            <span>{t("promise")}</span>
          </p>
          <p>© {new Date().getFullYear()} Karu Handmade Technologies Pvt Ltd. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="font-serif text-sm font-semibold tracking-wider text-ink-950 uppercase">{title}</h3>
      <ul className="flex flex-col gap-2">
        {links.map(([href, label]) => (
          <li key={href}>
            <Link href={href} className="text-xs text-ink-600 hover:text-terracotta-800 transition-colors">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
