import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cx } from "@/lib/format";

interface RegionTile {
  cluster: string;
  state: string;
  craft: string;
  code: string;
}

const REGIONS: RegionTile[] = [
  { cluster: "Bhagalpur", state: "Bihar", craft: "Tussar Silk", code: "BH" },
  { cluster: "Varanasi", state: "Uttar Pradesh", craft: "Brocade & Zari", code: "VN" },
  { cluster: "Khurja", state: "Uttar Pradesh", craft: "Stoneware Pottery", code: "KJ" },
  { cluster: "Kutch", state: "Gujarat", craft: "Mirror Embroidery", code: "KT" },
  { cluster: "Bastar", state: "Chhattisgarh", craft: "Dhokra Bell Metal", code: "BS" },
  { cluster: "Chanderi", state: "Madhya Pradesh", craft: "Tissue & Silk", code: "CH" },
];

export function RegionStrip() {
  return (
    <div className="w-full">
      <div className="no-scrollbar -mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 md:mx-0 md:px-0 md:grid md:grid-cols-3 lg:grid-cols-6 md:gap-4">
        {REGIONS.map((r) => (
          <Link
            key={r.cluster}
            href={`/search?state=${encodeURIComponent(r.state)}`}
            className="group relative flex w-[70vw] sm:w-auto shrink-0 snap-start aspect-[3/4] flex-col justify-between overflow-hidden rounded-sm border border-line bg-surface-alt p-5 transition-all duration-300 hover:border-brand hover:shadow-md"
          >
            {/* Top region stamp */}
            <div className="flex items-center justify-between">
              <span className="font-mono text-caption uppercase text-muted">
                {r.code} · CLUSTER
              </span>
              <span className="text-[11px] font-semibold text-brand font-serif">
                {r.craft}
              </span>
            </div>

            {/* Center monogram watermark */}
            <div className="flex items-center justify-center py-6 text-brand/20 font-serif text-5xl font-light select-none group-hover:scale-110 transition-transform">
              {r.cluster[0]}
            </div>

            {/* Bottom label plate: khadi/95 bg, text-eyebrow + arrow */}
            <div className="flex items-center justify-between rounded-xs border border-line bg-surface/95 px-3 py-2.5 backdrop-blur-xs shadow-2xs">
              <div className="flex flex-col min-w-0">
                <span className="text-eyebrow text-text truncate group-hover:text-brand transition-colors">
                  {r.cluster}
                </span>
                <span className="text-caption text-muted truncate">
                  {r.state}
                </span>
              </div>
              <ArrowRight className="size-3.5 flip-rtl text-muted group-hover:text-brand transition-transform group-hover:translate-x-0.5" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
