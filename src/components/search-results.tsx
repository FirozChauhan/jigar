"use client";

// Debounced search over title/artist with a loading skeleton + empty state.
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/providers/auth-provider";
import type { Track } from "@/lib/types";
import { TrackList } from "./track-list";
import { SearchIcon } from "./icons";
import { EmptyState, ListSkeleton } from "./ui-state";

export function SearchResults() {
  const searchParams = useSearchParams();
  const q = (searchParams.get("q") ?? "").trim();
  const { logout } = useAuth();

  const [tracks, setTracks] = useState<Track[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    if (timer.current) clearTimeout(timer.current);

    if (!q) {
      const id = window.setTimeout(() => {
        setTracks(null);
        setError(null);
        setLoading(false);
      }, 0);
      return () => {
        window.clearTimeout(id);
        controller.abort();
      };
    }

    timer.current = window.setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, {
          signal: controller.signal,
          cache: "no-store",
        });
        if (res.status === 401) {
          void logout();
          return;
        }
        if (!res.ok) throw new Error(`Search failed (${res.status})`);
        setTracks((await res.json()) as Track[]);
      } catch (err) {
        if ((err as Error)?.name === "AbortError") return;
        setError((err as Error)?.message ?? "Search failed");
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => {
      if (timer.current) clearTimeout(timer.current);
      controller.abort();
    };
  }, [q, logout]);

  const pending = q.length > 0 && !tracks && !error;

  return (
    <section>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="mt-2 flex items-center gap-3 font-mono text-2xl font-extrabold tracking-[0.2em] text-fg">
            <SearchIcon className="size-5 text-muted" />
            {q ? `"${q}"` : "SEARCH"}
          </h1>
          {q.length > 0 && !pending && tracks && (
            <span className="tag">
              {tracks.length} {tracks.length === 1 ? "result" : "results"}
            </span>
          )}
        </div>
        <p className="label">Match by title or artist</p>
      </header>

      {!q && (
        <EmptyState
          icon={<SearchIcon className="size-5" />}
          title="Type to search"
          hint='Find tracks by title or artist — e.g. "Aziz", "Shah", "Ishq"'
        />
      )}

      {pending && <ListSkeleton rows={8} />}

      {q.length > 0 && error && !loading && (
        <EmptyState title="Search failed" hint={error} />
      )}

      {q.length > 0 && !pending && !error && tracks && tracks.length === 0 && (
        <EmptyState
          icon={<SearchIcon className="size-5" />}
          title="Nothing found"
          hint={`No matches for "${q}"`}
        />
      )}

      {q.length > 0 && !pending && !error && tracks && tracks.length > 0 && (
        <TrackList tracks={tracks} />
      )}
    </section>
  );
}