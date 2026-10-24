import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CategoryIcon } from "./category-icon";
import { cx } from "@/lib/format";

export interface CategoryItem {
  slug: string;
  name: string;
  icon: string;
  count: number;
  cover?: string | null;
}

export function CategoryShowcase({ categories }: { categories: CategoryItem[] }) {
  const featured = categories.filter((c) => c.slug !== "other").slice(0, 8);

  return (
    <div className="w-full">
      {/* Circular portal row on mobile / 8-col grid on desktop (Terra & Soul homage) */}
      <div className="no-scrollbar -mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 md:mx-0 md:px-0 md:grid md:grid-cols-4 lg:grid-cols-8 md:gap-6">
        {featured.map((cat) => (
          <Link
            key={cat.slug}
            href={`/c/${cat.slug}`}
            className="group flex w-24 shrink-0 snap-start flex-col items-center gap-2.5 text-center sm:w-28 md:w-full"
          >
            {/* Circular Portal Frame with 4px khadi gap ring + hairline outer ring */}
            <div className="relative aspect-square size-22 sm:size-28 lg:size-32 rounded-full p-1 ring-1 ring-line transition-all duration-300 group-hover:ring-2 group-hover:ring-brand group-hover:scale-105">
              <div className="relative size-full overflow-hidden rounded-full bg-surface-alt shadow-2xs border border-line">
                {cat.cover ? (
                  <img
                    src={cat.cover}
                    alt={cat.name}
                    loading="lazy"
                    className="size-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center bg-surface-alt text-brand">
                    <CategoryIcon slug={cat.slug} className="size-8 sm:size-10" />
                  </div>
                )}
              </div>
            </div>

            {/* Label in text-eyebrow + 'Shop now' underline */}
            <div className="flex flex-col items-center gap-0.5 mt-1">
              <span className="text-eyebrow text-text group-hover:text-brand transition-colors line-clamp-1">
                {cat.name}
              </span>
              <span className="text-caption text-muted group-hover:text-brand underline-offset-4 group-hover:underline transition-all">
                Shop now
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
