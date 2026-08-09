import "server-only";
import { Pool, type QueryResultRow } from "pg";
import { scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import type { PlaylistSummary, Track } from "@/lib/types";

const scrypt = promisify(scryptCallback) as (
  password: string,
  salt: string,
  keylen: number,
) => Promise<Buffer>;

const connectionString = process.env.DATABASE_URL ?? "";

export const pool = new Pool({
  connectionString,
  ssl: connectionString.includes("sslmode=require")
    ? { rejectUnauthorized: false }
    : false,
});

function rowToTrack(row: QueryResultRow): Track {
  return {
    id: String(row.id),
    title: String(row.title),
    artist: String(row.artist),
    album: row.album == null ? null : String(row.album),
    cover: String(row.cover),
    url: String(row.url),
    playlist: String(row.playlist),
    created_at: String(row.created_at ?? ""),
  };
}

/** All songs for a tag (comma-separated playlist is matched with ILIKE). */
export async function listPlaylist(name: string): Promise<Track[]> {
  const { rows } = await pool.query<Track>({
    text: `SELECT id, title, artist, album, cover, url, playlist, created_at
           FROM fanaa
           WHERE playlist ILIKE $1
           ORDER BY created_at ASC, id ASC`,
    values: [`%${name}%`],
  });
  return rows.map(rowToTrack);
}

/** Playlist summaries computed from comma-separated tags. */
export async function listPlaylists(): Promise<PlaylistSummary[]> {
  const { rows } = await pool.query<{ playlist: string }>(
    "SELECT playlist FROM fanaa",
  );
  const counts = new Map<string, number>();
  for (const row of rows) {
    for (const tag of row.playlist.split(",")) {
      const t = tag.trim();
      if (t) counts.set(t, (counts.get(t) ?? 0) + 1);
    }
  }
  return Array.from(counts, ([name, songs]) => ({ name, songs })).sort((a, b) =>
    a.name.localeCompare(b.name),
  );
}

/** Search by title or artist (ILIKE, case-insensitive). */
export async function searchSongs(query: string): Promise<Track[]> {
  const { rows } = await pool.query<Track>(
    `SELECT id, title, artist, album, cover, url, playlist, created_at
     FROM fanaa
     WHERE title ILIKE $1 OR artist ILIKE $2
     ORDER BY created_at ASC, id ASC`,
    [`%${query}%`, `%${query}%`],
  );
  return rows.map(rowToTrack);
}

/** Insert a new song; returns the created row as a Track. */
export async function insertSong(input: {
  title: string;
  artist: string;
  album: string | null;
  cover: string;
  url: string;
  playlist: string;
}): Promise<Track> {
  const { rows } = await pool.query<Track>(
    `INSERT INTO fanaa (title, artist, album, cover, url, playlist)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, title, artist, album, cover, url, playlist, created_at`,
    [input.title, input.artist, input.album, input.cover, input.url, input.playlist],
  );
  return rowToTrack(rows[0]);
}

/** Verify credentials against the `users` table (scrypt-hashed passwords). */
export async function verifyUser(username: string, password: string): Promise<boolean> {
  const { rows } = await pool.query<{ password_hash: string }>(
    "SELECT password_hash FROM users WHERE username = $1",
    [username],
  );
  if (rows.length === 0) return false;
  const [salt, stored] = String(rows[0]?.password_hash ?? "").split("$");
  if (!salt || !stored) return false;
  try {
    const derived = await scrypt(password, salt, 64);
    return timingSafeEqual(derived, Buffer.from(stored, "hex"));
  } catch {
    return false;
  }
}