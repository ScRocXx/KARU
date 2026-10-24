import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Woven } from "@/components/karu/badges";

// Content pages: about, help, terms, privacy, verification-explained (Part 1 §5 sitemap).
const PAGES = ["about", "help", "terms", "privacy", "verification-explained"] as const;
type Page = (typeof PAGES)[number];

export async function generateMetadata({ params }: { params: Promise<{ page: string }> }): Promise<Metadata> {
  const { page } = await params;
  if (!PAGES.includes(page as Page)) return {};
  const t = await getTranslations(`pages.${page.replace("-", "_")}`);
  return { title: t("title") };
}

export default async function ContentPage({ params }: { params: Promise<{ page: string }> }) {
  const { page } = await params;
  if (!PAGES.includes(page as Page)) notFound();
  const key = page.replace("-", "_");
  const t = await getTranslations(`pages.${key}`);
  const sections = t.raw("sections") as { h: string; p: string }[];
  return (
    <article className="mx-auto max-w-3xl py-10">
      <h1 className="font-display text-[32px] leading-tight md:text-5xl">{t("title")}</h1>
      <p className="mt-3 text-[17px] text-ink-600">{t("lead")}</p>
      <Woven className="my-8" />
      <div className="flex flex-col gap-7">
        {sections.map((s) => (
          <section key={s.h}>
            <h2 className="font-display mb-2 text-2xl">{s.h}</h2>
            <p className="whitespace-pre-line text-[16px] leading-relaxed text-ink-900">{s.p}</p>
          </section>
        ))}
      </div>
    </article>
  );
}
