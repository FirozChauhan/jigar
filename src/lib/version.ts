/**
 * App version — read from the nearest git tag at build time (set in
 * next.config.ts). Shown as a mono "v1.0.0" tag hugging the brand.
 */
export const APP_VERSION = process.env.APP_VERSION ?? "dev";

export const APP_NAME = "JIGAR";

export const R2_CDN = process.env.NEXT_PUBLIC_R2_DOMAIN ?? "";