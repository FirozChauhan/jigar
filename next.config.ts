import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import type { NextConfig } from "next";

function packageVersion(): string {
  try {
    const pkg = JSON.parse(
      readFileSync(path.join(process.cwd(), "package.json"), "utf8"),
    ) as { version?: string };
    return pkg.version ?? "dev";
  } catch {
    return "dev";
  }
}

function gitVersion(): string {
  // During production builds, pull the latest remote tags so deployments pick
  // up release tags automatically (no manual tag push needed — see
  // push.followTags). Ignored when offline or in shallow checkouts.
  if (process.env.NODE_ENV === "production") {
    try {
      execSync("git fetch --tags --force", {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
        timeout: 15000,
      });
    } catch {
      // offline / not a git repo — rely on local tags or the package fallback
    }
  }
  try {
    const tag = execSync("git describe --tags --abbrev=0", {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    if (tag) return tag.replace(/^v/, "");
  } catch {
    // no tags in this clone (e.g. shallow CI checkout) — fall through
  }
  return packageVersion();
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
      // https: is allowed for img/media so covers + audio load even when the
      // R2 domain env var is missing on the deployment host.
      `img-src 'self' data: blob: https:${r2 ? ` ${r2}` : ""}`,
      `media-src 'self' blob: https:${r2 ? ` ${r2}` : ""}`,
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