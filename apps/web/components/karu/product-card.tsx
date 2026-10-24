"use client";

import { Heart } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { api } from "@/lib/api";
import { cx, inr } from "@/lib/format";
import { useMe } from "@/lib/hooks";
import type { Card } from "@/lib/types";
import { StockPill, VerifiedBadge } from "./badges";

/** ProductCard: 4:5 image, 2-line title, price, maker, small badge, stock pill, wishlist heart. */
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
    <Link href={`/p/${card.code}`} className="group flex flex-col gap-2 rounded-[12px] focus-visible:outline-offset-4">
      <div className="relative aspect-[4/5] overflow-hidden rounded-[12px] bg-ink-100">
        {card.image?.card ? (
          <img
            src={card.image.card}
            alt={card.title}
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : null}
        <div className="absolute start-2 top-2">
          <VerifiedBadge status={card.verification === "verified" ? "verified" : "not_verified"} />
        </div>
        <button
          onClick={toggle}
          aria-label={wished ? t("unwish") : t("wish")}
          aria-pressed={wished}
          className="absolute end-1.5 top-1.5 flex size-10 items-center justify-center rounded-full bg-white/90 text-ink-900 shadow-sm backdrop-blur hover:bg-white"
        >
          <Heart className={cx("size-5", wished && "fill-terracotta-600 text-terracotta-600")} />
        </button>
        {card.stock.state !== "in" && (
          <div className="absolute bottom-2 start-2">
            <StockPill stock={card.stock} />
          </div>
        )}
      </div>
      <div className="flex flex-col gap-0.5 px-0.5">
        <h3 className="line-clamp-2 text-[15px] font-medium leading-snug text-ink-900">{card.title}</h3>
        <p className="truncate text-xs text-ink-600">
          {card.maker.name}
          {card.maker.place ? ` · ${card.maker.place}` : ""}
        </p>
        <p className="font-semibold text-ink-900">{inr(card.price_inr)}</p>
      </div>
    </Link>
  );
}

export function ProductGrid({ cards, className }: { cards: Card[]; className?: string }) {
  return (
    <div className={cx("grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 lg:grid-cols-4", className)}>
      {cards.map((c, i) => (
        <ProductCard key={c.id} card={c} priority={i < 4} />
      ))}
    </div>
  );
}

export function ProductRail({ cards }: { cards: Card[] }) {
  return (
    <div className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2">
      {cards.map((c) => (
        <div key={c.id} className="w-40 shrink-0 snap-start sm:w-48">
          <ProductCard card={c} />
        </div>
      ))}
    </div>
  );
}
