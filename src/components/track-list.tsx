"use client";

import { useRouter } from "next/navigation";
import { usePlayer } from "@/providers/player-provider";
import type { Track } from "@/lib/types";
import { MusicIcon, PlayIcon } from "./icons";

function capitalize(name: string): string {
  return name
    .toLowerCase()
    .split(/\s+/)
    .map((word) => (word ? `${word.charAt(0).toUpperCase()}${word.slice(1)}` : word))
    .join(" ");
}

function ArtistChip({
  artist,
  onSelect,
}: {
  artist: string;
  onSelect: (name: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onSelect(artist);
      }}
      className="font-mono text-[11px] text-muted transition-colors hover:text-fg"
    >
      {capitalize(artist)}
    </button>
  );
}

export function TrackList({ tracks }: { tracks: Track[] }) {
  const router = useRouter();
  const { song, isPlaying, play } = usePlayer();

  const onArtist = (name: string) => {
    router.push(`/search?q=${encodeURIComponent(name)}`);
  };

  return (
    <ul className="space-y-3">
      {tracks.map((track) => {
        const active = song?.id === track.id;
        return (
          <li key={track.id} className="panel">
            <div
              role="button"
              tabIndex={0}
              aria-label={`Play ${track.title}`}
              onClick={() => play(track, tracks)}
              onKeyDown={(e) => {
                if (e.target !== e.currentTarget) return;
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  play(track, tracks);
                }
              }}
              className={`group relative flex w-full cursor-pointer items-center gap-3 border bg-[#171717] p-3 text-left transition-colors duration-200 hover:bg-[#141414] focus-visible:ring-blue-500 active:bg-[#171717] ${active ? "border-blue-500" : "border-line"}`}
            >
              <span
                className="diagonal-grid pointer-events-none absolute inset-0 opacity-40"
                aria-hidden="true"
              />
              {/* Cover */}
              <div className="relative size-16 shrink-0 overflow-hidden border border-line2 bg-card2">
                {track.cover ? (
                  <img
                    src={track.cover}
                    alt=""
                    width={64}
                    height={64}
                    loading="lazy"
                    decoding="async"
                    fetchPriority="low"
                    className="size-full object-cover"
                  />
                ) : (
                  <span className="flex size-full items-center justify-center text-muted">
                    <MusicIcon className="size-6" />
                  </span>
                )}
                <span className="absolute inset-0 flex items-center justify-center bg-page/50 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  <span className="flex size-8 items-center justify-center rounded-full bg-line text-page">
                    <PlayIcon className="size-4 translate-x-px" />
                  </span>
                </span>
              </div>

              {/* Meta */}
              <div className="min-w-0 flex-1">
                <p
                  className={`truncate text-base font-semibold ${
                    active && isPlaying ? "text-fg" : "text-fg2"
                  }`}
                >
                  {track.title}
                </p>
                <div className="mt-0">
                  {track.artist.split(",").map((name, i, arr) => (
                    <span key={`${track.id}-${i}`} className="whitespace-nowrap">
                      <ArtistChip artist={name.trim()} onSelect={onArtist} />
                      {i < arr.length - 1 && <span className="mx-1 text-faint">·</span>}
                    </span>
                  ))}
                </div>
                {active && isPlaying && (
                  <p className="mt-1 font-mono text-[9px] tracking-[0.2em] text-muted uppercase">
                    playing
                  </p>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}