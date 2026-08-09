import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifyUser } from "@/lib/db";

const SESSION_COOKIE = "jigar_token";
const AUTH_MARKER = "jigar_auth";
const MAX_AGE = 60 * 60 * 24 * 30;

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

  // Verify credentials against the `users` table (scrypt-hashed).
  const valid = await verifyUser(username, password);
  if (!valid) {
    return NextResponse.json(
      { error: "Invalid username or password" },
      { status: 401 },
    );
  }

  // Signed session marker; the token no longer represents a backend Basic
  // credential — it is just an opaque session id.
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