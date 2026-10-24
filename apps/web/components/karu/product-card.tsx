"use client";

import { Heart, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { api } from "@/lib/api";
import { cx, inr } from "@/lib/format";
import { useMe } from "@/lib/hooks";
import type { Card } from "@/lib/types";
import { StockPill, VerifiedBadge } from "./badges";

/** ProductCard: Editorial luxury card with 4:5 ratio, craft hallmark, and artisanal typography. */
export function ProductCard({ card, priority }: { card: Card; priority?: boolean }) {
  const t = useTranslations("card");
  const router = useRouter();
  const { data: me } = useMe();
  const [wished, setWished] = useState(card.wishlisted);

  const toggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!me) {
      router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    const next = !wished;
    setWished(next);
    try {
      await api(`/wishlist/${card.id}`, { method: next ? "POST" : "DELETE" });
    } catch {
      setWished(!next);
    }
  };

  return (
    <Link
      href={`/p/${card.code}`}
      className="group flex flex-col gap-3 rounded-[16px] transition-all focus-visible:outline-offset-4"
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-[14px] bg-[#F7F4EE] border border-sand-100 shadow-2xs">
        {card.image?.card ? (
          <img
            src={card.image.card}
            alt={card.title}
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            className="size-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex size-full items-center justify-center bg-sand-100 text-ink-400 text-xs font-serif italic">
            Handcrafted Piece
          </div>
        )}

        {/* Top-left: Hallmark badge */}
        <div className="absolute start-2.5 top-2.5 z-10">
          <VerifiedBadge status={card.verification === "verified" ? "verified" : "not_verified"} />
        </div>

        {/* Top-right: Wishlist Heart */}
        <button
          onClick={toggle}
          aria-label={wished ? t("unwish") : t("wish")}
          aria-pressed={wished}
          className="absolute end-2.5 top-2.5 z-10 flex size-9 items-center justify-center rounded-full bg-white/90 text-ink-800 shadow-xs backdrop-blur-md transition-all hover:bg-white hover:scale-105 active:scale-95"
        >
          <Heart className={cx("size-4 transition-colors", wished ? "fill-terracotta-700 text-terracotta-700" : "text-ink-600")} />
        </button>

        {/* Bottom-left: Stock Pill if low or out */}
        {card.stock.state !== "in" && (
          <div className="absolute bottom-2.5 start-2.5 z-10">
            <StockPill stock={card.stock} />
          </div>
        )}

        {/* Bottom-right: Homage to Mrittika (+) quick action */}
        <div className="absolute bottom-2.5 end-2.5 z-10 flex size-8 items-center justify-center rounded-full border border-sand-200 bg-white/95 text-ink-700 shadow-xs backdrop-blur-sm opacity-90 transition-all group-hover:bg-terracotta-800 group-hover:text-white group-hover:border-terracotta-800 group-hover:opacity-100">
          <Plus className="size-4" />
        </div>
      </div>

      <div className="flex flex-col gap-1 px-1">
        {/* Maker credit & location */}
        <p className="text-[11px] font-medium uppercase tracking-wider text-ink-500">
          {card.maker.name}
          {card.maker.place ? ` · ${card.maker.place}` : ""}
        </p>

        {/* Product title */}
        <h3 className="line-clamp-1 font-serif text-[15px] font-medium leading-snug text-ink-950 group-hover:text-terracotta-800 transition-colors">
          {card.title}
        </h3>

        {/* Price */}
        <p className="font-semibold text-sm text-ink-950 pt-0.5">
          {inr(card.price_inr)}
        </p>
      </div>
    </Link>
  );
}

export function ProductGrid({ cards, className }: { cards: Card[]; className?: string }) {
  return (
    <div className={cx("grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5", className)}>
      {cards.map((c, i) => (
        <ProductCard key={c.id} card={c} priority={i < 5} />
      ))}
    </div>
  );
}

export function ProductRail({ cards }: { cards: Card[] }) {
  return (
    <div className="no-scrollbar -mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-3 sm:-mx-6 sm:px-6 md:mx-0 md:px-0">
      {cards.map((c) => (
        <div key={c.id} className="w-44 shrink-0 snap-start sm:w-56 md:w-60">
          <ProductCard card={c} />
        </div>
      ))}
    </div>
  );
}
