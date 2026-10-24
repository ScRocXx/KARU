"use client";

import { Loader2, X } from "lucide-react";
import {
  forwardRef,
  useEffect,
  useId,
  useRef,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { useTranslations } from "next-intl";
import { cx } from "@/lib/format";

type Variant = "primary" | "secondary" | "tertiary" | "danger" | "verified";
type Size = "L" | "M" | "S";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-terracotta-800 text-white hover:bg-terracotta-900 shadow-xs disabled:bg-sand-200 disabled:text-ink-400 border border-terracotta-900/10",
  secondary: "border border-sand-200 text-ink-900 bg-white hover:bg-sand-50 hover:border-sand-300 disabled:border-sand-100 disabled:text-ink-300 shadow-2xs",
  tertiary: "text-terracotta-800 hover:bg-terracotta-50 disabled:text-ink-300",
  danger: "bg-danger-600 text-white hover:opacity-90 disabled:bg-sand-200",
  verified: "bg-peacock-700 text-white hover:bg-peacock-800 shadow-xs border border-peacock-600/30",
};
const SIZES: Record<Size, string> = {
  L: "min-h-12 px-6 text-[15px] gap-2 rounded-full font-medium tracking-wide",
  M: "min-h-10 px-5 text-[14px] gap-2 rounded-full font-medium tracking-wide",
  S: "min-h-8.5 px-3.5 text-xs gap-1.5 rounded-full font-medium tracking-wide",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
  block?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "M", loading, icon, block, className, children, disabled, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cx(
        "inline-flex items-center justify-center transition-all duration-150 disabled:cursor-not-allowed select-none active:scale-[0.98]",
        VARIANTS[variant],
        SIZES[size],
        block && "w-full",
        className,
      )}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <Loader2 className="size-4.5 animate-spin" aria-hidden /> : icon}
      {children}
    </button>
  );
});

export function Card({ className, children, ...rest }: { className?: string; children: ReactNode } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cx("rounded-[16px] border border-sand-100 bg-white shadow-soft transition-all", className)} {...rest}>
      {children}
    </div>
  );
}

export function Field({ label, hint, error, children, htmlFor }: { label?: ReactNode; hint?: ReactNode; error?: ReactNode; children: ReactNode; htmlFor?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={htmlFor} className="text-xs font-semibold uppercase tracking-wider text-ink-800">
          {label}
        </label>
      )}
      {children}
      {hint && !error && <p className="text-xs text-ink-600">{hint}</p>}
      {error && (
        <p role="alert" className="text-xs font-medium text-danger-600">
          {error}
        </p>
      )}
    </div>
  );
}

const inputBase =
  "w-full rounded-[10px] border border-sand-200 bg-white px-3.5 py-2.5 text-[15px] text-ink-900 placeholder:text-ink-400 focus:border-terracotta-700 focus:outline-none focus:ring-2 focus:ring-terracotta-700/15 disabled:bg-sand-50 transition-all";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...rest }, ref) {
  return <input ref={ref} className={cx(inputBase, "min-h-11", className)} {...rest} />;
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea(
  { className, ...rest },
  ref,
) {
  return <textarea ref={ref} className={cx(inputBase, "min-h-24", className)} {...rest} />;
});

export function Select({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cx(inputBase, "min-h-11 pe-8", className)} {...rest}>
      {children}
    </select>
  );
}

export function Switch({ checked, onChange, label, description, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: ReactNode; description?: ReactNode; disabled?: boolean }) {
  const id = useId();
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <label htmlFor={id} className="font-semibold text-ink-900 text-sm">
          {label}
        </label>
        {description && <p className="text-xs text-ink-600">{description}</p>}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cx("tap relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors", checked ? "bg-peacock-700" : "bg-sand-200")}
      >
        <span className={cx("inline-block size-5 rounded-full bg-white shadow-xs transition-transform", checked ? "translate-x-6 rtl:-translate-x-6" : "translate-x-1 rtl:-translate-x-1")} />
      </button>
    </div>
  );
}

export function Chip({ active, onClick, children, className }: { active?: boolean; onClick?: () => void; children: ReactNode; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cx(
        "inline-flex min-h-8.5 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 text-xs font-medium tracking-wide transition-all",
        active ? "border-terracotta-800 bg-terracotta-800 text-white shadow-2xs" : "border-sand-200 bg-white text-ink-800 hover:border-sand-300 hover:bg-sand-50",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function Tabs<T extends string>({ tabs, value, onChange, className }: { tabs: { value: T; label: ReactNode; count?: number }[]; value: T; onChange: (v: T) => void; className?: string }) {
  return (
    <div role="tablist" className={cx("no-scrollbar flex gap-2 overflow-x-auto border-b border-sand-100 pb-px", className)}>
      {tabs.map((t) => (
        <button
          key={t.value}
          role="tab"
          aria-selected={value === t.value}
          onClick={() => onChange(t.value)}
          className={cx(
            "min-h-10 whitespace-nowrap border-b-2 px-3 text-sm font-semibold transition-all",
            value === t.value ? "border-terracotta-800 text-terracotta-800" : "border-transparent text-ink-600 hover:text-ink-900",
          )}
        >
          {t.label}
          {t.count ? <span className="ms-1.5 rounded-full bg-terracotta-100 text-terracotta-800 border border-terracotta-600/20 px-1.5 text-xs">{t.count}</span> : null}
        </button>
      ))}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx("animate-pulse rounded-[10px] bg-sand-100", className)} aria-hidden />;
}

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cx("size-5 animate-spin text-terracotta-800", className)} aria-hidden />;
}

/** Empty state: hand-drawn style spot illustration + one action (Part 1 §9.1). */
export function EmptyState({ title, body, action, art = "loom" }: { title: ReactNode; body?: ReactNode; action?: ReactNode; art?: "loom" | "basket" | "thread" }) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      <SpotArt kind={art} />
      <h3 className="font-serif mt-4 text-2xl text-ink-950 font-medium">{title}</h3>
      {body && <p className="mt-1.5 max-w-sm text-sm text-ink-600 leading-relaxed">{body}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

function SpotArt({ kind }: { kind: "loom" | "basket" | "thread" }) {
  const stroke = "#8c3b1e";
  const accent = "#c58b1d";
  return (
    <svg width="120" height="96" viewBox="0 0 120 96" fill="none" aria-hidden>
      {kind === "loom" && (
        <>
          <path d="M18 12v72M102 12v72M14 16h92M14 80h92" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" />
          {[30, 42, 54, 66, 78, 90].map((x) => (
            <path key={x} d={`M${x} 18v60`} stroke={stroke} strokeWidth="1.5" opacity=".4" />
          ))}
          <path d="M22 40c14 6 26-6 40 0s26 6 38 0" stroke={accent} strokeWidth="2.5" strokeLinecap="round" />
          <path d="M22 52c14 6 26-6 40 0s26 6 38 0" stroke={accent} strokeWidth="2.5" strokeLinecap="round" />
        </>
      )}
      {kind === "basket" && (
        <>
          <path d="M20 38h80l-10 42H30L20 38Z" stroke={stroke} strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M40 38c0-16 40-16 40 0" stroke={stroke} strokeWidth="2.5" />
          {[48, 58, 68].map((y) => (
            <path key={y} d={`M${24 + (y - 38) / 4} ${y}h${72 - (y - 38) / 2}`} stroke={accent} strokeWidth="2" />
          ))}
        </>
      )}
      {kind === "thread" && (
        <>
          <circle cx="44" cy="48" r="22" stroke={stroke} strokeWidth="2.5" />
          <path d="M30 40h28M30 48h28M30 56h28" stroke={accent} strokeWidth="2" />
          <path d="M66 48c14 0 14 24 30 18" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeDasharray="4 4" />
        </>
      )}
    </svg>
  );
}

export function Stars({ value, size = 16, onChange, label }: { value: number; size?: number; onChange?: (v: number) => void; label?: string }) {
  return (
    <div className="inline-flex items-center gap-0.5" role={onChange ? "radiogroup" : "img"} aria-label={label}>
      {[1, 2, 3, 4, 5].map((n) => {
        const fill = value >= n ? 1 : value >= n - 0.5 ? 0.5 : 0;
        const star = (
          <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
            <defs>
              <linearGradient id={`s${n}-${size}-${fill}`}>
                <stop offset={`${fill * 100}%`} stopColor="#c58b1d" />
                <stop offset={`${fill * 100}%`} stopColor="#ded8ce" />
              </linearGradient>
            </defs>
            <path fill={`url(#s${n}-${size}-${fill})`} d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z" />
          </svg>
        );
        return onChange ? (
          <button key={n} type="button" role="radio" aria-checked={value === n} aria-label={`${n}`} onClick={() => onChange(n)} className="tap flex items-center justify-center">
            {star}
          </button>
        ) : (
          <span key={n}>{star}</span>
        );
      })}
    </div>
  );
}

/** Tiny completion ring on the avatar (Part 1 §4.1). */
export function ProgressRing({ value, size = 36, children }: { value: number; size?: number; children?: ReactNode }) {
  const r = size / 2 - 2;
  const c = 2 * Math.PI * r;
  return (
    <span className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="absolute inset-0 -rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#ebe4d8" strokeWidth="3" fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#8c3b1e" strokeWidth="3" fill="none" strokeDasharray={c} strokeDashoffset={c * (1 - value / 100)} strokeLinecap="round" />
      </svg>
      {children}
    </span>
  );
}

export function Stepper({ steps }: { steps: { label: ReactNode; state: "done" | "current" | "todo" | "warn"; detail?: ReactNode }[] }) {
  return (
    <ol className="flex flex-col gap-0">
      {steps.map((s, i) => (
        <li key={i} className="relative flex gap-3 pb-5 last:pb-0">
          {i < steps.length - 1 && <span className="absolute start-[15px] top-8 h-[calc(100%-24px)] w-0.5 bg-sand-200" aria-hidden />}
          <span
            className={cx(
              "z-10 flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold",
              s.state === "done" && "bg-peacock-700 text-white",
              s.state === "current" && "bg-terracotta-800 text-white",
              s.state === "warn" && "bg-haldi-500 text-ink-900",
              s.state === "todo" && "border-2 border-sand-200 bg-white text-ink-600",
            )}
          >
            {s.state === "done" ? "✓" : s.state === "warn" ? "!" : i + 1}
          </span>
          <div className="pt-1">
            <div className="font-medium text-ink-950 text-sm">{s.label}</div>
            {s.detail && <div className="text-xs text-ink-600 mt-0.5">{s.detail}</div>}
          </div>
        </li>
      ))}
    </ol>
  );
}

/** Bottom sheet on mobile, centred dialog on desktop (native <dialog> for focus trapping + Esc). */
export function Sheet({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title?: ReactNode; children: ReactNode; wide?: boolean }) {
  const t = useTranslations("common");
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className={cx(
        "m-0 mt-auto max-h-[92vh] w-full max-w-none rounded-t-[24px] bg-white p-0 text-ink-950 backdrop:bg-ink-950/40 backdrop-blur-xs md:m-auto md:rounded-[20px] shadow-editorial",
        wide ? "md:max-w-2xl" : "md:max-w-lg",
      )}
    >
      {open && (
        <div className="flex max-h-[92vh] flex-col">
          <div className="flex items-center justify-between gap-3 border-b border-sand-100 px-5 py-4">
            <h2 className="font-serif text-xl font-medium text-ink-950">{title}</h2>
            <button onClick={onClose} className="tap -me-2 flex items-center justify-center rounded-full hover:bg-sand-50" aria-label={t("close")}>
              <X className="size-5 text-ink-600" />
            </button>
          </div>
          <div className="overflow-y-auto p-5">{children}</div>
        </div>
      )}
    </dialog>
  );
}

export function Banner({ tone = "info", children, action, icon }: { tone?: "info" | "warn" | "success" | "danger"; children: ReactNode; action?: ReactNode; icon?: ReactNode }) {
  const tones = {
    info: "bg-sand-50 text-ink-900 border-sand-200",
    warn: "bg-haldi-50 text-ink-900 border-haldi-500/30",
    success: "bg-peacock-50 text-peacock-700 border-peacock-600/20",
    danger: "bg-[#fdf2f2] text-danger-600 border-danger-600/20",
  };
  return (
    <div className={cx("flex items-center gap-3 rounded-[12px] border px-4 py-3", tones[tone])} role={tone === "danger" ? "alert" : "status"}>
      {icon}
      <div className="flex-1 text-[14px] font-medium">{children}</div>
      {action}
    </div>
  );
}
