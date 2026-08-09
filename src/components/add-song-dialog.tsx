"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { clearCache } from "@/lib/cache";
import { CloseIcon, PlusIcon } from "./icons";
import { Spinner } from "./ui-state";

interface FormState {
  title: string;
  artist: string;
  album: string;
  cover: string;
  url: string;
  playlist: string;
}

const EMPTY_FORM: FormState = {
  title: "",
  artist: "",
  album: "",
  cover: "",
  url: "",
  playlist: "",
};

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
  name: keyof FormState;
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

export function AddSongDialog() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "ok" | "error" } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const close = useCallback(() => {
    if (busy) return;
    setOpen(false);
  }, [busy]);

  const openDialog = useCallback(() => {
    setForm(EMPTY_FORM);
    setMessage(null);
    setOpen(true);
  }, []);

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
    };
  }, [open, close]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/add-song", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          artist: form.artist.trim(),
          album: form.album.trim() || null,
          cover: form.cover.trim(),
          url: form.url.trim(),
          playlist: form.playlist.trim(),
        }),
      });
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      if (res.ok) {
        setMessage({ text: "Song added to the library", type: "ok" });
        setForm(EMPTY_FORM);
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

            <form onSubmit={handleSubmit} className="space-y-4" noValidate={false}>
              <Field
                label="Title"
                name="title"
                value={form.title}
                onChange={handleChange}
                required
                autoFocus
                placeholder="Song title"
              />
              <Field
                label="Artist"
                name="artist"
                value={form.artist}
                onChange={handleChange}
                required
                placeholder="Artist name"
              />
              <Field
                label="Album"
                name="album"
                value={form.album}
                onChange={handleChange}
                placeholder="Album (optional)"
              />
              <Field
                label="Cover URL"
                name="cover"
                type="url"
                value={form.cover}
                onChange={handleChange}
                required
                placeholder="https://…/artwork.jpg"
              />
              <Field
                label="Song URL"
                name="url"
                type="url"
                value={form.url}
                onChange={handleChange}
                required
                placeholder="https://…/track.mp3"
              />
              <Field
                label="Playlist"
                name="playlist"
                value={form.playlist}
                onChange={handleChange}
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
                <button type="button" onClick={close} className="btn-secondary flex-1 py-2.5">
                  Cancel
                </button>
                <button type="submit" disabled={busy} className="btn-primary flex flex-1 items-center justify-center gap-2 py-2.5">
                  {busy && <Spinner className="text-page" />}
                  {busy ? "Saving" : "Save"}
                </button>
              </div>
            </form>
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