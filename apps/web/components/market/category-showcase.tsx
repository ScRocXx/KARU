import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CategoryIcon } from "./category-icon";

const CATEGORY_IMAGES: Record<string, string> = {
  sarees: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=320&q=80",
  "dupattas-stoles": "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=320&q=80",
  "kurtas-fabric": "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=320&q=80",
  "home-textiles": "https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?auto=format&fit=crop&w=320&q=80",
  "pottery-terracotta": "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=320&q=80",
  woodcraft: "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=320&q=80",
  "metal-brass": "https://images.unsplash.com/photo-1606293926075-69a00dbfde81?auto=format&fit=crop&w=320&q=80",
  jewellery: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=320&q=80",
  "bamboo-cane": "https://images.unsplash.com/photo-1584589167171-541ce45f1eea?auto=format&fit=crop&w=320&q=80",
  paintings: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=320&q=80",
  toys: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=320&q=80",
};

interface CategoryItem {
  slug: string;
  name: string;
  icon: string;
  count: number;
}

export function CategoryShowcase({ categories }: { categories: CategoryItem[] }) {
  // Filter out empty or "other" if desired, or show primary craft categories
  const featured = categories.filter((c) => c.slug !== "other").slice(0, 8);

  return (
    <section className="py-6" aria-labelledby="cat-showcase-heading">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-terracotta-700">
            Craft Disciplines
          </p>
          <h2 id="cat-showcase-heading" className="font-serif text-2xl font-medium tracking-tight text-ink-950 sm:text-3xl">
            Explore by Craft
          </h2>
        </div>
        <Link
          href="/categories"
          className="group inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-terracotta-800 hover:text-terracotta-900 transition-colors"
        >
          All Categories
          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      {/* Circular portal row / responsive grid */}
      <div className="no-scrollbar -mx-4 flex gap-5 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 md:mx-0 md:px-0 md:grid md:grid-cols-4 lg:grid-cols-8 md:gap-4">
        {featured.map((cat) => {
          const img = CATEGORY_IMAGES[cat.slug];
          return (
            <Link
              key={cat.slug}
              href={`/c/${cat.slug}`}
              className="group flex w-24 shrink-0 flex-col items-center gap-2.5 text-center sm:w-28 md:w-full"
            >
              {/* Circular Portal Frame */}
              <div className="relative aspect-square size-20 sm:size-24 rounded-full p-1 ring-1 ring-sand-200/90 transition-all duration-300 group-hover:ring-2 group-hover:ring-terracotta-700/80 group-hover:scale-105">
                <div className="relative size-full overflow-hidden rounded-full bg-sand-100 shadow-2xs">
                  {img ? (
                    <img
                      src={img}
                      alt={cat.name}
                      loading="lazy"
                      className="size-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center bg-sand-200 text-terracotta-800">
                      <CategoryIcon slug={cat.slug} className="size-7" />
                    </div>
                  )}
                  {/* Subtle dark gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
              </div>

              {/* Label */}
              <div className="flex flex-col items-center">
                <span className="font-serif text-[13px] font-medium leading-tight text-ink-900 group-hover:text-terracotta-800 transition-colors">
                  {cat.name}
                </span>
                <span className="text-[10px] text-ink-500 uppercase tracking-widest mt-0.5">
                  {cat.count > 0 ? `${cat.count} pieces` : "Explore"}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
