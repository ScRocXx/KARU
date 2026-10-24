import { Amphora, Axe, BedDouble, Bell, Footprints, Gem, Palette, Scissors, Shirt, Sparkles, ToyBrick, Trees, Wind } from "lucide-react";

const ICONS = {
  sarees: Shirt,
  "dupattas-stoles": Wind,
  "kurtas-fabric": Scissors,
  "home-textiles": BedDouble,
  "pottery-terracotta": Amphora,
  woodcraft: Axe,
  "metal-brass": Bell,
  jewellery: Gem,
  "bamboo-cane": Trees,
  paintings: Palette,
  leather: Footprints,
  toys: ToyBrick,
  other: Sparkles,
} as const;

export function CategoryIcon({ slug, className }: { slug: string; className?: string }) {
  const Icon = ICONS[slug as keyof typeof ICONS] || Sparkles;
  return <Icon className={className} aria-hidden />;
}
