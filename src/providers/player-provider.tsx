"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Track } from "@/lib/types";

interface PlayerContextValue {
  song: Track | null;
  playlist: Track[];
  isPlaying: boolean;
  isLoading: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  muted: boolean;
  shuffle: boolean;
  repeat: boolean;
  play: (track: Track, queue: Track[]) => void;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  seek: (time: number) => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
}

const PlayerContext = createContext<PlayerContextValue | null>(null);

const VOLUME_KEY = "jigar_volume";
const TIME_STEP_MS = 1000;

function isEditableTarget(target: unknown): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    target.isContentEditable
  );
}

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [queue, setQueue] = useState<Track[]>([]);
  const [index, setIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.9);
  const [muted, setMuted] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(false);

  const positionSyncAt = useRef(0);

  const song = useMemo<Track | null>(() => {
    return index >= 0 && index < queue.length ? queue[index] : null;
  }, [queue, index]);

  /* Restore persisted volume once on mount. */
  useEffect(() => {
    const id = window.setTimeout(() => {
      const stored = Number(window.localStorage.getItem(VOLUME_KEY) ?? 0.9);
      if (Number.isFinite(stored)) {
        const clamped = Math.min(Math.max(stored, 0), 1);
        setVolumeState(clamped);
        if (audioRef.current) audioRef.current.volume = clamped;
      }
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  /** Pick the index that follows `from` by `dir`, honoring shuffle & wrap. */
  const stepIndex = useCallback(
    (from: number, dir: 1 | -1): number => {
      const len = queue.length;
      if (len <= 1) return from;
      if (shuffle) {
        if (len === 1) return from;
        let n = Math.floor(Math.random() * len);
        if (n === from) n = (n + 1) % len;
        return n;
      }
      const n = (from + dir + len) % len;
      return n;
    },
    [queue.length, shuffle],
  );

  const seek = useCallback((time: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    const next = Math.min(Math.max(time, 0), audio.duration || 0);
    audio.currentTime = next;
    setCurrentTime(next);
  }, []);

  const next = useCallback(() => {
    setIndex((i) => (i === -1 ? i : stepIndex(i, 1)));
  }, [stepIndex]);

  const prev = useCallback(() => {
    const audio = audioRef.current;
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0;
      setCurrentTime(0);
      return;
    }
    setIndex((i) => (i === -1 ? i : stepIndex(i, -1)));
  }, [stepIndex]);

  const play = useCallback(
    (track: Track, nextQueue: Track[]) => {
      const found = nextQueue.findIndex((t) => t.id === track.id);
      setQueue(nextQueue);
      setIndex(found >= 0 ? found : 0);
      setIsPlaying(true);
    },
    [],
  );

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !audio.src) return;
    if (audio.paused) {
      const p = audio.play();
      if (p) p.catch(() => {});
    } else {
      audio.pause();
    }
  }, []);

  const setVolume = useCallback((v: number) => {
    const clamped = Math.min(Math.max(v, 0), 1);
    setVolumeState(clamped);
    window.localStorage.setItem(VOLUME_KEY, String(clamped));
    if (audioRef.current) audioRef.current.volume = clamped;
  }, []);

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      if (audioRef.current) audioRef.current.muted = !m;
      return !m;
    });
  }, []);

  const toggleShuffle = useCallback(() => setShuffle((s) => !s), []);
  const toggleRepeat = useCallback(() => setRepeat((r) => !r), []);

  /* Drive playback whenever the selected song changes. */
  const activeId = song?.id ?? null;
  const activeUrl = song?.url ?? null;
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !activeId) return;
    if (audio.src !== activeUrl) {
      audio.src = activeUrl ?? "";
    }
    const p = audio.play();
    if (p) {
      p.then(() => setIsLoading(false)).catch(() => {
        // Autoplay blocked without a gesture → paused, awaiting user press.
        setIsLoading(false);
        setIsPlaying(false);
      });
    }
  }, [activeId, activeUrl]);

  /* Media Session — lock-screen & hardware-key integration. */
  const bindMediaSession = useCallback(() => {
    if (!("mediaSession" in navigator)) return;
    const { mediaSession } = navigator;
    try {
      mediaSession.setActionHandler("play", () => void audioRef.current?.play());
      mediaSession.setActionHandler("pause", () => audioRef.current?.pause());
      mediaSession.setActionHandler("previoustrack", () => {
        const a = audioRef.current;
        if (a && a.currentTime > 3) {
          a.currentTime = 0;
          setCurrentTime(0);
        } else {
          setIndex((i) => (i === -1 ? i : stepIndex(i, -1)));
        }
      });
      mediaSession.setActionHandler("nexttrack", () => next());
      mediaSession.setActionHandler("seekto", (d) => seek(d.seekTime ?? 0));
    } catch {
      // media keyboard handlers unsupported — element still works
    }
  }, [next, stepIndex, seek]);

  useEffect(() => {
    if (song) {
      bindMediaSession();
      if ("mediaSession" in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: song.title,
          artist: song.artist,
          album: song.playlist.toUpperCase(),
          artwork: song.cover
            ? [{ src: song.cover, sizes: "256x256", type: "image/jpeg" }]
            : [],
        });
      }
    }
  }, [song, bindMediaSession]);

  /* Position state for the lock screen — throttled to 1 Hz. */
  const syncPosition = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !("mediaSession" in navigator)) return;
    const now = Date.now();
    if (now - positionSyncAt.current < TIME_STEP_MS) return;
    positionSyncAt.current = now;
    try {
      navigator.mediaSession.setPositionState({
        duration: audio.duration || 0,
        playbackRate: audio.playbackRate,
        position: audio.currentTime,
      });
    } catch {
      // duration may still be loading
    }
  }, []);

  /* Global keyboard shortcuts — Space toggles, arrows seek. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isEditableTarget(e.target)) return;
      switch (e.code) {
        case "Space":
          e.preventDefault();
          toggle();
          break;
        case "ArrowRight":
          if (e.metaKey || e.ctrlKey || e.altKey) return;
          e.preventDefault();
          seek((audioRef.current?.currentTime ?? 0) + 5);
          break;
        case "ArrowLeft":
          if (e.metaKey || e.ctrlKey || e.altKey) return;
          e.preventDefault();
          seek((audioRef.current?.currentTime ?? 0) - 5);
          break;
        case "KeyN":
          if (e.altKey) next();
          break;
        case "KeyP":
          if (e.altKey) setIndex((i) => (i === -1 ? i : stepIndex(i, -1)));
          break;
        default:
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle, seek, next, prev, stepIndex]);

  const value = useMemo<PlayerContextValue>(
    () => ({
      song,
      playlist: queue,
      isPlaying,
      isLoading,
      currentTime,
      duration,
      volume,
      muted,
      shuffle,
      repeat,
      play,
      toggle,
      next,
      prev,
      seek,
      setVolume,
      toggleMute,
      toggleShuffle,
      toggleRepeat,
    }),
    [
      song,
      queue,
      isPlaying,
      isLoading,
      currentTime,
      duration,
      volume,
      muted,
      shuffle,
      repeat,
      play,
      toggle,
      next,
      prev,
      seek,
      setVolume,
      toggleMute,
      toggleShuffle,
      toggleRepeat,
    ],
  );

  return (
    <PlayerContext.Provider value={value}>
      {children}
      <audio
        ref={audioRef}
        preload={song ? "auto" : "none"}
        loop={repeat}
        className="hidden"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onWaiting={() => setIsLoading(true)}
        onCanPlay={() => setIsLoading(false)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
        onTimeUpdate={(e) => {
          setCurrentTime(e.currentTarget.currentTime);
          syncPosition();
        }}
        onEnded={() => {
          if (repeat) {
            const a = audioRef.current;
            if (a) {
              a.currentTime = 0;
              void a.play();
            }
            return;
          }
          next();
        }}
        onError={() => {
          if (queue.length > 1) next();
        }}
      />
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used within PlayerProvider");
  return ctx;
}