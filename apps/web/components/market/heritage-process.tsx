import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { TextLink } from "@/components/ui/text-link";
import { cx } from "@/lib/format";

interface HeritageTile {
  title: string;
  discipline: string;
  region: string;
  caption: string;
  slug: string;
  fallbackIcon: string;
}

const CRAFT_TECHNIQUES: HeritageTile[] = [
  {
    title: "Handloom Weave",
    discipline: "Tussar & Chanderi Silk",
    region: "Bhagalpur & Chanderi",
    caption: "Thousands of warp threads aligned by hand on wooden pit-looms over weeks.",
    slug: "sarees",
    fallbackIcon: "loom",
  },
  {
    title: "Wheel & Kiln",
    discipline: "Terracotta Pottery",
    region: "Khurja & Gorakhpur",
    caption: "Hand-thrown riverbed clay cured in sun and fired in wood-fueled open kilns.",
    slug: "pottery-terracotta",
    fallbackIcon: "wheel",
  },
  {
    title: "Lost-Wax Dhokra",
    discipline: "Bell Metal Casting",
    region: "Bastar & Bankura",
    caption: "4,000-year-old cire-perdue method: beeswax strings sculpted over clay cores.",
    slug: "metal-brass",
    fallbackIcon: "needle",
  },
  {
    title: "Hand-Block Dye",
    discipline: "Teakwood Block Print",
    region: "Bagru & Sanganer",
    caption: "Carved teakwood blocks stamped in rhythm with natural indigo and pomegranate rind.",
    slug: "home-textiles",
    fallbackIcon: "basket",
  },
];

export function HeritageGrid() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
      {/* 4-col Copy Block on Desktop */}
      <div className="lg:col-span-4 flex flex-col justify-between h-full">
        <div>
          <p className="text-eyebrow text-brand mb-2">Living Heritage</p>
          <h2 className="text-h2 text-text">Rooted in Heritage</h2>
          <p className="mt-3 text-body text-muted leading-relaxed">
            Centuries of generational mastery preserved without synthetic shortcut. Every gesture is deliberate, every mark is human.
          </p>
        </div>
        <div className="mt-6 lg:mt-10">
          <TextLink href="/categories" arrow>
            Explore all craft disciplines
          </TextLink>
        </div>
      </div>

      {/* 8-col 4-Tile Grid on Desktop / 2x2 on Mobile */}
      <div className="lg:col-span-8 grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {CRAFT_TECHNIQUES.map((tech) => (
          <Link
            key={tech.title}
            href={`/c/${tech.slug}`}
            className="group flex flex-col gap-3 rounded-sm border border-line bg-surface p-4 transition-all duration-200 hover:border-brand hover:shadow-sm"
          >
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xs bg-surface-alt border border-line-strong flex items-center justify-center p-3">
              <span className="font-serif text-3xl font-medium text-brand/70 group-hover:scale-110 transition-transform">
                {tech.title[0]}
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-brand">
                {tech.region}
              </span>
              <h3 className="font-serif text-body font-medium text-text group-hover:text-brand transition-colors line-clamp-1">
                {tech.title}
              </h3>
              <div className="my-1.5 h-px w-6 bg-line group-hover:w-10 group-hover:bg-brand transition-all" />
              <p className="text-caption text-muted line-clamp-2 leading-relaxed">
                {tech.caption}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
