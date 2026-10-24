import Link from "next/link";
import { CheckCircle2, ShieldCheck, Star } from "lucide-react";
import { Stars } from "@/components/ui/stars";

export interface ReviewItem {
  id: string;
  quote: string;
  author: string;
  city?: string;
  productTitle?: string;
  productCode?: string;
  rating?: number;
}

export function PatronVoices({ reviews = [] }: { reviews?: ReviewItem[] }) {
  // Spec §6.3 / A5: Data from API only. Fewer than 3 real reviews -> section not rendered!
  if (!reviews || reviews.length < 3) {
    return null;
  }

  const items = reviews.slice(0, 3);

  return (
    <div className="relative w-full overflow-hidden rounded-sm bg-surface-deep px-6 py-12 text-on-dark sm:px-10 lg:px-14 shadow-md">
      <div className="mx-auto max-w-2xl text-center">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3.5 py-1 text-caption font-semibold uppercase tracking-widest text-gold-300">
          <ShieldCheck className="size-3.5 text-gold-400" />
          Words from Our Patrons
        </div>
        <h2 className="mt-4 font-serif text-3xl sm:text-4xl font-medium tracking-tight text-white">
          Cherished by Connoisseurs of Living Craft
        </h2>
        <p className="mt-2 text-body-s text-on-dark/80">
          Only verified purchasers who scanned and owned genuine Karu pieces can review.
        </p>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
        {items.map((t) => (
          <div
            key={t.id}
            className="flex flex-col justify-between rounded-xs border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xs transition-colors hover:bg-white/[0.07]"
          >
            <div>
              <Stars value={t.rating || 5} size={16} />
              <p className="mt-4 font-serif text-body-s italic leading-relaxed text-sand-100">
                &ldquo;{t.quote}&rdquo;
              </p>
            </div>

            <div className="mt-6 border-t border-white/10 pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-body-s font-semibold text-white">{t.author}</p>
                  {t.city && <p className="text-caption text-sand-300/80">{t.city}</p>}
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-peacock-900/60 border border-peacock-400/30 px-2 py-0.5 text-[10px] font-semibold text-peacock-200">
                  <CheckCircle2 className="size-3 text-peacock-400" />
                  Verified
                </span>
              </div>
              {t.productTitle && t.productCode && (
                <Link
                  href={`/p/${t.productCode}`}
                  className="mt-2 block text-caption font-mono text-gold-300 hover:underline truncate"
                >
                  {t.productTitle}
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Backward compatible alias */
export const PatronTestimonials = PatronVoices;
