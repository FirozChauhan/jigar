import { NextResponse } from "next/server";
import { insertSong } from "@/lib/db";
import { isAuthenticated } from "@/lib/session";

export async function POST(req: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    title: string;
    artist: string;
    album?: string;
    cover: string;
    url: string;
    playlist: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { title, artist, album, cover, url, playlist } = body;
  if (!title || !artist || !cover || !url || !playlist) {
    return NextResponse.json(
      {
        error:
          "Missing required fields: title, artist, cover, url, playlist",
      },
      { status: 400 },
    );
  }

  try {
    const song = await insertSong({
      title,
      artist,
      album: album || null,
      cover,
      url,
      playlist,
    });
    return NextResponse.json({ song }, { status: 201 });
  } catch (err) {
    console.error("insertSong failed:", err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}