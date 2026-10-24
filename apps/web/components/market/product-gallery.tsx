"use client";

import { ChevronLeft, ChevronRight, Film, Play, X, ZoomIn } from "lucide-react";
import React, { useState } from "react";
import { cx } from "@/lib/format";
import type { ImageSet } from "@/lib/types";

export function ProductGallery({
  images,
  title,
  video,
  videoLabel,
}: {
  images: (ImageSet & { enhanced?: boolean })[];
  title: string;
  video: { url: string; poster: string | null } | null;
  videoLabel: string;
}) {
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const current = images[active];

  return (
    <div className="flex flex-col-reverse lg:flex-row gap-4 lg:sticky lg:top-24 lg:self-start">
      {/* Desktop Vertical Thumbnail Rail (72px on start side) */}
      <div className="no-scrollbar flex lg:flex-col gap-2.5 overflow-x-auto lg:overflow-y-auto lg:max-h-[580px] shrink-0 pb-1 lg:pb-0">
        {images.map((img, i) => (
          <button
            key={img.id}
            type="button"
            onClick={() => {
              setActive(i);
              setShowVideo(false);
            }}
            className={cx(
              "relative aspect-[4/5] w-16 sm:w-18 shrink-0 overflow-hidden rounded-xs border-2 transition-all cursor-pointer",
              i === active && !showVideo
                ? "border-brand ring-2 ring-brand/20 opacity-100"
                : "border-line opacity-75 hover:opacity-100 hover:border-line-strong"
            )}
            aria-label={`${title} image ${i + 1}`}
          >
            {img.thumb && (
              <img src={img.thumb} alt="" className="size-full object-cover" loading="lazy" />
            )}
          </button>
        ))}

        {video && (
          <button
            type="button"
            onClick={() => setShowVideo(true)}
            className={cx(
              "relative flex aspect-[4/5] w-16 sm:w-18 shrink-0 flex-col items-center justify-center gap-1 overflow-hidden rounded-xs border-2 text-[10px] font-semibold transition-all cursor-pointer",
              showVideo
                ? "border-brand bg-brand text-white"
                : "border-line bg-surface-deep text-on-dark hover:bg-olive-800"
            )}
            aria-label="Play making video"
          >
            <Play className="size-4 fill-current" />
            <span className="leading-tight text-center px-1">Proof</span>
          </button>
        )}
      </div>

      {/* Main 4:5 Image Frame */}
      <div className="relative aspect-[4/5] w-full flex-1 overflow-hidden rounded-sm border border-line bg-sand-100 shadow-xs">
        {showVideo && video ? (
          <video
            src={video.url}
            poster={video.poster || undefined}
            controls
            autoPlay
            playsInline
            className="size-full bg-ink-950 object-contain"
          />
        ) : current?.large ? (
          <button
            type="button"
            onClick={() => setLightbox(true)}
            className="group relative block size-full cursor-zoom-in"
            aria-label={title}
          >
            <img
              src={current.large}
              alt={title}
              className="size-full object-cover transition-transform duration-500 ease-out group-hover:scale-103"
              fetchPriority="high"
            />
            {/* Zoom Button */}
            <span className="absolute end-3.5 bottom-3.5 flex size-10 items-center justify-center rounded-full bg-surface/90 text-text shadow-sm backdrop-blur-md opacity-0 transition-all group-hover:opacity-100 hover:bg-surface hover:scale-105">
              <ZoomIn className="size-4.5" />
            </span>
          </button>
        ) : (
          <div className="flex size-full items-center justify-center font-serif text-caption text-muted italic">
            Handcrafted Piece
          </div>
        )}

        {/* Video available pill on image */}
        {video && !showVideo && (
          <button
            type="button"
            onClick={() => setShowVideo(true)}
            className="absolute start-3.5 bottom-3.5 inline-flex items-center gap-2 rounded-full border border-white/40 bg-black/75 px-3.5 py-1.5 text-caption font-semibold text-white backdrop-blur-md shadow-sm transition-transform hover:scale-102 cursor-pointer"
          >
            <Play className="size-3.5 fill-white" />
            <span>Watch Making Proof</span>
          </button>
        )}

        {/* Mobile Page Indicator */}
        <div className="absolute top-3 end-3 rounded-full bg-black/60 px-2.5 py-0.5 text-[11px] font-mono font-medium text-white backdrop-blur-xs lg:hidden">
          {active + 1} / {images.length}
        </div>
      </div>

      {/* Fullscreen Lightbox */}
      {lightbox && current?.large && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <button
            type="button"
            onClick={() => setLightbox(false)}
            className="absolute top-4 end-4 flex size-11 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 cursor-pointer"
            aria-label="Close"
          >
            <X className="size-6" />
          </button>

          <div className="relative max-h-[90vh] max-w-[90vw]">
            <img
              src={current.large}
              alt={title}
              className="max-h-[90vh] max-w-[90vw] object-contain rounded-xs"
            />
          </div>

          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => setActive((prev) => (prev - 1 + images.length) % images.length)}
                className="absolute start-4 top-1/2 -translate-y-1/2 flex size-12 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 cursor-pointer"
                aria-label="Previous image"
              >
                <ChevronLeft className="size-6 flip-rtl" />
              </button>
              <button
                type="button"
                onClick={() => setActive((prev) => (prev + 1) % images.length)}
                className="absolute end-4 top-1/2 -translate-y-1/2 flex size-12 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 cursor-pointer"
                aria-label="Next image"
              >
                <ChevronRight className="size-6 flip-rtl" />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
