"use client";

import Link from "next/link";
import { useAuth } from "@/providers/auth-provider";
import { useBackendData } from "@/lib/use-backend-data";
import type { PlaylistSummary } from "@/lib/types";
import { MusicIcon } from "./icons";
import { CardSkeleton, EmptyState } from "./ui-state";

export function PlaylistsView() {
  const { logout } = useAuth();
  const { data, loading, error, reload } = useBackendData<PlaylistSummary[]>({
    url: "/api/playlists",
    cacheKey: "playlists",
    onUnauthorized: () => void logout(),
  });

  return (
    <section className="flex h-full min-h-0 flex-col p-4 sm:p-6">
<header className="mb-5 flex shrink-0 justify-end">
      {data && (
        <span className="label">
          {data.length} playlists · {data.reduce((n, p) => n + p.songs, 0)} tracks
        </span>
      )}
    </header>

      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain pb-2 pr-2">
        {loading && (
          <div className="grid h-full grid-cols-1 auto-rows-[105px] gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        )}

        {error && !data && (
          <div className="flex h-full items-center justify-center">
            <EmptyState
              icon={<MusicIcon className="size-5" />}
              title="Could not load the library"
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
          <div className="flex h-full items-center justify-center">
            <EmptyState icon={<MusicIcon className="size-5" />} title="Nothing here yet" />
          </div>
        )}

        {!loading && data && data.length > 0 && (
          <div className="grid h-full grid-cols-1 auto-rows-[105px] gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {data.map(({ name, songs }) => (
              <Link
                key={name}
                href={`/playlist/${encodeURIComponent(name)}`}
                className="panel group card relative block p-3"
              >
                <span className="board-grid pointer-events-none absolute inset-0 opacity-40" />
                <div className="relative flex h-full flex-col justify-between gap-3">
                  <p className="font-mono text-base font-extrabold tracking-[0.18em] text-fg uppercase transition-colors group-hover:text-fg">
                    {name}
                  </p>
                  <span className="label w-fit">
                    {songs} {songs === 1 ? "track" : "tracks"}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}