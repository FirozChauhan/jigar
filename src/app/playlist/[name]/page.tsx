import type { Metadata } from "next";
import { PlaylistSongs } from "@/components/playlist-songs";

export const metadata: Metadata = {
  title: "Playlist",
};

export default async function PlaylistPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  return <PlaylistSongs name={name} />;
}