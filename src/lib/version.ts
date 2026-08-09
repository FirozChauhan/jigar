// Version + branding. The version is read from the latest git tag during the
// build (see next.config.ts) so the header tag matches the latest release.
export const APP_VERSION = process.env.APP_VERSION ?? "dev";

export const APP_NAME = "JIGAR";

export const R2_CDN = process.env.NEXT_PUBLIC_R2_DOMAIN ?? "";

// Rewrites media URLs so covers/audio go through the configured CDN origin
// instead of the raw *.r2.dev host baked into stored tracks. Point
// NEXT_PUBLIC_R2_DOMAIN at a custom domain attached to the R2 bucket to get
// edge caching + the preconnect warm-up.
const R2_DEV_ORIGIN = /^https:\/\/[a-z0-9-]+\.r2\.dev/i;

export function cdnUrl(url: string): string {
  if (!R2_CDN) return url;
  return url.replace(R2_DEV_ORIGIN, R2_CDN.replace(/\/+$/, ""));
}