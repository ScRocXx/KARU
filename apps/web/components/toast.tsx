"use client";

import { CheckCircle2, Info, XCircle } from "lucide-react";
import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

type Tone = "success" | "error" | "info";
interface Toast {
  id: number;
  text: ReactNode;
  tone: Tone;
}

const Ctx = createContext<(text: ReactNode, tone?: Tone) => void>(() => undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((text: ReactNode, tone: Tone = "success") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, text, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);
  return (
    <Ctx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex flex-col items-center gap-2 px-4 md:bottom-6" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className="animate-settle pointer-events-auto flex max-w-md items-center gap-2 rounded-[12px] bg-ink-900 px-4 py-3 text-[15px] text-white shadow-lg">
            {t.tone === "success" ? <CheckCircle2 className="size-5 text-[#7fd6c9]" /> : t.tone === "error" ? <XCircle className="size-5 text-[#ff9b92]" /> : <Info className="size-5" />}
            <span>{t.text}</span>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export const useToast = () => useContext(Ctx);
