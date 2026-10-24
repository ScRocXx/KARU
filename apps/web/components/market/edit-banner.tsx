import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EditBanner() {
  const categories = [
    { label: "Handloom Sarees", href: "/c/sarees" },
    { label: "Dupattas & Stoles", href: "/c/dupattas-stoles" },
    { label: "Handwoven Fabrics", href: "/c/kurtas-fabric" },
    { label: "Festive Living & Clay", href: "/c/pottery-terracotta" },
  ];

  return (
    <div className="relative w-full overflow-hidden rounded-sm border border-line bg-gradient-to-br from-terracotta-900 via-terracotta-800 to-ink-950 text-white min-h-[480px] lg:min-h-[520px] flex items-center shadow-sm">
      <div className="mx-auto w-full max-w-[1360px] px-6 sm:px-10 lg:px-14 py-12 lg:py-16 grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-12 items-center">
        {/* Left Side: Editorial Story */}
        <div className="flex flex-col gap-5 max-w-xl">
          <span className="text-eyebrow text-gold-300">
            The Karu Edit · Autumn Festive
          </span>
          <h2 className="text-display font-medium text-white leading-tight">
            Wedding Trousseau & Heirloom Weaves
          </h2>
          <p className="text-body-l text-sand-100/85 leading-relaxed">
            Directly from master weaver pit-looms in Bhagalpur and Varanasi. Certified pure mulberry and tussar silks without mill synthetic shortcuts.
          </p>
          <div className="pt-2">
            <Link href="/search?verified=true">
              <Button
                variant="secondary"
                size="L"
                className="border-white text-white hover:bg-white hover:text-ink-950"
              >
                Shop the Edit
              </Button>
            </Link>
          </div>
        </div>

        {/* Right Side: Vertical Link List Split by Hairline */}
        <div className="flex flex-col divide-y divide-white/15 border-y border-white/15 lg:border-s lg:border-y-0 lg:ps-12">
          {categories.map((cat) => (
            <Link
              key={cat.label}
              href={cat.href}
              className="group flex items-center justify-between py-4 text-body font-serif transition-colors hover:text-gold-300"
            >
              <span>{cat.label}</span>
              <ArrowRight className="size-4 flip-rtl text-gold-400 opacity-60 transition-transform group-hover:translate-x-1 group-hover:opacity-100" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
