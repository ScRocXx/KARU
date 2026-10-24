"use client";

import { Film, Play, ZoomIn } from "lucide-react";
import { useState } from "react";
import { Sheet } from "@/components/ui";
import { cx } from "@/lib/format";
import type { ImageSet } from "@/lib/types";

/** Gallery (4:5) with zoom; the making video loads only on tap (poster first) — Part 2 §9.4. */
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
  const [zoom, setZoom] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const current = images[active];

  return (
    <div className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
      {/* Main Image Frame (4:5 Editorial Aspect) */}
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[20px] border border-sand-200/90 bg-[#F7F4EE] shadow-xs">
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
            onClick={() => setZoom(true)}
            className="group relative block size-full cursor-zoom-in"
            aria-label={title}
          >
            <img
              src={current.large}
              alt={title}
              className="size-full object-cover transition-transform duration-500 ease-out group-hover:scale-102"
              fetchPriority="high"
            />
            {/* Zoom Icon Button */}
            <span className="absolute end-3.5 bottom-3.5 flex size-10 items-center justify-center rounded-full bg-white/90 text-ink-800 shadow-md backdrop-blur-md opacity-0 transition-all group-hover:opacity-100 hover:bg-white hover:scale-105">
              <ZoomIn className="size-4.5" />
            </span>
          </button>
        ) : (
          <div className="flex size-full items-center justify-center font-serif text-sm italic text-ink-400">
            Handcrafted Piece
          </div>
        )}

        {/* Video available pill on image */}
        {video && !showVideo && (
          <button
            type="button"
            onClick={() => setShowVideo(true)}
            className="absolute start-3.5 bottom-3.5 inline-flex items-center gap-2 rounded-full border border-white/40 bg-black/75 px-3.5 py-1.5 text-xs font-semibold text-white backdrop-blur-md shadow-sm transition-transform hover:scale-102"
          >
            <Play className="size-3.5 fill-white" />
            <span>Play Making Proof</span>
          </button>
        )}
      </div>

      {/* Thumbnails Row */}
      <div className="no-scrollbar flex gap-2.5 overflow-x-auto pb-1">
        {images.map((img, i) => (
          <button
            key={img.id}
            type="button"
            onClick={() => {
              setActive(i);
              setShowVideo(false);
            }}
            className={cx(
              "relative aspect-[4/5] w-16 sm:w-18 shrink-0 overflow-hidden rounded-[12px] border-2 transition-all",
              i === active && !showVideo
                ? "border-terracotta-800 ring-2 ring-terracotta-800/20"
                : "border-sand-200/80 opacity-80 hover:opacity-100 hover:border-sand-400"
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
              "relative flex aspect-[4/5] w-16 sm:w-18 shrink-0 flex-col items-center justify-center gap-1 overflow-hidden rounded-[12px] border-2 text-[10px] font-semibold transition-all",
              showVideo
                ? "border-terracotta-800 bg-terracotta-800 text-white"
                : "border-sand-200 bg-[#262E26] text-white hover:bg-olive-800"
            )}
          >
            <Film className="size-4" />
            <span className="leading-tight text-center px-1">{videoLabel}</span>
          </button>
        )}
      </div>

      {/* High-Resolution Zoom Modal */}
      <Sheet open={zoom} onClose={() => setZoom(false)} title={title} wide>
        {current?.large && (
          <div className="p-2">
            <img src={current.large} alt={title} className="w-full rounded-[16px] shadow-sm" />
          </div>
        )}
      </Sheet>
    </div>
  );
}
