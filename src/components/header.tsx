"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/providers/auth-provider";
import { APP_NAME, APP_VERSION } from "@/lib/version";
import { AddSongDialog } from "./add-song-dialog";
import { LogoutIcon, SearchIcon } from "./icons";

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { logout } = useAuth();

  const [draft, setDraft] = useState("");
  const timer = useRef<number | null>(null);

  /* Sync the input when a navigation lands on /search with a fresh query
     (e.g. clicking an artist chip updates the results URL). */
  useEffect(() => {
    if (pathname !== "/search") return;
    const id = window.setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      setDraft(params.get("q") ?? "");
    }, 0);
    return () => window.clearTimeout(id);
  }, [pathname]);

  const commit = (q: string) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      if (q.trim()) {
        router.replace(`/search?q=${encodeURIComponent(q.trim())}`);
      } else {
        router.push("/");
      }
    }, 250);
  };

  const handleChange = (value: string) => {
    setDraft(value);
    commit(value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (timer.current) clearTimeout(timer.current);
    if (draft.trim()) {
      router.push(`/search?q=${encodeURIComponent(draft.trim())}`);
    }
  };

  const onSearchFocus = () => {
    if (draft.trim()) router.push(`/search?q=${encodeURIComponent(draft.trim())}`);
  };

return (
    <header className="sticky top-0 z-40 border-b border-line2 bg-page/80 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-[1152px] items-center gap-4 px-4 sm:px-6">
        {/* Brand */}
        <Link
          href="/"
          className="group flex shrink-0 items-baseline gap-2 mb-2"
          aria-label={`${APP_NAME} home`}
        >
          <span
            lang="ur"
            dir="rtl"
            className="font-reem text-3xl leading-none font-bold tracking-tight text-fg transition-colors group-hover:text-tert sm:text-4xl"
          >
            جگر
          </span>
          <span className="label hidden sm:inline-block">v{APP_VERSION}</span>
        </Link>

        {/* Search + actions, grouped on the right */}
        <div className="ml-auto flex min-w-0 flex-1 items-center justify-end gap-2 sm:gap-3">
          <form
            onSubmit={handleSubmit}
            className="relative w-full max-w-[300px] flex-1 sm:w-80 sm:flex-none"
          >
            <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
            <input
              type="search"
              value={draft}
              onFocus={onSearchFocus}
              onChange={(e) => handleChange(e.target.value)}
              placeholder="حسن اتنی بڑی دلیل نہیں"
              lang="ur"
              aria-label="Search songs and artists"
              className="field w-full py-2 pl-10 pr-3 text-sm focus:bg-card"
            />
          </form>

          {/* Actions */}
          <div className="flex shrink-0 items-center gap-2">
            <AddSongDialog />
          <button
            type="button"
            onClick={() => void logout()}
            className="btn-secondary hidden items-center gap-2 py-2 sm:inline-flex"
            aria-label="Logout"
          >
            <LogoutIcon className="size-4" />
            <span className="text-sm">Logout</span>
          </button>
          <button
            type="button"
            onClick={() => void logout()}
            className="btn-icon h-[38px] w-[38px] sm:hidden"
            aria-label="Logout"
          >
            <LogoutIcon className="size-4" />
          </button>
            </div>
          </div>
        </div>
      </header>
  );
}
