export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string | null;
  cover: string;
  url: string;
  playlist: string;
  created_at: string;
}

export interface PlaylistSummary {
  name: string;
  songs: number;
}

export interface SessionPayload {
  authenticated: boolean;
}

export interface ImageShape {
  src: string;
  alt: string;
}

/** Ordered control buttons for the player, minus play/pause. */
export const PLAY_ORDER = ["shuffle", "prev", "play", "next", "repeat"] as const;