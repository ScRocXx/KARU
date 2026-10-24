import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { AdminShell } from "@/components/admin/shell";
import { Providers } from "@/components/providers";

export const metadata = { title: { default: "Karu staff", template: "%s · Karu staff" }, robots: { index: false } };

// Staff console is English-only (internal tool); shared components still get the message catalogue.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const [locale, messages] = await Promise.all([getLocale(), getMessages()]);
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <Providers>
        <div dir="ltr" lang="en">
          <AdminShell>{children}</AdminShell>
        </div>
      </Providers>
    </NextIntlClientProvider>
  );
}
