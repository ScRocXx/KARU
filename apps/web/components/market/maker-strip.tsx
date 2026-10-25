"use client";

import { BadgeCheck } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { MakerAvatar } from "@/components/karu/maker-card";
import type { Maker } from "@/lib/types";

export function MakerStrip({ makers }: { makers: Maker[] }) {
  const t = useTranslations("maker");
  return (
    <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
      {makers.map((m) => (
        <Link key={m.id} href={`/m/${m.handle}`} className="flex w-64 shrink-0 flex-col gap-3 rounded-sm border border-ink-100 bg-white p-4 hover:border-brand/30">
          <div className="flex items-center gap-3">
            <MakerAvatar maker={m} size={56} />
            <div className="min-w-0">
              <p className="font-display truncate text-lg">{m.name}</p>
              <p className="truncate text-xs text-ink-600">{m.place}</p>
            </div>
          </div>
          {m.story && <p className="line-clamp-3 text-sm text-ink-600">“{m.story}”</p>}
          <p className="mt-auto flex items-center gap-1 text-xs font-semibold">
            {m.passport.state === "verified" ? (
              <span className="inline-flex items-center gap-1 text-peacock-600">
                <BadgeCheck className="size-4" /> {t("passport_verified")}
              </span>
            ) : (
              <span className="text-ink-600">{t("passport_unverified")}</span>
            )}
          </p>
        </Link>
      ))}
    </div>
  );
}
