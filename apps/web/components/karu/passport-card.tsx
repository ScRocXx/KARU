"use client";

import { BadgeCheck, Download } from "lucide-react";
import { useTranslations } from "next-intl";
import { date } from "@/lib/format";
import type { Maker } from "@/lib/types";
import { MakerAvatar } from "./maker-card";

/** PassportCard: luxury-label style, woven border, exports as an image (Part 1 §9.6). */
export function PassportCard({ maker, locale, exportable }: { maker: Maker; locale: string; exportable?: boolean }) {
  const t = useTranslations("passport");
  const verified = maker.passport.state === "verified";

  const download = async () => {
    const W = 1080;
    const H = 640;
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#1F2A6B";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#FBF8F2";
    ctx.fillRect(24, 24, W - 48, H - 48);
    for (let x = 24; x < W - 24; x += 14) {
      ctx.fillStyle = (x / 14) % 2 ? "#E3A72F" : "#1F2A6B";
      ctx.fillRect(x, 24, 8, 6);
      ctx.fillRect(x, H - 30, 8, 6);
    }
    ctx.fillStyle = "#1F2A6B";
    ctx.font = "600 44px Georgia, serif";
    ctx.fillText("karu", 64, 100);
    ctx.font = "600 22px sans-serif";
    ctx.fillStyle = "#5C554D";
    ctx.fillText(t("title").toUpperCase(), 64, 140);
    if (maker.photo_url) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = maker.photo_url;
      await new Promise((r) => {
        img.onload = r;
        img.onerror = r;
      });
      if (img.complete && img.naturalWidth) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(170, 330, 110, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(img, 60, 220, 220, 220);
        ctx.restore();
      }
    }
    ctx.fillStyle = "#1E1A16";
    ctx.font = "600 52px Georgia, serif";
    ctx.fillText(maker.name, 330, 290);
    ctx.font = "26px sans-serif";
    ctx.fillStyle = "#5C554D";
    ctx.fillText(maker.place, 330, 336);
    ctx.fillText(t("member_since", { date: date(maker.passport.member_since, locale) }), 330, 380);
    ctx.font = "600 30px monospace";
    ctx.fillStyle = "#1F2A6B";
    ctx.fillText(maker.passport.code || "", 330, 440);
    ctx.fillStyle = verified ? "#11756B" : "#7A736B";
    ctx.beginPath();
    ctx.roundRect(330, 480, verified ? 330 : 360, 56, 28);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = "600 26px sans-serif";
    ctx.fillText(verified ? t("state.verified") : t("state.unverified"), 356, 517);
    const a = document.createElement("a");
    a.href = c.toDataURL("image/png");
    a.download = `karu-passport-${maker.passport.code}.png`;
    a.click();
  };

  return (
    <div className="relative overflow-hidden rounded-[20px] bg-indigo-900 p-1.5 text-ink-900 shadow-[var(--shadow-soft)]">
      <div className="woven-border rounded-[16px] bg-khadi-50 p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-display text-2xl font-semibold text-indigo-900">karu</p>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-600">{t("title")}</p>
          </div>
          {verified ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-peacock-600 px-3 py-1 text-sm font-semibold text-white">
              <BadgeCheck className="size-4" /> {t("state.verified")}
            </span>
          ) : maker.passport.state === "suspended" ? (
            <span className="rounded-full bg-danger-600 px-3 py-1 text-sm font-semibold text-white">{t("state.suspended")}</span>
          ) : (
            <span className="rounded-full bg-unverified px-3 py-1 text-sm font-semibold text-white">{t("state.unverified")}</span>
          )}
        </div>
        <div className="mt-5 flex items-center gap-4">
          <MakerAvatar maker={maker} size={84} />
          <div className="min-w-0">
            <p className="font-display truncate text-2xl">{maker.name}</p>
            <p className="truncate text-sm text-ink-600">{maker.place}</p>
            {maker.crafts.length > 0 && <p className="truncate text-sm text-ink-600">{maker.crafts.join(" · ")}</p>}
          </div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 border-t border-dashed border-ink-300 pt-4 text-sm">
          <div>
            <p className="text-xs uppercase tracking-wider text-ink-600">{t("id")}</p>
            <p className="font-mono text-base font-semibold text-indigo-900">{maker.passport.code}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-ink-600">{t("since")}</p>
            <p className="font-semibold">{date(maker.passport.member_since, locale)}</p>
          </div>
          {maker.stats && (
            <>
              <div>
                <p className="text-xs uppercase tracking-wider text-ink-600">{t("verified_pieces")}</p>
                <p className="font-semibold">{maker.stats.verified_products}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-ink-600">{t("rating")}</p>
                <p className="font-semibold">{maker.stats.rating ? `${maker.stats.rating} ★ (${maker.stats.reviews})` : "—"}</p>
              </div>
            </>
          )}
        </div>
        {exportable && (
          <button onClick={download} className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-full border border-indigo-900 px-4 text-sm font-semibold text-indigo-900 hover:bg-indigo-50">
            <Download className="size-4" /> {t("save_image")}
          </button>
        )}
      </div>
    </div>
  );
}
