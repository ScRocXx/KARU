"use client";

import { Film, ZoomIn } from "lucide-react";
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
    <div className="flex flex-col gap-3 lg:sticky lg:top-20 lg:self-start">
      <div className="relative aspect-[4/5] overflow-hidden rounded-[16px] bg-ink-100">
        {showVideo && video ? (
          <video src={video.url} poster={video.poster || undefined} controls autoPlay playsInline className="size-full bg-ink-900 object-contain" />
        ) : current?.large ? (
          <button type="button" onClick={() => setZoom(true)} className="group block size-full cursor-zoom-in" aria-label={title}>
            <img src={current.large} alt={title} className="size-full object-cover" fetchPriority="high" />
            <span className="absolute end-3 bottom-3 flex size-10 items-center justify-center rounded-full bg-white/90 opacity-0 transition-opacity group-hover:opacity-100">
              <ZoomIn className="size-5" />
            </span>
          </button>
        ) : null}
      </div>
      <div className="no-scrollbar flex gap-2 overflow-x-auto">
        {images.map((img, i) => (
          <button
            key={img.id}
            type="button"
            onClick={() => {
              setActive(i);
              setShowVideo(false);
            }}
            className={cx("aspect-[4/5] w-16 shrink-0 overflow-hidden rounded-[8px] border-2", i === active && !showVideo ? "border-indigo-900" : "border-transparent")}
            aria-label={`${title} ${i + 1}`}
          >
            {img.thumb && <img src={img.thumb} alt="" className="size-full object-cover" loading="lazy" />}
          </button>
        ))}
        {video && (
          <button
            type="button"
            onClick={() => setShowVideo(true)}
            className={cx(
              "relative flex aspect-[4/5] w-16 shrink-0 flex-col items-center justify-center gap-1 overflow-hidden rounded-[8px] border-2 bg-indigo-900 text-[10px] font-semibold text-white",
              showVideo ? "border-haldi-500" : "border-transparent",
            )}
          >
            <Film className="size-5" />
            {videoLabel}
          </button>
        )}
      </div>
      <Sheet open={zoom} onClose={() => setZoom(false)} title={title} wide>
        {current?.large && <img src={current.large} alt={title} className="w-full rounded-[12px]" />}
      </Sheet>
    </div>
  );
}
