"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Container } from "@/components/layout/container";
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
    <div className="w-full border-t border-line/60 py-12 sm:py-16">
      <Container size="page">
        <div className="flex flex-col gap-6">
          <div>
            <span className="text-eyebrow text-brand">Your Browsing History</span>
            <h2 className="font-serif text-2xl sm:text-3xl font-medium text-text mt-1">{t("recently_viewed")}</h2>
          </div>
          <ProductRail cards={cards} />
        </div>
      </Container>
    </div>
  );
}
