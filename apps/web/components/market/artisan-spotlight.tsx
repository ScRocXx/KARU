"use client";

import Link from "next/link";
import { BadgeCheck } from "lucide-react";
import { ListenButton } from "@/components/karu/maker-card";
import { Button } from "@/components/ui/button";
import type { Maker } from "@/lib/types";

export function MakerSpotlight({ maker }: { maker?: Maker }) {
  if (!maker || !maker.photo_url || !maker.story) return null;

  return (
    <div className="relative overflow-hidden rounded-sm border border-line bg-surface p-6 sm:p-10 lg:p-14">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
        {/* 5-col Arch Portrait on Desktop */}
        <div className="lg:col-span-5 relative mx-auto w-full max-w-sm lg:max-w-none">
          <div className="relative aspect-[4/5] overflow-hidden rounded-t-[100px] rounded-b-sm border border-line bg-sand-200 shadow-sm">
            <img
              src={maker.photo_url}
              alt={maker.name}
              className="size-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

            {/* Passport Hallmark Tag */}
            <div className="absolute bottom-4 inset-x-4 flex items-center justify-between rounded-xs bg-surface/95 p-3 backdrop-blur-md shadow-2xs border border-line">
              <div className="min-w-0">
                <p className="text-caption font-semibold uppercase tracking-widest text-brand">
                  Karu Passport Verified
                </p>
                <p className="font-serif text-body-s font-semibold text-text truncate">{maker.name}</p>
                <p className="text-caption text-muted truncate">{maker.place}</p>
              </div>
              <BadgeCheck className="size-5 text-peacock-700 shrink-0" />
            </div>
          </div>
        </div>

        {/* 7-col Story on Desktop */}
        <div className="lg:col-span-7 flex flex-col gap-5 text-text">
          <div>
            <p className="text-eyebrow text-brand mb-1.5">
              The Story Behind Every Piece
            </p>
            <h2 className="text-h2 font-serif font-medium leading-tight text-text">
              Hands that hold the ancient rhythms of India.
            </h2>
          </div>

          <blockquote
            className="font-serif text-body-l sm:text-xl italic leading-relaxed text-ink-800"
            lang={maker.story_lang}
          >
            “{maker.story}”
          </blockquote>

          <div className="flex flex-wrap items-center gap-6 border-y border-line py-4 text-body-s text-muted">
            <div>
              <span className="block text-caption uppercase text-subtle">Maker</span>
              <span className="font-semibold text-text">{maker.name}</span>
            </div>
            <div className="h-6 w-px bg-line" />
            <div>
              <span className="block text-caption uppercase text-subtle">Cluster</span>
              <span className="font-semibold text-text">{maker.place || "Heritage Cluster"}</span>
            </div>
            {maker.years_of_practice && (
              <>
                <div className="h-6 w-px bg-line" />
                <div>
                  <span className="block text-caption uppercase text-subtle">Experience</span>
                  <span className="font-semibold text-text">{maker.years_of_practice} Years of Craft</span>
                </div>
              </>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Link href={`/m/${maker.handle}`}>
              <Button variant="primary" size="L">
                Meet the Maker
              </Button>
            </Link>
            {maker.voice_url && (
              <ListenButton url={maker.voice_url} name={maker.name} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Backward compatible alias */
export const ArtisanSpotlight = MakerSpotlight;
