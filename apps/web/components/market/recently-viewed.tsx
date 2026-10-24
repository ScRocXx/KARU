"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { ProductRail } from "@/components/karu/product-card";
import type { Card } from "@/lib/types";

const KEY = "karu:recent";

/** Recently viewed products, kept on the device only (no tracking). */
export function rememberViewed(card: Card) {
  try {
    const list: Card[] = JSON.parse(localStorage.getItem(KEY) || "[]");
    const next = [card, ...list.filter((c) => c.id !== card.id)].slice(0, 12);
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable */
  }
}

export function RecentlyViewed() {
  const t = useTranslations("home");
  const [cards, setCards] = useState<Card[]>([]);
  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reading device storage after mount
      setCards(JSON.parse(localStorage.getItem(KEY) || "[]"));
    } catch {
      setCards([]);
    }
  }, []);
  if (cards.length < 2) return null;
  return (
    <section>
      <h2 className="font-display mb-4 text-[22px] md:text-[28px]">{t("recently_viewed")}</h2>
      <ProductRail cards={cards} />
    </section>
  );
}
