"use client";

import { usePlayer } from "@/providers/player-provider";
import {
  NextIcon,
  PauseIcon,
  PlayIcon,
  PrevIcon,
  RepeatIcon,
  ShuffleIcon,
} from "./icons";
import { LoadingDots, Spinner } from "./ui-state";
import { cdnUrl } from "@/lib/version";

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

function MiniButton({
  label,
  active = false,
  onClick,
  disabled,
  children,
  className = "size-5",
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={active}
      className={`btn-icon size-11 shrink-0 ${active ? "border-fg text-fg" : "text-muted"}`}
    >
      <span className={className}>{children}</span>
    </button>
  );
}

export function PlayerBar() {
  const {
    song,
    playlist,
    isPlaying,
    isLoading,
    currentTime,
    duration,
    shuffle,
    repeat,
    toggle,
    next,
    prev,
    seek,
    toggleShuffle,
    toggleRepeat,
  } = usePlayer();

  const hasQueue = playlist.length > 0;

  const progress =
    duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-30 border-t border-line2 bg-page/90 backdrop-blur transition-transform ${
        song ? "translate-y-0" : "translate-y-full"
      }`}
      aria-hidden={!song}
      inert={!song}
    >
      {/* Transparent gap strip between the app and the player */}
      <div className="pointer-events-none absolute inset-x-0 -top-3 h-3 bg-transparent" />
      <div className="mx-auto flex w-full max-w-[1152px] flex-col gap-3 px-4 py-3 sm:px-6">
        {/* Now playing — metadata first */}
        <div className="flex items-center gap-3">
          <div className="relative size-14 shrink-0 overflow-hidden border border-line bg-card">
            {song && song.cover && (
              <img
                src={cdnUrl(song.cover)}
                alt=""
                width={56}
                height={56}
                loading="eager"
                fetchPriority="high"
                decoding="async"
                className="size-full object-cover"
              />
            )}
            {isLoading && (
              <span className="absolute inset-0 z-10 flex items-center justify-center bg-page/70 text-fg">
                <LoadingDots />
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-semibold text-fg">{song?.title}</p>
            <p className="truncate font-mono text-[11px] text-muted">{song?.artist}</p>
          </div>
          <span className="tag hidden shrink-0 xl:inline-block">{song?.playlist}</span>

          {/* Controls — shuffle & repeat collapse on phones to save width */}
          <div className="ml-1 flex shrink-0 items-center gap-0.5 sm:ml-4 sm:gap-2">
            <span className="hidden sm:inline-block">
              <MiniButton label="Toggle shuffle" active={shuffle} onClick={toggleShuffle}>
                <ShuffleIcon />
              </MiniButton>
            </span>
            <MiniButton
              label="Previous track"
              active={false}
              onClick={prev}
              disabled={!hasQueue}
            >
              <PrevIcon />
            </MiniButton>
            <button
              type="button"
              onClick={toggle}
              disabled={!song}
              aria-label={isPlaying ? "Pause" : "Play"}
              className="btn-primary mx-1 flex size-11 items-center justify-center p-0 disabled:cursor-not-allowed sm:size-12"
            >
              {isLoading ? (
                <Spinner className="size-5 text-page" />
              ) : isPlaying ? (
                <PauseIcon className="size-5" />
              ) : (
                <PlayIcon className="size-5" />
              )}
            </button>
            <MiniButton label="Next track" onClick={next} disabled={!hasQueue}>
              <NextIcon />
            </MiniButton>
            <span className="hidden sm:inline-block">
              <MiniButton label="Toggle repeat" active={repeat} onClick={toggleRepeat}>
                <RepeatIcon />
              </MiniButton>
            </span>
          </div>
        </div>

        {/* Progress bar — bottom of the section */}
        <div className="flex items-center gap-3">
          <span className="w-10 shrink-0 font-mono text-[11px] text-muted tabular-nums">
            {formatTime(currentTime)}
          </span>
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.1}
            value={Math.min(currentTime, duration || 100)}
            onChange={(e) => seek(Number(e.target.value))}
            aria-label="Seek"
            className="slider min-w-0 flex-1 self-center"
            style={{ "--progress": `${progress}%` } as React.CSSProperties}
          />
          <span className="w-10 shrink-0 text-right font-mono text-[11px] text-muted tabular-nums">
            {formatTime(duration)}
          </span>
        </div>
      </div>
    </div>
  );
}