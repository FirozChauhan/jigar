"use client";

import { useState } from "react";
import { useAuth } from "@/providers/auth-provider";
import { GlowBlobs } from "./glow-blobs";
import { Spinner } from "./ui-state";

export function LoginView() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await login(username, password);
      if (!res.ok) setError(res.error ?? "Invalid username or password");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4">
      <GlowBlobs />

      <div className="panel relative w-full max-w-sm border border-line bg-card p-10">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <span
            lang="ur"
            dir="rtl"
            className="font-reem text-5xl leading-none font-bold tracking-tight text-fg"
          >
            جگر
          </span>
          <p lang="ur" dir="rtl" className="font-reem text-sm text-muted">
            دل پھر بھی میرا دل ہے دل ہی تو زمانا ہے
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="label mb-2 block">
              Username
            </label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="field"
              placeholder="username"
            />
          </div>
          <div>
            <label htmlFor="password" className="label mb-2 block">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="field"
              placeholder="••••••"
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="btn-primary flex w-full items-center justify-center gap-2"
          >
            {busy && <Spinner className="text-page" />}
            {busy ? "Checking" : "Enter"}
          </button>
        </form>
      </div>
    </div>
  );
}