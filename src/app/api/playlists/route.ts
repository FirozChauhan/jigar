// Playlist summaries computed from track tags. Auth-required, no shared caching.
import { NextResponse } from "next/server";
import { listPlaylists } from "@/lib/db";
import { isAuthenticated } from "@/lib/session";

export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const playlists = await listPlaylists();
    const res = NextResponse.json(playlists);
    res.headers.set("Cache-Control", "private, no-store");
    return res;
  } catch (err) {
    console.error("listPlaylists failed:", err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}