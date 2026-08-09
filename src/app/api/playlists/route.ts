import { NextResponse } from "next/server";
import { listPlaylists } from "@/lib/db";
import { sessionToken } from "@/lib/session";

export async function GET() {
  const basicAuth = await sessionToken();
  if (!basicAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const playlists = await listPlaylists();
    const res = NextResponse.json(playlists);
    res.headers.set(
      "Cache-Control",
      "public, max-age=60, s-maxage=300, stale-while-revalidate=300",
    );
    return res;
  } catch (err) {
    console.error("listPlaylists failed:", err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}