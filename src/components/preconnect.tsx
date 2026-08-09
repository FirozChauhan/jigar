"use client";

// Opens a warm connection to the CDN (covers + audio) on mount.
import { useEffect } from "react";
import { R2_CDN } from "@/lib/version";

/** Adds preconnect + dns-prefetch links for the media CDN, once. */
export function Preconnect() {
  useEffect(() => {
    if (!R2_CDN || document.head.querySelector('[data-r2e="1"]')) return;
    const links = [
      { rel: "preconnect", crossOrigin: "anonymous" as const },
      { rel: "dns-prefetch" },
    ];
    for (const l of links) {
      const el = document.createElement("link");
      el.rel = l.rel;
      el.href = R2_CDN;
      if (l.crossOrigin) el.crossOrigin = l.crossOrigin;
      el.dataset.r2e = "1";
      document.head.appendChild(el);
    }
  }, []);
  return null;
}