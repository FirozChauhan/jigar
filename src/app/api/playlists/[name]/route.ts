import { NextResponse } from "next/server";
import { listPlaylist } from "@/lib/db";
import { sessionToken } from "@/lib/session";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ name: string }> },
) {
  const { name } = await ctx.params;
  const basicAuth = await sessionToken();
  if (!basicAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const tracks = await listPlaylist(name);
    const res = NextResponse.json(tracks);
    res.headers.set(
      "Cache-Control",
      "public, max-age=60, s-maxage=300, stale-while-revalidate=300",
    );
    return res;
  } catch (err) {
    console.error(`listPlaylist(${name}) failed:`, err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}