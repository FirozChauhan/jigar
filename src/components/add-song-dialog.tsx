"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { clearCache } from "@/lib/cache";
import { CloseIcon, MusicIcon, PlusIcon } from "./icons";
import { Spinner } from "./ui-state";

interface MetaState {
  title: string;
  artist: string;
  album: string;
  playlist: string;
}

const EMPTY_META: MetaState = {
  title: "",
  artist: "",
  album: "",
  playlist: "",
};

const AUDIO_ACCEPT = "audio/*,.mp3,.m4a,.ogg,.opus,.webm,.aac,.wav";
const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/avif,image/gif";

function formatSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "";
  const mb = bytes / 1024 / 1024;
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
}

function Field({
  label,
  name,
  value,
  onChange,
  required,
  autoFocus,
  type = "text",
  placeholder,
}: {
  label: string;
  name: keyof MetaState;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  autoFocus?: boolean;
  type?: string;
  placeholder: string;
}) {
  return (
    <div>
      <label htmlFor={`add-${name}`} className="label mb-2 block">
        {label}
        {required && <span className="text-fg"> *</span>}
      </label>
      <input
        id={`add-${name}`}
        type={type}
        name={name}
        required={required}
        autoFocus={autoFocus}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="field"
      />
    </div>
  );
}

async function uploadFile(
  file: File,
  folder: "Audio" | "Thumbs",
): Promise<string> {
  const res = await fetch("/api/upload", {
    method: "POST",
    headers: {
      "X-Folder": folder,
      "X-Filename": file.name,
      "Content-Type": file.type || "application/octet-stream",
    },
    body: file,
  });
  const data = (await res.json().catch(() => null)) as { url?: string; error?: string } | null;
  if (!res.ok || !data?.url) {
    throw new Error(data?.error ?? `Upload failed (${res.status})`);
  }
  return data.url;
}

export function AddSongDialog() {
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<"files" | "meta">("files");

  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [thumbFile, setThumbFile] = useState<File | null>(null);
  const [thumbPreview, setThumbPreview] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState("");
  const [coverUrl, setCoverUrl] = useState("");

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [meta, setMeta] = useState<MetaState>(EMPTY_META);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "ok" | "error" } | null>(null);

  const handleMeta = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setMeta((prev) => ({ ...prev, [name]: value }));
  };

  const onAudioPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAudioFile(e.target.files?.[0] ?? null);
    setUploadError(null);
  };

  const onThumbPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setThumbFile(file);
    setUploadError(null);
    if (thumbPreview) URL.revokeObjectURL(thumbPreview);
    setThumbPreview(file ? URL.createObjectURL(file) : null);
  };

  const close = useCallback(() => {
    if (busy || uploading) return;
    setOpen(false);
  }, [busy, uploading]);

  const openDialog = useCallback(() => {
    setMeta(EMPTY_META);
    setAudioFile(null);
    setThumbFile(null);
    setAudioUrl("");
    setCoverUrl("");
    setUploadError(null);
    setMessage(null);
    setPhase("files");
    setOpen(true);
  }, []);

  const resetUpload = useCallback(() => {
    if (thumbPreview) URL.revokeObjectURL(thumbPreview);
    setThumbPreview(null);
    setAudioFile(null);
    setThumbFile(null);
    setAudioUrl("");
    setCoverUrl("");
    setUploadError(null);
    setMessage(null);
    setPhase("files");
  }, [thumbPreview]);

  /* Lock body scroll while the dialog is open. */
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
      if (thumbPreview) URL.revokeObjectURL(thumbPreview);
    };
  }, [open, close, thumbPreview]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!audioFile || !thumbFile || uploading) return;
    setUploading(true);
    setUploadError(null);
    setMessage(null);
    try {
      const songUrl = await uploadFile(audioFile, "Audio");
      try {
        const cover = await uploadFile(thumbFile, "Thumbs");
        setAudioUrl(songUrl);
        setCoverUrl(cover);
        setPhase("meta");
      } catch (err) {
        // Cover failed — keep the audio URL but report the error.
        throw err;
      }
    } catch (err) {
      setUploadError((err as Error)?.message ?? "Upload failed. Try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/add-song", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: meta.title.trim(),
          artist: meta.artist.trim(),
          album: meta.album.trim() || null,
          cover: coverUrl,
          url: audioUrl,
          playlist: meta.playlist.trim(),
        }),
      });
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      if (res.ok) {
        setMessage({ text: "Song added to the library", type: "ok" });
        setMeta(EMPTY_META);
        setAudioUrl("");
        setCoverUrl("");
        clearCache("playlists");
        clearCache("playlist:");
      } else {
        setMessage({ text: data?.error ?? "Failed to add song", type: "error" });
      }
    } catch {
      setMessage({ text: "Network error while saving", type: "error" });
    } finally {
      setBusy(false);
    }
  };

  const trigger = (
    <button
      type="button"
      onClick={openDialog}
      className="btn-secondary inline-flex items-center gap-2 py-2"
    >
      <PlusIcon className="size-4" />
      <span className="text-sm">Add</span>
    </button>
  );

  /* Rendered through a portal so the fixed overlay positions against the
     viewport — the sticky, backdrop-blurred header otherwise becomes the
     containing block and traps `position: fixed` inside the header. */
  const dialog = open
    ? createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Add a new song"
          className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-page/60 p-4 backdrop-blur-sm"
          onClick={close}
        >
          <div
            className="panel relative my-auto w-full max-w-md border border-line bg-card p-6 sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={close}
              className="btn-icon absolute top-4 right-4"
              aria-label="Close dialog"
            >
              <CloseIcon className="size-4" />
            </button>

            <h2 className="section-label mb-6 pr-10">Add a New Song</h2>

            {phase === "files" ? (
              <form onSubmit={handleUpload} className="space-y-4" noValidate>
                <div className="grid grid-cols-2 gap-3">
                  <label className="field flex cursor-pointer flex-col items-center justify-center gap-2 py-8 text-center">
                    {audioFile ? (
                      <MusicIcon className="size-5 text-tert" />
                    ) : (
                      <PlusIcon className="size-5 text-muted" />
                    )}
                    <span className="text-xs font-medium">
                      {audioFile ? audioFile.name : "Song (mp3, m4a…)"}
                    </span>
                    {audioFile && (
                      <span className="font-mono text-[10px] text-muted">
                        {formatSize(audioFile.size)}
                      </span>
                    )}
                    <input
                      type="file"
                      accept={AUDIO_ACCEPT}
                      onChange={onAudioPick}
                      className="sr-only"
                    />
                  </label>

                  <label className="field flex cursor-pointer flex-col items-center justify-center gap-2 py-8 text-center">
                    {thumbPreview ? (
                      <img
                        src={thumbPreview}
                        alt=""
                        className="size-10 object-cover"
                      />
                    ) : (
                      <PlusIcon className="size-5 text-muted" />
                    )}
                    <span className="text-xs font-medium">
                      {thumbFile ? thumbFile.name : "Thumbnail"}
                    </span>
                    {thumbFile && (
                      <span className="font-mono text-[10px] text-muted">
                        {formatSize(thumbFile.size)}
                      </span>
                    )}
                    <input
                      type="file"
                      accept={IMAGE_ACCEPT}
                      onChange={onThumbPick}
                      className="sr-only"
                    />
                  </label>
                </div>

                {!audioFile || !thumbFile ? (
                  <p className="text-sm text-muted">
                    Pick a song and a thumbnail — they will be uploaded to
                    Cloudflare automatically.
                  </p>
                ) : (
                  <p className="text-sm text-muted">
                    Both files are ready. Upload them to Cloudflare to continue.
                  </p>
                )}

                {uploadError && (
                  <p role="alert" className="text-sm text-danger">
                    {uploadError}
                  </p>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={close}
                    disabled={uploading}
                    className="btn-secondary flex-1 py-2.5"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!audioFile || !thumbFile || uploading}
                    className="btn-primary flex flex-1 items-center justify-center gap-2 py-2.5"
                  >
                    {uploading && <Spinner className="text-page" />}
                    {uploading ? "Uploading…" : "Upload to Cloudflare"}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4" noValidate={false}>
                <div className="flex items-center gap-3 rounded-lg border border-line bg-[#171717] p-3">
                  {thumbPreview && (
                    <img
                      src={thumbPreview}
                      alt=""
                      className="size-14 shrink-0 object-cover"
                    />
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-fg">
                      {meta.title || "Untitled"}
                    </p>
                    <p className="truncate font-mono text-[10px] text-muted" title={audioUrl}>
                      {audioUrl || "…"}
                    </p>
                  </div>
                </div>

                <Field
                  label="Title"
                  name="title"
                  value={meta.title}
                  onChange={handleMeta}
                  required
                  autoFocus
                  placeholder="Song title"
                />
                <Field
                  label="Artist"
                  name="artist"
                  value={meta.artist}
                  onChange={handleMeta}
                  required
                  placeholder="Artist name"
                />
                <Field
                  label="Album"
                  name="album"
                  value={meta.album}
                  onChange={handleMeta}
                  placeholder="Album (optional)"
                />
                <Field
                  label="Playlist"
                  name="playlist"
                  value={meta.playlist}
                  onChange={handleMeta}
                  required
                  placeholder="hindi, qawwali, …"
                />

                {message && (
                  <p
                    role="status"
                    className={`text-sm font-medium ${message.type === "ok" ? "text-tert" : "text-danger"}`}
                  >
                    {message.text}
                  </p>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={resetUpload}
                    disabled={busy}
                    className="btn-secondary flex-1 py-2.5"
                  >
                    Change files
                  </button>
                  <button
                    type="submit"
                    disabled={busy}
                    className="btn-primary flex flex-1 items-center justify-center gap-2 py-2.5"
                  >
                    {busy && <Spinner className="text-page" />}
                    {busy ? "Saving" : "Save song"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>,
        document.body,
      )
    : null;

  return (
    <>
      {trigger}
      {dialog}
    </>
  );
}