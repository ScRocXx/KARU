import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { MarketBottomNav, MarketFooter, MarketHeader } from "@/components/market/chrome";
import { Providers } from "@/components/providers";

export default async function MarketLayout({ children }: { children: React.ReactNode }) {
  const [locale, messages] = await Promise.all([getLocale(), getMessages()]);
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <Providers>
        <MarketHeader />
        <main className="mx-auto min-h-[60vh] w-full max-w-[1360px] px-4 sm:px-6 lg:px-8 pb-24 md:pb-16">{children}</main>
        <MarketFooter />
        <MarketBottomNav />
      </Providers>
    </NextIntlClientProvider>
  );
}
