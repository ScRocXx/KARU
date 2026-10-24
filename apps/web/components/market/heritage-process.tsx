import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface HeritageCraft {
  title: string;
  discipline: string;
  region: string;
  description: string;
  image: string;
  slug: string;
}

const HERITAGE_CRAFTS: HeritageCraft[] = [
  {
    title: "The Handloom Weave",
    discipline: "Tussar & Chanderi Silk",
    region: "Bhagalpur, Bihar & Chanderi, MP",
    description: "Thousands of fine warp threads hand-tensioned on timber pit-looms, producing unmatched tactile luster.",
    image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80",
    slug: "sarees",
  },
  {
    title: "Earth, Wheel & Kiln",
    discipline: "Terracotta & Blue Pottery",
    region: "Khurja & Gorakhpur, UP",
    description: "Riverbed clay thrown by hand on momentum wheels, sun-cured and fired in wood-fueled open kilns.",
    image: "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=600&q=80",
    slug: "pottery-terracotta",
  },
  {
    title: "Lost-Wax Dhokra",
    discipline: "4,000-Yr Bell Metal Casting",
    region: "Bastar, Chhattisgarh & Bankura, WB",
    description: "Cire-perdue method: beeswax strings sculpted over clay cores, cast in molten brass — zero identical pieces.",
    image: "https://images.unsplash.com/photo-1606293926075-69a00dbfde81?auto=format&fit=crop&w=600&q=80",
    slug: "metal-brass",
  },
  {
    title: "Carved Teak & Natural Dye",
    discipline: "Handblock Printing",
    region: "Bagru & Sanganer, Rajasthan",
    description: "Hand-carved wooden blocks stamped in rhythm with natural indigo, pomegranate rind, and iron rust paste.",
    image: "https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?auto=format&fit=crop&w=600&q=80",
    slug: "home-textiles",
  },
];

export function HeritageProcess() {
  return (
    <section className="py-10" aria-labelledby="heritage-process-heading">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.22em] text-terracotta-700">
            Living Heritage
          </p>
          <h2
            id="heritage-process-heading"
            className="mt-1 font-serif text-3xl font-medium tracking-tight text-ink-950 sm:text-4xl"
          >
            Rooted in Heritage
          </h2>
          <p className="mt-2 max-w-xl text-sm text-ink-600 sm:text-base">
            Centuries of generational mastery preserved without synthetic shortcut. Every gesture is deliberate, every mark is human.
          </p>
        </div>
        <Link
          href="/verification-explained"
          className="group inline-flex items-center gap-1.5 self-start sm:self-end text-xs font-semibold uppercase tracking-wider text-terracotta-800 hover:text-terracotta-900 transition-colors"
        >
          Our Verification Standard
          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      {/* 4-Card Editorial Photo Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {HERITAGE_CRAFTS.map((craft) => (
          <Link
            key={craft.title}
            href={`/c/${craft.slug}`}
            className="group relative flex flex-col justify-end overflow-hidden rounded-[20px] aspect-[3/4] bg-sand-200 p-6 text-white transition-all duration-300 hover:shadow-lg"
          >
            {/* Background Image */}
            <img
              src={craft.image}
              alt={craft.title}
              loading="lazy"
              className="absolute inset-0 size-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10 transition-opacity group-hover:opacity-95" />

            {/* Content pinned to bottom */}
            <div className="relative z-10 flex flex-col gap-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-haldi-400">
                {craft.discipline}
              </span>
              <h3 className="font-serif text-xl font-medium leading-snug text-white">
                {craft.title}
              </h3>
              <p className="line-clamp-2 text-xs leading-relaxed text-white/80">
                {craft.description}
              </p>
              <div className="mt-2 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-sand-100 group-hover:text-white transition-colors">
                <span>Explore Discipline</span>
                <ArrowRight className="size-3 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
