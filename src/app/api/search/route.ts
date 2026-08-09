import { NextResponse } from "next/server";
import { searchSongs } from "@/lib/db";
import { isAuthenticated } from "@/lib/session";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  if (!q) return NextResponse.json([]);

  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const tracks = await searchSongs(q);
    return NextResponse.json(tracks);
  } catch (err) {
    console.error(`searchSongs(${q}) failed:`, err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}