"use client";

// Playlist view: sidebar + track list for one playlist.
import { useAuth } from "@/providers/auth-provider";
import { useBackendData } from "@/lib/use-backend-data";
import type { Track } from "@/lib/types";
import { TrackList } from "./track-list";
import { PlaylistSidebar } from "./playlist-sidebar";
import { MusicIcon } from "./icons";
import { EmptyState, ListSkeleton } from "./ui-state";

export function PlaylistSongs({ name }: { name: string }) {
  const { logout } = useAuth();
  const cacheKey = `playlist:${name}`;

  const { data, loading, error, reload } = useBackendData<Track[]>({
    url: `/api/playlists/${encodeURIComponent(name)}`,
    cacheKey,
    onUnauthorized: () => void logout(),
  });

  return (
    <section className="flex h-full min-h-0 flex-col gap-3 p-4 sm:px-6 sm:py-5">
      <header className="flex shrink-0 items-baseline gap-3">
        <h1 className="truncate font-mono text-xl font-extrabold tracking-[0.2em] text-fg uppercase">
          {name}
        </h1>
        {data && (
          <span className="label">
            {data.length} {data.length === 1 ? "track" : "tracks"}
          </span>
        )}
      </header>

      <div className="flex min-h-0 flex-col gap-4 md:h-[730px] md:flex-row">
        <PlaylistSidebar active={name} />

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          {loading && (
            <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain pb-40">
              <ListSkeleton rows={8} />
            </div>
          )}

          {error && !data && (
            <div className="flex min-h-0 flex-1 items-center justify-center">
              <EmptyState
                icon={<MusicIcon className="size-5" />}
                title="Could not load this playlist"
                hint={error}
                action={
                  <button type="button" onClick={reload} className="btn-secondary">
                    Retry
                  </button>
                }
              />
            </div>
          )}

          {!loading && !error && data && data.length === 0 && (
            <div className="flex min-h-0 flex-1 items-center justify-center">
              <EmptyState
                icon={<MusicIcon className="size-5" />}
                title="No tracks in this playlist"
              />
            </div>
          )}

          {!loading && data && data.length > 0 && (
            <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain pb-40">
              <TrackList tracks={data} />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}