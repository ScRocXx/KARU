import { CheckCircle2, RotateCcw, ShieldCheck, Truck } from "lucide-react";

export function TrustStrip() {
  const items = [
    { icon: ShieldCheck, title: "Karu ID on Every Piece", subtitle: "Tamper-evident verification tag" },
    { icon: CheckCircle2, title: "Paid Directly to Maker", subtitle: "Zero commission intermediaries" },
    { icon: Truck, title: "Free Shipping Over ₹999", subtitle: "Direct from artisan cluster" },
    { icon: RotateCcw, title: "Authenticity Guarantee", subtitle: "Hassle-free verified returns" },
  ];

  return (
    <div className="w-full rounded-sm border border-line bg-surface p-4 sm:p-6 shadow-2xs">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 divide-y lg:divide-y-0 lg:divide-x divide-line">
        {items.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={item.title}
              className={`flex items-center gap-3.5 pt-3 first:pt-0 lg:pt-0 ${
                idx > 0 ? "lg:ps-6" : ""
              }`}
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xs bg-brand-soft text-brand">
                <Icon className="size-5" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-body-s font-semibold text-text truncate leading-tight">
                  {item.title}
                </span>
                <span className="text-caption text-muted truncate mt-0.5">
                  {item.subtitle}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
