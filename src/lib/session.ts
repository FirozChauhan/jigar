import "server-only";
import { cookies } from "next/headers";

/** Returns the Base64 Basic-auth token stored in the session cookie, or null. */
export async function sessionToken(): Promise<string | null> {
  const jar = await cookies();
  return jar.get("jigar_token")?.value ?? null;
}