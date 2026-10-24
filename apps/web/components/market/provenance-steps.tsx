import Link from "next/link";
import { ArrowRight, QrCode, Shield, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { Woven } from "@/components/karu/ornaments";

export function ProvenanceSteps() {
  const t = useTranslations("home");

  const steps = [
    {
      step: "01",
      title: t("how.passport.title"),
      body: t("how.passport.body"),
      icon: Shield,
    },
    {
      step: "02",
      title: t("how.karu_id.title"),
      body: t("how.karu_id.body"),
      icon: Sparkles,
    },
    {
      step: "03",
      title: t("how.scan.title"),
      body: t("how.scan.body"),
      icon: QrCode,
    },
  ];

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
        {steps.map((s, idx) => {
          const Icon = s.icon;
          return (
            <div
              key={s.step}
              className="flex flex-col justify-between gap-4 rounded-sm border border-line bg-surface p-6 sm:p-8 transition-all hover:border-brand"
            >
              <div className="flex items-center justify-between">
                <span className="font-serif text-3xl font-light text-brand">
                  {s.step}
                </span>
                <span className="flex size-10 items-center justify-center rounded-full bg-surface-alt text-brand">
                  <Icon className="size-5" />
                </span>
              </div>
              <div>
                <h3 className="font-serif text-h3 text-text font-medium">{s.title}</h3>
                <p className="mt-2 text-body-s text-muted leading-relaxed">{s.body}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 text-center">
        <Link
          href="/verification-explained"
          className="inline-flex items-center gap-1.5 text-eyebrow text-brand hover:text-brand-hover hover:underline"
        >
          <span>Explore how Karu verifies craft</span>
          <ArrowRight className="size-3.5 flip-rtl" />
        </Link>
      </div>
    </div>
  );
}
