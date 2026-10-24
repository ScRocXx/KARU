"use client";

import { BadgeCheck, Pause, Play, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { api } from "@/lib/api";
import { cx } from "@/lib/format";
import { useMe } from "@/lib/hooks";
import type { Maker } from "@/lib/types";

export function MakerAvatar({ maker, size = 56 }: { maker: Pick<Maker, "photo_url" | "name">; size?: number }) {
  return maker.photo_url ? (
    <img src={maker.photo_url} alt="" width={size} height={size} className="shrink-0 rounded-full object-cover" style={{ width: size, height: size }} />
  ) : (
    <span className="flex shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-900" style={{ width: size, height: size }}>
      <UserRound className="size-1/2" />
    </span>
  );
}

export function ListenButton({ url, name }: { url: string; name: string }) {
  const t = useTranslations("maker");
  const ref = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => {
          const a = ref.current;
          if (!a) return;
          if (a.paused) void a.play();
          else a.pause();
        }}
        className="inline-flex min-h-10 items-center gap-2 rounded-full bg-indigo-50 px-3.5 text-sm font-semibold text-indigo-900 hover:bg-indigo-900 hover:text-white"
      >
        {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
        {t("listen", { name: name.split(" ")[0] })}
      </button>
      <audio ref={ref} src={url} preload="none" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)} />
    </>
  );
}

export function FollowButton({ artisanId, initial }: { artisanId: string; initial?: boolean }) {
  const t = useTranslations("maker");
  const router = useRouter();
  const { data: me } = useMe();
  const [following, setFollowing] = useState(!!initial);
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        if (!me) {
          router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
          return;
        }
        setBusy(true);
        try {
          await api(`/follows/${artisanId}`, { method: following ? "DELETE" : "POST" });
          setFollowing(!following);
        } finally {
          setBusy(false);
        }
      }}
      className={cx(
        "min-h-10 rounded-full px-4 text-sm font-semibold transition-colors",
        following ? "border border-ink-300 bg-white text-ink-900" : "bg-indigo-900 text-white hover:bg-indigo-700",
      )}
      aria-pressed={following}
    >
      {following ? t("following") : t("follow")}
    </button>
  );
}

/** MakerCard: photo, name, cluster, passport state, follow, listen (Part 1 §9.6). */
export function MakerCard({ maker, compact }: { maker: Maker; compact?: boolean }) {
  const t = useTranslations("maker");
  return (
    <div className={cx("flex gap-3 rounded-[12px] border border-ink-100 bg-white", compact ? "p-3" : "p-4")}>
      <Link href={`/m/${maker.handle}`}>
        <MakerAvatar maker={maker} size={compact ? 48 : 64} />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <Link href={`/m/${maker.handle}`} className="font-display truncate text-lg text-ink-900 hover:underline">
          {maker.name}
        </Link>
        <p className="truncate text-sm text-ink-600">{maker.place}</p>
        <p className="flex items-center gap-1 text-xs font-semibold">
          {maker.passport.state === "verified" ? (
            <span className="inline-flex items-center gap-1 text-peacock-600">
              <BadgeCheck className="size-4" /> {t("passport_verified")}
            </span>
          ) : (
            <span className="text-ink-600">{t("passport_unverified")}</span>
          )}
          {maker.years_of_practice ? <span className="text-ink-600">· {t("years", { n: maker.years_of_practice })}</span> : null}
        </p>
        {!compact && (
          <div className="mt-1 flex flex-wrap gap-2">
            <FollowButton artisanId={maker.id} initial={maker.following} />
            {maker.voice_url && <ListenButton url={maker.voice_url} name={maker.name} />}
          </div>
        )}
      </div>
    </div>
  );
}
