"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  ChevronDown,
  Globe,
  Heart,
  Home,
  LayoutGrid,
  Menu,
  QrCode,
  Search,
  ShieldCheck,
  ShoppingBag,
  Store,
  UserRound,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { Wordmark } from "@/components/karu/badges";
import { DeckleEdge, Emblem } from "@/components/karu/ornaments";
import { LanguageSwitcher } from "@/components/karu/language";
import { Drawer } from "@/components/ui/drawer";
import { IconButton } from "@/components/ui/icon-button";
import { Popover } from "@/components/ui/popover";
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

/** 5.1 AnnouncementBar: 36px terracotta bar, i18n rotating messages, utility links. */
export function AnnouncementBar() {
  const t = useTranslations("nav");
  const [activeMsg, setActiveMsg] = useState(1);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => {
      setActiveMsg((prev) => (prev % 3) + 1);
    }, 5000);
    return () => clearInterval(timer);
  }, [paused]);

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className="bg-brand text-on-dark min-h-[36px] px-4 sm:px-6 lg:px-10 text-caption font-medium transition-all flex items-center justify-between border-b border-terracotta-900/30"
    >
      {/* Desktop Messages: all three with gold bullets */}
      <div className="hidden lg:flex items-center gap-3 mx-auto">
        <span>{t("announce.1")}</span>
        <span className="text-gold-300">•</span>
        <span>{t("announce.2")}</span>
        <span className="text-gold-300">•</span>
        <span>{t("announce.3")}</span>
      </div>

      {/* Mobile / Tablet Message: single rotating message */}
      <div className="lg:hidden mx-auto text-center py-1.5 transition-opacity">
        <span>{t(`announce.${activeMsg}` as any)}</span>
      </div>

      {/* Desktop Utility Links (End Side) */}
      <div className="hidden lg:flex items-center gap-4 text-caption shrink-0">
        <Link
          href="/sell"
          className="hover:text-gold-200 transition-colors flex items-center gap-1 font-semibold"
        >
          <Store className="size-3.5" />
          <span>{t("sell")}</span>
        </Link>
        <span className="text-white/20">|</span>
        <Link
          href="/account/orders"
          className="hover:text-gold-200 transition-colors"
        >
          {t("track_order")}
        </Link>
      </div>
    </div>
  );
}

/** 5.2 MarketHeader: 80px desktop header (shrinking to 64px), centered wordmark, mega menus. */
export function MarketHeader() {
  const t = useTranslations("nav");
  const path = usePathname();
  const { data: me } = useMe();
  const { data: cartCount } = useCartCount(!!me);
  const [scrolled, setScrolled] = useState(false);
  const [activeMega, setActiveMega] = useState<"shop" | "crafts" | "regions" | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const megaTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleMouseEnter = (menu: "shop" | "crafts" | "regions") => {
    if (megaTimeoutRef.current) clearTimeout(megaTimeoutRef.current);
    megaTimeoutRef.current = setTimeout(() => setActiveMega(menu), 120);
  };

  const handleMouseLeave = () => {
    if (megaTimeoutRef.current) clearTimeout(megaTimeoutRef.current);
    megaTimeoutRef.current = setTimeout(() => setActiveMega(null), 180);
  };

  return (
    <>
      <AnnouncementBar />
      <header
        className={cx(
          "sticky top-0 z-40 w-full border-b border-line bg-bg/95 backdrop-blur-md transition-all duration-200",
          scrolled ? "h-16 shadow-2xs" : "h-20"
        )}
      >
        <div className="mx-auto flex h-full max-w-[1360px] items-center justify-between px-4 sm:px-6 lg:px-10">
          {/* Mobile Start: Menu Drawer Button */}
          <div className="flex lg:hidden items-center gap-2">
            <IconButton
              aria-label="Open menu"
              onClick={() => setDrawerOpen(true)}
              className="text-text"
            >
              <Menu className="size-5" />
            </IconButton>
            <IconButton
              aria-label={t("search")}
              onClick={() => setSearchOpen(true)}
              className="text-text"
            >
              <Search className="size-5" />
            </IconButton>
          </div>

          {/* Desktop Start Zone: Mega Menu Nav Links (5 cols) */}
          <nav className="hidden lg:flex flex-1 items-center gap-7">
            <div
              className="relative"
              onMouseEnter={() => handleMouseEnter("shop")}
              onMouseLeave={handleMouseLeave}
            >
              <button
                type="button"
                className={cx(
                  "inline-flex items-center gap-1 text-eyebrow text-text hover:text-brand transition-colors py-2 cursor-pointer",
                  activeMega === "shop" && "text-brand"
                )}
                aria-expanded={activeMega === "shop"}
              >
                <span>{t("shop")}</span>
                <ChevronDown className="size-3.5 opacity-60" />
              </button>
            </div>

            <div
              className="relative"
              onMouseEnter={() => handleMouseEnter("crafts")}
              onMouseLeave={handleMouseLeave}
            >
              <button
                type="button"
                className={cx(
                  "inline-flex items-center gap-1 text-eyebrow text-text hover:text-brand transition-colors py-2 cursor-pointer",
                  activeMega === "crafts" && "text-brand"
                )}
                aria-expanded={activeMega === "crafts"}
              >
                <span>{t("crafts")}</span>
                <ChevronDown className="size-3.5 opacity-60" />
              </button>
            </div>

            <div
              className="relative"
              onMouseEnter={() => handleMouseEnter("regions")}
              onMouseLeave={handleMouseLeave}
            >
              <button
                type="button"
                className={cx(
                  "inline-flex items-center gap-1 text-eyebrow text-text hover:text-brand transition-colors py-2 cursor-pointer",
                  activeMega === "regions" && "text-brand"
                )}
                aria-expanded={activeMega === "regions"}
              >
                <span>{t("regions")}</span>
                <ChevronDown className="size-3.5 opacity-60" />
              </button>
            </div>

            <Link
              href="/categories#crafts"
              className={cx(
                "text-eyebrow text-text hover:text-brand transition-colors py-2",
                path === "/makers" && "text-brand font-semibold"
              )}
            >
              {t("makers")}
            </Link>
          </nav>

          {/* Center Zone: Centered Karu Wordmark (2 cols) */}
          <div className="flex shrink-0 items-center justify-center">
            <Wordmark
              layout="centered"
              showTagline={!scrolled}
              className="transition-all"
            />
          </div>

          {/* Desktop End Zone: Action Buttons (5 cols) */}
          <div className="flex flex-1 items-center justify-end gap-1.5 sm:gap-2">
            <IconButton
              aria-label={t("search")}
              onClick={() => setSearchOpen(true)}
              className="hidden lg:inline-flex text-text"
            >
              <Search className="size-5" />
            </IconButton>

            <Link
              href="/account/wishlist"
              className="hidden sm:inline-flex"
              aria-label={t("wishlist")}
            >
              <IconButton aria-label={t("wishlist")} className="text-text">
                <Heart className="size-5" />
              </IconButton>
            </Link>

            <Link
              href={me ? "/account" : "/login"}
              aria-label={me ? t("account") : t("login")}
            >
              <IconButton aria-label={me ? t("account") : t("login")} className="text-text">
                {me ? (
                  <span className="flex size-7 items-center justify-center rounded-full bg-brand-soft text-caption font-bold text-brand">
                    {me.display_name?.[0]?.toUpperCase() || "K"}
                  </span>
                ) : (
                  <UserRound className="size-5" />
                )}
              </IconButton>
            </Link>

            <Link href="/cart" aria-label={t("cart")}>
              <button
                type="button"
                className="relative inline-flex size-11 items-center justify-center rounded-full text-text hover:text-brand transition-colors cursor-pointer"
                aria-label={t("cart")}
              >
                <ShoppingBag className="size-5" />
                {typeof cartCount === "number" && cartCount > 0 && (
                  <span className="absolute end-1.5 top-1.5 flex min-w-4.5 h-4.5 items-center justify-center rounded-full bg-brand px-1 text-[10.5px] font-bold text-white tabular-nums shadow-xs">
                    {cartCount}
                  </span>
                )}
              </button>
            </Link>
          </div>
        </div>

        {/* Mega Menus Panel */}
        {activeMega && (
          <div
            onMouseEnter={() => {
              if (megaTimeoutRef.current) clearTimeout(megaTimeoutRef.current);
            }}
            onMouseLeave={handleMouseLeave}
            className="absolute start-0 top-full w-full border-b border-line bg-surface shadow-pop animate-in fade-in slide-in-from-top-2 duration-150"
          >
            <div className="mx-auto max-w-[1360px] p-8 sm:px-10">
              {activeMega === "shop" && (
                <div className="grid grid-cols-4 gap-8">
                  <div>
                    <h3 className="text-eyebrow text-muted mb-3">Wear & Drape</h3>
                    <ul className="flex flex-col gap-2.5 text-body-s">
                      <li>
                        <Link href="/c/sarees" className="hover:text-brand transition-colors">
                          Handloom Sarees (Banarasi, Tussar)
                        </Link>
                      </li>
                      <li>
                        <Link href="/c/dupattas-stoles" className="hover:text-brand transition-colors">
                          Dupattas & Stoles
                        </Link>
                      </li>
                      <li>
                        <Link href="/c/kurtas-fabric" className="hover:text-brand transition-colors">
                          Kurtas & Handwoven Fabrics
                        </Link>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-eyebrow text-muted mb-3">Living & Earth</h3>
                    <ul className="flex flex-col gap-2.5 text-body-s">
                      <li>
                        <Link href="/c/pottery-terracotta" className="hover:text-brand transition-colors">
                          Khurja Pottery & Terracotta
                        </Link>
                      </li>
                      <li>
                        <Link href="/c/home-textiles" className="hover:text-brand transition-colors">
                          Home Textiles & Throws
                        </Link>
                      </li>
                      <li>
                        <Link href="/c/woodcraft" className="hover:text-brand transition-colors">
                          Carved Sheesham & Woodcraft
                        </Link>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-eyebrow text-muted mb-3">Art & Adornment</h3>
                    <ul className="flex flex-col gap-2.5 text-body-s">
                      <li>
                        <Link href="/c/metal-brass" className="hover:text-brand transition-colors">
                          Dhokra & Lost-Wax Bell Metal
                        </Link>
                      </li>
                      <li>
                        <Link href="/c/paintings" className="hover:text-brand transition-colors">
                          Madhubani & Heritage Art
                        </Link>
                      </li>
                      <li>
                        <Link href="/c/jewellery" className="hover:text-brand transition-colors">
                          Traditional Metal Jewellery
                        </Link>
                      </li>
                    </ul>
                  </div>
                  <div className="rounded-sm border border-line bg-surface-alt p-5 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-widest text-brand">
                        The Karu Edit
                      </span>
                      <h4 className="font-serif text-lg font-medium text-text mt-1">
                        Festive & Wedding Trousseau
                      </h4>
                      <p className="text-caption text-muted mt-1 leading-relaxed">
                        Curated silk weaves and hand-chiseled brass from master state awardees.
                      </p>
                    </div>
                    <Link
                      href="/search?verified=true"
                      className="mt-4 inline-flex items-center gap-1 text-caption font-semibold text-brand hover:underline"
                    >
                      Explore Collection →
                    </Link>
                  </div>
                </div>
              )}

              {activeMega === "crafts" && (
                <div className="grid grid-cols-4 gap-8">
                  <div>
                    <h3 className="text-eyebrow text-muted mb-3">Silk & Weaving</h3>
                    <ul className="flex flex-col gap-2.5 text-body-s">
                      <li>
                        <Link href="/craft/bhagalpuri-silk" className="hover:text-brand transition-colors">
                          Bhagalpuri Tussar (Bihar)
                        </Link>
                      </li>
                      <li>
                        <Link href="/craft/banarasi" className="hover:text-brand transition-colors">
                          Banarasi Brocade (Varanasi, UP)
                        </Link>
                      </li>
                      <li>
                        <Link href="/craft/chanderi" className="hover:text-brand transition-colors">
                          Chanderi Weaves (MP)
                        </Link>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-eyebrow text-muted mb-3">Earth, Metal & Fire</h3>
                    <ul className="flex flex-col gap-2.5 text-body-s">
                      <li>
                        <Link href="/craft/khurja-pottery" className="hover:text-brand transition-colors">
                          Khurja Pottery (UP)
                        </Link>
                      </li>
                      <li>
                        <Link href="/craft/dhokra-metal" className="hover:text-brand transition-colors">
                          Bastar Dhokra Casting (CG)
                        </Link>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-eyebrow text-muted mb-3">Folk Paintings & Prints</h3>
                    <ul className="flex flex-col gap-2.5 text-body-s">
                      <li>
                        <Link href="/craft/madhubani-painting" className="hover:text-brand transition-colors">
                          Mithila Madhubani (Bihar)
                        </Link>
                      </li>
                      <li>
                        <Link href="/craft/kutch-embroidery" className="hover:text-brand transition-colors">
                          Kutch Mirrorwork (Gujarat)
                        </Link>
                      </li>
                    </ul>
                  </div>
                  <div className="flex flex-col justify-center border-s border-line ps-8">
                    <p className="font-serif text-lg text-text">
                      100% GI-Protected Lineages
                    </p>
                    <p className="text-body-s text-muted mt-1">
                      Every craft verified against genuine geographical indications.
                    </p>
                    <Link
                      href="/categories"
                      className="mt-4 text-eyebrow text-brand hover:underline"
                    >
                      All Crafts Directory →
                    </Link>
                  </div>
                </div>
              )}

              {activeMega === "regions" && (
                <div className="grid grid-cols-4 gap-8">
                  <div>
                    <h3 className="text-eyebrow text-muted mb-3">Northern & Central</h3>
                    <ul className="flex flex-col gap-2 text-body-s">
                      <li><Link href="/search?state=Uttar%20Pradesh" className="hover:text-brand">Uttar Pradesh (Khurja, Varanasi)</Link></li>
                      <li><Link href="/search?state=Madhya%20Pradesh" className="hover:text-brand">Madhya Pradesh (Chanderi)</Link></li>
                      <li><Link href="/search?state=Rajasthan" className="hover:text-brand">Rajasthan (Bagru, Sanganer)</Link></li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-eyebrow text-muted mb-3">Eastern & Bihar</h3>
                    <ul className="flex flex-col gap-2 text-body-s">
                      <li><Link href="/search?state=Bihar" className="hover:text-brand">Bihar (Bhagalpur, Madhubani)</Link></li>
                      <li><Link href="/search?state=West%20Bengal" className="hover:text-brand">West Bengal (Bankura, Shantiniketan)</Link></li>
                      <li><Link href="/search?state=Chhattisgarh" className="hover:text-brand">Chhattisgarh (Bastar)</Link></li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-eyebrow text-muted mb-3">Western & Southern</h3>
                    <ul className="flex flex-col gap-2 text-body-s">
                      <li><Link href="/search?state=Gujarat" className="hover:text-brand">Gujarat (Kutch, Bhujodi)</Link></li>
                      <li><Link href="/search?state=Karnataka" className="hover:text-brand">Karnataka (Channapatna)</Link></li>
                      <li><Link href="/search?state=Tamil%20Nadu" className="hover:text-brand">Tamil Nadu (Kanchipuram)</Link></li>
                    </ul>
                  </div>
                  <div className="flex flex-col justify-center border-s border-line ps-8">
                    <p className="font-serif text-lg text-text">Direct from Clusters</p>
                    <p className="text-body-s text-muted mt-1">
                      Pieces ship directly from village clusters without middlemen warehousing.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* 5.3 SearchOverlay: Full desktop panel below header or fullscreen on mobile */}
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Mobile NavDrawer */}
      <NavDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}

/** 5.3 SearchOverlay: Editorial search experience. */
export function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useTranslations("nav");
  const router = useRouter();
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  if (!open) return null;

  const popularCrafts = [
    { label: "Banarasi Sarees", query: "sarees" },
    { label: "Bhagalpuri Tussar", query: "bhagalpuri" },
    { label: "Khurja Pottery", query: "pottery" },
    { label: "Dhokra Bell Metal", query: "metal" },
    { label: "Madhubani Art", query: "madhubani" },
  ];

  const handleSearch = (queryStr: string) => {
    if (!queryStr.trim()) return;
    onClose();
    router.push(`/search?q=${encodeURIComponent(queryStr.trim())}`);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex flex-col bg-bg/98 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="mx-auto flex h-20 w-full max-w-[1360px] items-center justify-between px-4 sm:px-6 lg:px-10 border-b border-line">
        <Wordmark showTagline={false} />
        <IconButton aria-label="Close search" onClick={onClose} className="text-text">
          <X className="size-6" />
        </IconButton>
      </div>

      <div className="mx-auto w-full max-w-4xl flex-1 px-4 sm:px-6 py-10 overflow-y-auto">
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch(q);
          }}
          className="relative"
        >
          <Search className="pointer-events-none absolute start-0 top-1/2 -translate-y-1/2 size-7 text-muted" />
          <input
            ref={inputRef}
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search sarees, pottery, brass, makers… बनारसी"
            className="w-full bg-transparent ps-12 pe-4 py-3 font-serif text-2xl sm:text-3xl text-text placeholder:text-muted focus:outline-none border-b-2 border-line focus:border-brand transition-colors"
          />
        </form>

        <div className="mt-10">
          <h4 className="text-eyebrow text-muted mb-4">Popular Craft Searches</h4>
          <div className="flex flex-wrap gap-2.5">
            {popularCrafts.map((c) => (
              <button
                key={c.query}
                type="button"
                onClick={() => handleSearch(c.query)}
                className="rounded-xs border border-line-strong bg-surface px-4 py-2 text-body-s font-medium text-text hover:border-brand hover:text-brand transition-colors cursor-pointer"
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-12 rounded-sm border border-line bg-surface-alt p-6">
          <div className="flex items-center gap-2 text-peacock-700 font-semibold text-body-s">
            <ShieldCheck className="size-5" />
            <span>Karu Provenance Guarantee</span>
          </div>
          <p className="text-body-s text-muted mt-1 leading-relaxed">
            Every piece displayed on Karu has passed high-precision weave/clay analysis and maker verification with unedited making video proof.
          </p>
        </div>
      </div>
    </div>
  );
}

/** Mobile NavDrawer */
export function NavDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useTranslations("nav");
  const path = usePathname();

  return (
    <Drawer open={open} onClose={onClose} side="start" title={<Wordmark showTagline={false} />}>
      <div className="flex flex-col gap-6 py-2">
        <nav className="flex flex-col divide-y divide-line text-body font-medium">
          <Link
            href="/"
            onClick={onClose}
            className="py-3 text-text hover:text-brand transition-colors"
          >
            {t("home")}
          </Link>
          <Link
            href="/categories"
            onClick={onClose}
            className="py-3 text-text hover:text-brand transition-colors"
          >
            {t("categories")}
          </Link>
          <Link
            href="/c/sarees"
            onClick={onClose}
            className="py-3 text-text hover:text-brand transition-colors"
          >
            Handloom Sarees
          </Link>
          <Link
            href="/c/pottery-terracotta"
            onClick={onClose}
            className="py-3 text-text hover:text-brand transition-colors"
          >
            Pottery & Terracotta
          </Link>
          <Link
            href="/c/metal-brass"
            onClick={onClose}
            className="py-3 text-text hover:text-brand transition-colors"
          >
            Dhokra & Metalcraft
          </Link>
          <Link
            href="/verification-explained"
            onClick={onClose}
            className="py-3 text-text hover:text-brand transition-colors"
          >
            {t("how_verification_works")}
          </Link>
        </nav>

        <div className="border-t border-line pt-6 flex flex-col gap-3">
          <Link
            href="/sell"
            onClick={onClose}
            className="flex items-center justify-center gap-2 rounded-xs bg-brand py-3 text-eyebrow text-white shadow-xs"
          >
            <Store className="size-4" />
            <span>{t("sell")}</span>
          </Link>

          <div className="flex items-center justify-between pt-2">
            <span className="text-body-s text-muted">Language / भाषा</span>
            <LanguageSwitcher signedIn={false} />
          </div>
        </div>
      </div>
    </Drawer>
  );
}

/** 5.4 MarketFooter: Terracotta footer with deckle edge, newsletter, and craft directory. */
export function MarketFooter() {
  const t = useTranslations("footer");
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const onSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
    }
  };

  return (
    <footer className="relative mt-auto w-full bg-brand text-on-dark">
      {/* Deckle Edge Transition: Khadi to Terracotta */}
      <div className="text-brand -mt-6">
        <DeckleEdge fill="var(--color-brand)" />
      </div>

      <div className="mx-auto max-w-[1360px] px-4 sm:px-6 lg:px-10 pt-12 pb-24 md:pb-12">
        {/* Top: Brand & Newsletter Split */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-10 border-b border-terracotta-900/60 pb-12">
          <div>
            <Wordmark tone="light" showTagline={true} />
            <p className="mt-4 max-w-md text-body-s text-on-dark/80 leading-relaxed font-serif">
              {t("tagline")}
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <h3 className="text-eyebrow text-gold-300">Join the Karu Circle</h3>
            <p className="text-body-s text-on-dark/85">
              New drops from master weaver looms and kiln openings, twice a month.
            </p>
            {subscribed ? (
              <p className="rounded-xs bg-white/10 p-3 text-caption font-semibold text-gold-200">
                ✓ Welcome to the Karu Circle. You will receive authentic artisan stories.
              </p>
            ) : (
              <form onSubmit={onSubscribe} className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email address"
                  required
                  className="w-full rounded-xs border border-white/20 bg-white/10 px-4 py-2.5 text-body-s text-white placeholder:text-on-dark/50 focus:border-gold-400 focus:outline-none"
                />
                <button
                  type="submit"
                  className="rounded-xs bg-gold-500 px-5 text-caption font-semibold text-ink-950 hover:bg-gold-400 transition-colors cursor-pointer shrink-0"
                >
                  Join
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Middle: 4 Directory Columns */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-12 text-body-s">
          <div>
            <h4 className="text-eyebrow text-gold-300 mb-4">{t("shop")}</h4>
            <ul className="flex flex-col gap-2.5 text-on-dark/80">
              <li><Link href="/categories" className="hover:text-white transition-colors">{t("all_categories")}</Link></li>
              <li><Link href="/c/sarees" className="hover:text-white transition-colors">Handloom Sarees</Link></li>
              <li><Link href="/c/pottery-terracotta" className="hover:text-white transition-colors">Pottery & Clay</Link></li>
              <li><Link href="/c/metal-brass" className="hover:text-white transition-colors">Dhokra Metal</Link></li>
              <li><Link href="/search?verified=true" className="hover:text-white transition-colors">{t("verified_only")}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-eyebrow text-gold-300 mb-4">Crafts & Clusters</h4>
            <ul className="flex flex-col gap-2.5 text-on-dark/80">
              <li><Link href="/craft/bhagalpuri-silk" className="hover:text-white transition-colors">Bhagalpuri Silk (Bihar)</Link></li>
              <li><Link href="/craft/banarasi" className="hover:text-white transition-colors">Banarasi Brocade (UP)</Link></li>
              <li><Link href="/craft/khurja-pottery" className="hover:text-white transition-colors">Khurja Pottery (UP)</Link></li>
              <li><Link href="/craft/kutch-embroidery" className="hover:text-white transition-colors">Kutch Embroidery (Gujarat)</Link></li>
              <li><Link href="/categories" className="hover:text-white transition-colors">All Crafts →</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-eyebrow text-gold-300 mb-4">{t("karu")}</h4>
            <ul className="flex flex-col gap-2.5 text-on-dark/80">
              <li><Link href="/about" className="hover:text-white transition-colors">{t("about")}</Link></li>
              <li><Link href="/verification-explained" className="hover:text-white transition-colors">{t("verification")}</Link></li>
              <li><Link href="/impact" className="hover:text-white transition-colors">{t("impact")}</Link></li>
              <li><Link href="/sell" className="hover:text-white transition-colors">{t("sell_on_karu")}</Link></li>
              <li><Link href="/business" className="hover:text-white transition-colors">{t("business")}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-eyebrow text-gold-300 mb-4">{t("help")}</h4>
            <ul className="flex flex-col gap-2.5 text-on-dark/80">
              <li><Link href="/help" className="hover:text-white transition-colors">{t("help_centre")}</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors">{t("terms")}</Link></li>
              <li><Link href="/privacy" className="hover:text-white transition-colors">{t("privacy")}</Link></li>
              <li><Link href="/account/orders" className="hover:text-white transition-colors">Track Your Order</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar: Language, Payment Marks, Copyright */}
        <div className="border-t border-terracotta-900/60 pt-8 flex flex-col md:flex-row items-center justify-between gap-6 text-caption text-on-dark/70">
          <div className="flex items-center gap-3">
            <Globe className="size-4 text-gold-300" />
            <LanguageSwitcher signedIn={false} />
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] font-mono tracking-wider uppercase text-on-dark/80">
            <span className="rounded-xs border border-white/20 px-2 py-0.5">UPI</span>
            <span className="rounded-xs border border-white/20 px-2 py-0.5">RuPay</span>
            <span className="rounded-xs border border-white/20 px-2 py-0.5">Visa</span>
            <span className="rounded-xs border border-white/20 px-2 py-0.5">Mastercard</span>
            <span className="rounded-xs border border-white/20 px-2 py-0.5">Netbanking</span>
          </div>

          <div className="text-center md:text-end">
            <p className="flex items-center justify-center md:justify-end gap-1.5 font-medium text-white">
              <ShieldCheck className="size-4 text-gold-300" />
              <span>{t("promise")}</span>
            </p>
            <p className="mt-1 text-[11px] text-on-dark/60">
              © {new Date().getFullYear()} Karu Handmade Technologies Pvt Ltd. Made in India.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

/** 5.2 MarketBottomNav: Thumb-friendly mobile navigation (hidden on PDP, cart, checkout). */
export function MarketBottomNav() {
  const t = useTranslations("nav");
  const path = usePathname();
  const { data: me } = useMe();
  const { data: cartCount } = useCartCount(!!me);

  // Hidden on PDP (/p/*), cart (/cart), checkout (/checkout) as specified in §5.2 and §13.5
  if (path.startsWith("/p/") || path === "/cart" || path === "/checkout") {
    return null;
  }

  const items = [
    { href: "/", label: t("home"), icon: Home, active: path === "/" },
    { href: "/categories", label: t("categories"), icon: LayoutGrid, active: path === "/categories" },
    { href: "/search", label: t("search"), icon: Search, active: path === "/search" },
    { href: "/account/wishlist", label: t("wishlist"), icon: Heart, active: path === "/account/wishlist" },
    { href: me ? "/account" : "/login", label: t("account"), icon: UserRound, active: path.startsWith("/account") || path === "/login" },
  ];

  return (
    <nav
      aria-label="Bottom Navigation"
      className="fixed bottom-0 inset-x-0 z-30 flex h-15 items-center justify-around border-t border-line bg-surface/98 backdrop-blur-md px-2 md:hidden"
    >
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cx(
              "flex flex-1 flex-col items-center justify-center gap-1 py-1 text-center transition-colors relative",
              item.active ? "text-brand" : "text-muted hover:text-text"
            )}
          >
            {item.active && (
              <span className="absolute top-0 h-0.5 w-8 rounded-full bg-brand" />
            )}
            <Icon className="size-5.5" strokeWidth={1.5} />
            <span className="text-[12px] font-medium leading-none">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
