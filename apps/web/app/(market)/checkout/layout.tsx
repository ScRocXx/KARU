import { Lock } from "lucide-react";
import Link from "next/link";
import { Wordmark } from "@/components/karu/badges";

export const metadata = {
  title: "Secure Checkout · Karu",
};

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-surface-alt">
      {/* Minimal Distraction-Free Checkout Header */}
      <header className="border-b border-line bg-surface py-4">
        <div className="container-page flex items-center justify-between">
          <Link href="/" aria-label="Karu Home">
            <Wordmark />
          </Link>

          <div className="flex items-center gap-2 text-caption font-semibold uppercase tracking-wider text-muted">
            <Lock className="size-3.5 text-verified" />
            <span>Secure 256-Bit Checkout</span>
          </div>

          <Link
            href="/cart"
            className="text-caption text-brand underline underline-offset-4 hover:text-brand-hover"
          >
            ← Back to Bag
          </Link>
        </div>
      </header>

      <main>{children}</main>
    </div>
  );
}
