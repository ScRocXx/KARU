import { CheckCircle2, ShieldCheck, Star } from "lucide-react";

interface Testimonial {
  quote: string;
  author: string;
  city: string;
  piece: string;
  tag: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "The handloom drape and micro-texture are unmistakable. When I scanned the Karu ID on the tag, watching Ramesh weaving on the exact loom in Bhagalpur made it the most meaningful heirloom in my wardrobe.",
    author: "Ananya Sharma",
    city: "New Delhi",
    piece: "Bhagalpuri Handloom Tussar Saree",
    tag: "Karu ID Scanned & Verified",
  },
  {
    quote:
      "In an era where machine factories flood the market with polyester replicas, Karu's proof engine is revolutionary. Fair pricing, unedited video evidence, and 100% direct payment to the weaver.",
    author: "Vikramaditya Roy",
    city: "Bengaluru",
    piece: "Pure Kosa Silk Stole",
    tag: "Verified Heritage Patron",
  },
  {
    quote:
      "The terracotta vessel has that distinct earthen aroma and tactile wheel spirals that machine molds cannot duplicate. It arrived securely with its tamper-evident Karu ID hallmark tag intact.",
    author: "Meera Kulkarni",
    city: "Mumbai",
    piece: "Khurja Hand-Thrown Urn",
    tag: "Karu ID Scanned & Verified",
  },
];

export function PatronTestimonials() {
  return (
    <section className="relative my-10 overflow-hidden rounded-[28px] bg-[#1E251E] px-6 py-12 text-khadi-50 sm:px-10 lg:px-14 shadow-lg">
      {/* Decorative subtle texture watermark */}
      <div className="pointer-events-none absolute -bottom-16 -left-16 size-80 rounded-full border border-sand-100/10 opacity-30" />

      {/* Header */}
      <div className="mx-auto max-w-2xl text-center">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3.5 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-sand-200">
          <ShieldCheck className="size-3.5 text-haldi-400" />
          Words from Our Community
        </div>
        <h2 className="mt-4 font-serif text-3xl font-medium tracking-tight text-white sm:text-4xl">
          Cherished by Connoisseurs of Living Craft
        </h2>
        <p className="mt-2 text-sm text-sand-200/80 sm:text-base">
          Patrons who value the integrity of human hands over factory uniformity.
        </p>
      </div>

      {/* 3-Column Testimonial Cards */}
      <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
        {TESTIMONIALS.map((t, i) => (
          <div
            key={i}
            className="flex flex-col justify-between rounded-[20px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xs transition-colors hover:bg-white/[0.07]"
          >
            <div>
              {/* 5-star rating */}
              <div className="flex items-center gap-1 text-gold-400">
                {[...Array(5)].map((_, s) => (
                  <Star key={s} className="size-4 fill-gold-400 text-gold-400" />
                ))}
              </div>

              {/* Quote */}
              <p className="mt-4 font-serif text-[15px] italic leading-relaxed text-sand-100">
                &ldquo;{t.quote}&rdquo;
              </p>
            </div>

            {/* Author info */}
            <div className="mt-6 border-t border-white/10 pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm text-white">{t.author}</p>
                  <p className="text-xs text-sand-300/80">{t.city}</p>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-peacock-900/60 border border-peacock-400/30 px-2.5 py-0.5 text-[10px] font-medium text-peacock-200">
                  <CheckCircle2 className="size-3 text-peacock-400" />
                  Verified
                </span>
              </div>
              <p className="mt-2 text-[11px] font-mono text-sand-400 truncate">
                Piece: {t.piece}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Trust Guarantee Strip */}
      <div className="mt-12 flex flex-wrap items-center justify-around gap-6 border-t border-white/10 pt-8 text-center text-xs tracking-wider uppercase text-sand-300">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-gold-400" />
          <span>100% Proven Artisan Lineage</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-gold-400" />
          <span>Physical Karu ID QR with Making Video</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-gold-400" />
          <span>Zero Machine Replicas</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-gold-400" />
          <span>Direct Payout to Artisan Bank Accounts</span>
        </div>
      </div>
    </section>
  );
}
