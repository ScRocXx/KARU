"use client";

import { useEffect } from "react";
import type { Card } from "@/lib/types";
import { rememberViewed } from "./recently-viewed";

export function ViewTracker({ card }: { card: Card }) {
  useEffect(() => {
    rememberViewed(card);
  }, [card]);
  return null;
}
