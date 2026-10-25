import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ProvenanceSteps } from "@/components/market/provenance-steps";
import { Button } from "@/components/ui/button";

const PAGES = ["about", "help", "terms", "privacy", "verification-explained"] as const;
type Page = (typeof PAGES)[number];

export async function generateMetadata({ params }: { params: Promise<{ page: string }> }): Promise<Metadata> {
  const { page } = await params;
  if (!PAGES.includes(page as Page)) return {};
  const t = await getTranslations(`pages.${page.replace("-", "_")}`);
  return { title: `${t("title")} · Karu` };
}

export default async function ContentPage({ params }: { params: Promise<{ page: string }> }) {
  const { page } = await params;
  if (!PAGES.includes(page as Page)) notFound();
  const key = page.replace("-", "_");
  const t = await getTranslations(`pages.${key}`);
  const sections = (t.raw("sections") as { h: string; p: string }[]) || [];

  return (
    <div className="w-full">
      {/* Header Band */}
      <header className="border-b border-line bg-surface-alt py-12 lg:py-16">
        <div className="container-page text-center">
          <span className="text-eyebrow text-brand">Karu Documentation</span>
          <h1 className="font-serif text-display text-ink-900 mt-2">
            {t("title")}
          </h1>
          <p className="mx-auto max-w-xl text-body-l text-muted mt-3">
            {t("lead")}
          </p>
        </div>
      </header>

      {page === "verification-explained" && (
        <section className="bg-surface py-12 border-b border-line">
          <ProvenanceSteps />
        </section>
      )}

      {/* Main 3/9 Layout with Sticky Table of Contents on Desktop */}
      <div className="container-page py-12 lg:py-16">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 items-start">
          {/* Table of Contents (3 cols) */}
          <aside className="hidden lg:col-span-3 lg:block lg:sticky lg:top-28">
            <div className="rounded-xs border border-line bg-surface-alt p-5 shadow-xs">
              <span className="text-eyebrow text-ink-900 block mb-3">On this page</span>
              <nav className="flex flex-col gap-2">
                {sections.map((s, i) => (
                  <a
                    key={s.h}
                    href={`#section-${i}`}
                    className="text-body-s text-muted hover:text-brand transition-colors line-clamp-1"
                  >
                    {s.h}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          {/* Prose Content (9 cols) */}
          <article className="lg:col-span-9 flex flex-col gap-10 max-w-prose">
            {sections.map((s, i) => (
              <section key={s.h} id={`section-${i}`} className="scroll-mt-28">
                <h2 className="font-serif text-h2 text-ink-900 mb-3 border-b border-line pb-2">
                  {s.h}
                </h2>
                <p className="whitespace-pre-line text-body text-ink-900 leading-relaxed">
                  {s.p}
                </p>
              </section>
            ))}

            {page === "verification-explained" && (
              <div className="mt-6 rounded-sm border border-line bg-surface-alt p-6 flex flex-col gap-3">
                <h3 className="font-serif text-h3 text-ink-900">Explore verified craft pieces</h3>
                <p className="text-body-s text-muted">
                  Inspect authentic Karu ID certificates with craft heritage records and direct maker provenance.
                </p>
                <div>
                  <Link href="/search?verified=true">
                    <Button variant="primary" size="M">
                      See Verified Pieces
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </article>
        </div>
      </div>
    </div>
  );
}
