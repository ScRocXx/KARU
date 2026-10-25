import { GiTag } from "@/components/karu/badges";
import { ProductCard } from "@/components/karu/product-card";
import { TextLink } from "@/components/ui/text-link";
import { cx } from "@/lib/format";
import type { Card } from "@/lib/types";

export interface FeaturedRailProps {
  craft: {
    slug: string;
    name: string;
    gi_tag: boolean;
    regions: string[];
  };
  items: Card[];
  reversed?: boolean;
}

export function FeaturedRail({
  craft,
  items,
  reversed = false,
}: FeaturedRailProps) {
  const displayItems = items.slice(0, 4);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
      {/* 3-col Intro Column */}
      <div
        className={cx(
          "lg:col-span-3 flex flex-col justify-between gap-4",
          reversed ? "lg:order-2 lg:ps-6" : "lg:order-1 lg:pe-6"
        )}
      >
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-eyebrow text-brand">
              {craft.regions.join(" · ")}
            </span>
            {craft.gi_tag && <GiTag craft={craft.name} />}
          </div>
          <h2 className="text-h2 text-text font-serif">
            {craft.name}
          </h2>
          <p className="mt-2 text-body-s text-muted leading-relaxed">
            Verified handmade from generational cluster artisans with tamper-proof Karu ID tracking.
          </p>
        </div>
        <div>
          <TextLink href={`/craft/${craft.slug}`} arrow>
            Explore {craft.name}
          </TextLink>
        </div>
      </div>

      {/* 9-col Products: 4 columns on desktop / horizontal scroll on mobile */}
      <div
        className={cx(
          "lg:col-span-9",
          reversed ? "lg:order-1" : "lg:order-2"
        )}
      >
        {/* Mobile Scroll / Desktop 4-col Grid */}
        <div className="no-scrollbar -mx-4 flex snap-x gap-4 overflow-x-auto px-4 py-1 pb-4 sm:-mx-6 sm:px-6 md:mx-0 md:px-0 md:grid md:grid-cols-4 md:gap-4">
          {displayItems.map((item) => (
            <div key={item.id} className="w-44 shrink-0 snap-start sm:w-56 md:w-full">
              <ProductCard card={item} variant="grid" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
