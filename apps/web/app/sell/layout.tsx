import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { ArtisanBottomNav, ArtisanHeader, UploadQueueBanner } from "@/components/artisan/shell";
import { Providers } from "@/components/providers";

export const metadata: Metadata = { title: { default: "Karu for makers", template: "%s · Karu for makers" } };

/** Artisan dashboard: mobile-first PWA, light only, 48 px targets (Part 1 §4.1, §9). */
export default async function SellLayout({ children }: { children: React.ReactNode }) {
  const [locale, messages] = await Promise.all([getLocale(), getMessages()]);
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <Providers pwa>
        <div className="min-h-dvh bg-khadi-50 text-[17px]">
          <ArtisanHeader />
          <div className="px-4">
            <UploadQueueBanner />
          </div>
          <main>{children}</main>
          <ArtisanBottomNav />
        </div>
      </Providers>
    </NextIntlClientProvider>
  );
}
