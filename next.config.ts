import { execSync } from "node:child_process";
import type { NextConfig } from "next";

function gitVersion(): string {
  try {
    const tag = execSync("git describe --tags --abbrev=0", {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    return tag.replace(/^v/, "");
  } catch {
    return "dev";
  }
}

const nextConfig: NextConfig = {
  env: {
    APP_VERSION: gitVersion(),
  },
  async headers() {
    const r2 = process.env.NEXT_PUBLIC_R2_DOMAIN ?? "";
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      `img-src 'self' data: blob:${r2 ? ` ${r2}` : ""}`,
      `media-src 'self' blob:${r2 ? ` ${r2}` : ""}`,
      `connect-src 'self'${r2 ? ` ${r2}` : ""}`,
      "font-src 'self' data:",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "manifest-src 'self'",
    ].join("; ");

    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          ...(process.env.NODE_ENV === "production"
            ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]
            : []),
          // Strict CSP breaks Next dev's HMR scripting; applied in production only.
          ...(process.env.NODE_ENV === "production"
            ? [{ key: "Content-Security-Policy", value: csp }]
            : []),
        ],
      },
    ];
  },
};

export default nextConfig;