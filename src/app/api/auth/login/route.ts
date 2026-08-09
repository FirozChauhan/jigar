import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifyUser } from "@/lib/db";

const SESSION_COOKIE = "jigar_token";
const AUTH_MARKER = "jigar_auth";
const MAX_AGE = 60 * 60 * 24 * 30;

/* In-memory brute-force throttle: 5 failed attempts per IP per 15 minutes. */
const RATE_WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const attempts = new Map<string, { count: number; resetAt: number }>();

function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]?.trim() ?? "unknown";
  return req.headers.get("x-real-ip") ?? "unknown";
}

function isRateLimited(key: string): { limited: boolean; retryAfter: number } {
  const now = Date.now();
  const rec = attempts.get(key);
  if (!rec || now > rec.resetAt) {
    attempts.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return { limited: false, retryAfter: 0 };
  }
  rec.count += 1;
  if (rec.count > MAX_ATTEMPTS) {
    return {
      limited: true,
      retryAfter: Math.ceil((rec.resetAt - now) / 1000),
    };
  }
  return { limited: false, retryAfter: 0 };
}

function clearRateLimit(key: string) {
  attempts.delete(key);
}

export async function POST(req: Request) {
  let username = "";
  let password = "";
  try {
    const body = await req.json();
    username = String(body?.username ?? "").trim();
    password = String(body?.password ?? "");
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!username || !password) {
    return NextResponse.json(
      { error: "Username and password are required" },
      { status: 400 },
    );
  }

  const key = `${clientIp(req)}|${username.toLowerCase()}`;
  const { limited, retryAfter } = isRateLimited(key);
  if (limited) {
    return NextResponse.json(
      { error: "Too many attempts. Try again later." },
      { status: 429, headers: { "Retry-After": String(retryAfter) } },
    );
  }

  // Verify credentials against the `users` table (scrypt-hashed).
  const valid = await verifyUser(username, password);
  if (!valid) {
    return NextResponse.json(
      { error: "Invalid username or password" },
      { status: 401 },
    );
  }
  clearRateLimit(key);

  // Session cookie carries the Basic-style credentials; it is re-verified on
  // every protected request (see src/lib/session.ts).
  const basicAuth = Buffer.from(`${username}:${password}`).toString("base64");

  const jar = await cookies();
  jar.set(SESSION_COOKIE, basicAuth, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
  jar.set(AUTH_MARKER, "1", {
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });

  return NextResponse.json({ ok: true });
}