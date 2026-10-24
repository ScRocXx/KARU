"use client";

import { ArrowRight, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cx } from "@/lib/format";
import type { Card } from "@/lib/types";

export interface HeroSlide {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  makerName: string;
  makerPlace: string;
  code: string;
}

export function HeroCarousel({ cards = [] }: { cards?: Card[] }) {
  const t = useTranslations("home");
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  const fallbackSlides: HeroSlide[] = cards.slice(0, 3).map((c) => ({
    id: c.id,
    title: c.title,
    subtitle: t("subtitle"),
    image: c.image?.large || c.image?.card || "",
    makerName: c.maker.name,
    makerPlace: c.maker.place,
    code: c.code,
  }));

  const slides = fallbackSlides.length ? fallbackSlides : [
    {
      id: "demo-1",
      title: "Bhagalpuri Handloom Tussar Saree",
      subtitle: t("subtitle"),
      image: "",
      makerName: "Ramesh Kumar",
      makerPlace: "Nathnagar, Bihar",
      code: "W882YBD",
    },
  ];

  useEffect(() => {
    if (paused || slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 7000);
    return () => clearInterval(timer);
  }, [paused, slides.length]);

  const active = slides[current];

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className="relative w-full overflow-hidden bg-bg border-b border-line min-h-[560px] lg:h-[640px] flex items-center"
    >
      <div className="mx-auto w-full max-w-[1360px] px-4 sm:px-6 lg:px-10 py-10 lg:py-0 h-full flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center h-full">
          {/* Left Column: Copy & Actions (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-6 z-10 py-6 lg:py-0">
            <div className="inline-flex items-center gap-2 self-start rounded-full border border-line bg-surface/80 px-3.5 py-1 text-caption font-semibold uppercase tracking-widest text-brand backdrop-blur-xs">
              <Sparkles className="size-3 text-gold-500" />
              <span>Timeless Indian Craftsmanship</span>
            </div>

            <h1 className="text-display-xl font-serif text-text font-normal leading-[1.08] tracking-tight">
              Made by hands. <br />
              <span className="italic text-brand">Proven by Karu.</span>
            </h1>

            <p className="text-body-l text-muted max-w-lg leading-relaxed">
              {active.subtitle}
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link href="/search?verified=true">
                <Button variant="primary" size="L" iconEnd={<ArrowRight className="size-4" />}>
                  {t("cta_verified")}
                </Button>
              </Link>
              <Link href="/verification-explained">
                <Button variant="secondary" size="L">
                  How Karu ID Works
                </Button>
              </Link>
            </div>

            {/* Slide Indicator: 01 —— 03 (Mrittika reference) */}
            <div className="flex items-center gap-4 pt-6 border-t border-line text-caption font-mono text-muted">
              <span>0{current + 1}</span>
              <div className="h-0.5 w-16 bg-line overflow-hidden relative">
                <div
                  className="h-full bg-brand transition-all duration-300"
                  style={{ width: `${((current + 1) / slides.length) * 100}%` }}
                />
              </div>
              <span>0{slides.length}</span>
              <div className="flex items-center gap-1 ms-auto">
                <button
                  type="button"
                  onClick={() => setCurrent((prev) => (prev - 1 + slides.length) % slides.length)}
                  className="flex size-8 items-center justify-center rounded-xs border border-line hover:border-brand hover:text-brand cursor-pointer"
                  aria-label="Previous slide"
                >
                  <ChevronLeft className="size-4 flip-rtl" />
                </button>
                <button
                  type="button"
                  onClick={() => setCurrent((prev) => (prev + 1) % slides.length)}
                  className="flex size-8 items-center justify-center rounded-xs border border-line hover:border-brand hover:text-brand cursor-pointer"
                  aria-label="Next slide"
                >
                  <ChevronRight className="size-4 flip-rtl" />
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Photo (7 cols) */}
          <div className="lg:col-span-7 relative h-[360px] sm:h-[440px] lg:h-[580px] w-full overflow-hidden rounded-sm border border-line bg-surface-alt shadow-sm">
            {active.image ? (
              <img
                src={active.image}
                alt={active.title}
                fetchPriority="high"
                className="size-full object-cover transition-all duration-700 ease-out"
              />
            ) : (
              <div className="flex size-full items-center justify-center bg-sand-100 text-brand/30 font-serif text-6xl">
                Karu
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

            {/* Floating Provenance Hallmark Tag */}
            <div className="absolute bottom-4 inset-x-4 flex items-center justify-between rounded-xs bg-surface/95 p-3.5 backdrop-blur-md border border-line shadow-2xs">
              <div className="min-w-0">
                <p className="font-serif text-body-s font-semibold text-text truncate">{active.title}</p>
                <p className="text-caption text-muted truncate">By {active.makerName} · {active.makerPlace}</p>
              </div>
              <span className="font-mono text-caption text-brand bg-brand-soft border border-brand/20 px-2.5 py-0.5 rounded-full shrink-0">
                ID #{active.code}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Vertical Side Tagline on Desktop End Edge (Mrittika reference) */}
      <div className="hidden xl:flex absolute end-4 top-1/2 -translate-y-1/2 rotate-90 origin-right text-[11px] font-semibold uppercase tracking-[0.28em] text-muted select-none pointer-events-none">
        Handwoven · Verified · Direct
      </div>
    </div>
  );
}
