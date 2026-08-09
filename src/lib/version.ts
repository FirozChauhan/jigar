/**
 * App version — read from the nearest git tag at build time (set in
 * next.config.ts). Shown as a mono "v1.0.0" tag hugging the brand.
 */
export const APP_VERSION = process.env.APP_VERSION ?? "dev";

export const APP_NAME = "JIGAR";

export const R2_CDN = process.env.NEXT_PUBLIC_R2_DOMAIN ?? "";

/**
 * Rewrites media URLs so every cover/audio request hits the configured CDN
 * origin instead of the raw `*.r2.dev` host baked into stored tracks.
 * Point NEXT_PUBLIC_R2_DOMAIN at a custom domain attached to your R2 bucket
 * (e.g. https://media.example.com) to get Cloudflare edge caching, HTTP/3 and
 * the preconnect warm-up on every media request.
 */
const R2_DEV_ORIGIN = /^https:\/\/[a-z0-9-]+\.r2\.dev/i;

export function cdnUrl(url: string): string {
  if (!R2_CDN) return url;
  return url.replace(R2_DEV_ORIGIN, R2_CDN.replace(/\/+$/, ""));
}