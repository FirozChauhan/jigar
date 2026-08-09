"use client";

// Left-side playlist nav used inside the playlist view.
import Link from "next/link";
import { useAuth } from "@/providers/auth-provider";
import { useBackendData } from "@/lib/use-backend-data";
import type { PlaylistSummary } from "@/lib/types";
import { LoadingDots } from "./ui-state";

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

function titleCase(name: string): string {
  return name
    .toLowerCase()
    .split(/\s+/)
    .map((word) => (word ? `${word.charAt(0).toUpperCase()}${word.slice(1)}` : word))
    .join(" ");
}

export function PlaylistSidebar({ active }: { active: string }) {
  const { logout } = useAuth();
  const { data, loading } = useBackendData<PlaylistSummary[]>({
    url: "/api/playlists",
    cacheKey: "playlists",
    onUnauthorized: () => void logout(),
  });

  return (
    <aside className="shrink-0 md:h-full md:min-h-0 md:w-72">
      <div className="flex w-full flex-col border border-line bg-card md:h-full md:min-h-0 md:overflow-hidden">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-line px-3 py-3">
          <p className="label">Playlists</p>
          {data && (
            <span className="font-mono text-[10px] text-faint tabular-nums">
              {data.length}
            </span>
          )}
        </div>

        {/* Playlist list — internal scroll within the fixed sidebar height */}
        <nav className="no-scrollbar flex min-h-0 flex-1 gap-px overflow-x-auto overscroll-contain pb-4 md:flex-col md:overflow-y-auto md:pb-40">
          {loading && (
            <span className="flex items-center justify-center p-4 text-muted">
              <LoadingDots />
            </span>
          )}

          {data?.map(({ name, songs }) => {
            const isActive = name === active;
            return (
              <Link
                key={name}
                href={`/playlist/${encodeURIComponent(name)}`}
                aria-current={isActive ? "page" : undefined}
                className={`flex shrink-0 items-center justify-between gap-3 px-3 py-2.5 text-sm whitespace-nowrap transition-colors md:w-full md:whitespace-normal ${
                  isActive
                    ? "bg-card2 text-fg"
                    : "text-muted hover:bg-card2 hover:text-fg"
                }`}
              >
                <span className="truncate">{titleCase(name)}</span>
                <span className="font-mono text-[10px] text-faint tabular-nums">
                  {pad(songs)}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}