"use client";

import Link from "next/link";
import { ArrowRight, BadgeCheck, Mic, Sparkles } from "lucide-react";
import { ListenButton } from "@/components/karu/maker-card";
import type { Maker } from "@/lib/types";

export function ArtisanSpotlight({ maker }: { maker?: Maker }) {
  if (!maker) return null;

  const quote =
    maker.story ||
    "Every thread passing through the shuttle carries the memory of our ancestors. We don't take shortcuts — the true texture of pure handloom cannot be hurried.";

  return (
    <section className="relative my-8 overflow-hidden rounded-[24px] border border-sand-200/80 bg-gradient-to-br from-[#FDFBF7] via-[#F8F4EC] to-[#F3EDE2] p-6 sm:p-10 lg:p-14 shadow-xs">
      {/* Decorative craft watermark badge */}
      <div className="pointer-events-none absolute -right-12 -top-12 size-72 rounded-full border border-terracotta-800/10 opacity-40" />
      <div className="pointer-events-none absolute -right-6 -top-6 size-60 rounded-full border border-dashed border-terracotta-800/15 opacity-40" />

      <div className="relative grid items-center gap-8 lg:grid-cols-[1fr_1.25fr] lg:gap-14">
        {/* Left: Artisan Portrait with Heritage Frame */}
        <div className="relative mx-auto w-full max-w-sm lg:max-w-none">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[20px] bg-sand-200 shadow-md">
            {maker.photo_url ? (
              <img
                src={maker.photo_url}
                alt={maker.name}
                className="size-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="flex size-full items-center justify-center bg-sand-200 text-terracotta-900 font-serif text-3xl">
                {maker.name[0]}
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

            {/* Floating Karu Passport Badge */}
            <div className="absolute bottom-4 inset-x-4 flex items-center justify-between rounded-[12px] bg-white/95 p-3 backdrop-blur-sm shadow-xs border border-sand-100">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-terracotta-800">
                  Karu Passport Verified
                </p>
                <p className="truncate text-sm font-semibold text-ink-950 font-serif">{maker.name}</p>
                <p className="truncate text-xs text-ink-600">{maker.place}</p>
              </div>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-peacock-50 text-peacock-700">
                <BadgeCheck className="size-5" />
              </div>
            </div>
          </div>

          {/* Heritage seal pill */}
          <div className="absolute -top-3 -left-3 rounded-full border border-gold-400 bg-white px-3.5 py-1 text-[11px] font-medium tracking-wider uppercase text-gold-700 shadow-xs flex items-center gap-1.5">
            <Sparkles className="size-3 text-gold-600" />
            <span>Master Artisan Spotlight</span>
          </div>
        </div>

        {/* Right: Narrative Storytelling */}
        <div className="flex flex-col gap-5 text-ink-950">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-terracotta-700">
              The Story Behind Every Piece
            </p>
            <h2 className="mt-1 font-serif text-3xl font-medium tracking-tight text-ink-950 sm:text-4xl lg:text-[40px] leading-tight">
              “Hands that hold the ancient rhythms of India.”
            </h2>
          </div>

          <blockquote className="font-serif text-lg sm:text-xl font-normal italic leading-relaxed text-ink-800">
            “{quote}”
          </blockquote>

          {/* Credentials row */}
          <div className="flex flex-wrap items-center gap-4 border-y border-sand-200/80 py-4 text-sm text-ink-700">
            <div>
              <span className="block text-[11px] uppercase tracking-wider text-ink-500">Master Maker</span>
              <span className="font-semibold text-ink-900">{maker.name}</span>
            </div>
            <div className="h-7 w-px bg-sand-200" />
            <div>
              <span className="block text-[11px] uppercase tracking-wider text-ink-500">Cluster Lineage</span>
              <span className="font-semibold text-ink-900">{maker.place || "Heritage Cluster"}</span>
            </div>
            {maker.years_of_practice && (
              <>
                <div className="h-7 w-px bg-sand-200" />
                <div>
                  <span className="block text-[11px] uppercase tracking-wider text-ink-500">Experience</span>
                  <span className="font-semibold text-ink-900">{maker.years_of_practice} Years of Craft</span>
                </div>
              </>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Link
              href={`/m/${maker.handle}`}
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-terracotta-800 px-6 text-sm font-medium tracking-wide text-white transition-all hover:bg-terracotta-900 active:scale-98 shadow-xs"
            >
              Explore {maker.name}&apos;s Pieces
              <ArrowRight className="size-4" />
            </Link>

            {maker.voice_url ? (
              <ListenButton url={maker.voice_url} name={maker.name} />
            ) : (
              <span className="inline-flex min-h-11 items-center gap-2 rounded-full border border-sand-300 bg-white px-4 text-xs font-semibold text-ink-700 shadow-2xs">
                <Mic className="size-3.5 text-terracotta-700" /> Verified Artisan Voice On File
              </span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
