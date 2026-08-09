import "server-only";
import { cookies } from "next/headers";
import { verifyUser } from "@/lib/db";

/** Returns the base64 login token stored in the session cookie, or null. */
export async function sessionToken(): Promise<string | null> {
  const jar = await cookies();
  return jar.get("jigar_token")?.value ?? null;
}

// Re-verifies the session cookie against the users table. Just having a
// jigar_token cookie isn't enough — the bundled username/password must still
// authenticate, so forged or leaked cookies are rejected.
export async function isAuthenticated(): Promise<boolean> {
  const token = await sessionToken();
  if (!token) return false;

  let decoded: string;
  try {
    decoded = Buffer.from(token, "base64").toString("utf8");
  } catch {
    return false;
  }

  const at = decoded.indexOf(":");
  if (at < 0) return false;
  const username = decoded.slice(0, at);
  const password = decoded.slice(at + 1);
  if (!username || !password) return false;
  return verifyUser(username, password);
}