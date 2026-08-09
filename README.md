# JIGAR

A minimal, self-hosted music streaming app for a personal library. Songs and
covers live in Cloudflare R2; metadata and auth live in PostgreSQL.

## Stack

- Next.js 16 (App Router), React 19, Tailwind CSS 4
- PostgreSQL — tracks (`fanaa` table) + auth (`users` table)
- Cloudflare R2 — MP3s and thumbnails, uploaded straight from the "Add song" dialog

## Requirements

1. A **PostgreSQL** database (any host — Neon, Supabase, Railway, a local
   Postgres, whatever).
2. A **Cloudflare** account with **R2** enabled. Create one bucket and open it
   to the public (R2 → your bucket → Settings → Public Access → allow access
   via the `*.r2.dev` URL).

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the env template and fill it in:

   ```bash
   cp .env.example .env.local
   ```

   - `DATABASE_URL` — your Postgres connection string (include `?sslmode=require` if the host requires TLS).
   - `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME` — from Cloudflare R2 → Overview → Manage R2 API Tokens. Create a token with **Object Read & Write** on the bucket.
   - `NEXT_PUBLIC_R2_DOMAIN` — the public URL of your bucket (the `https://pub-xxx.r2.dev` one).

3. Create the `users` table and your login:

   ```bash
   npm run db:seed
   ```

   It will ask for a username/password (or read `JIGAR_USERNAME` / `JIGAR_PASSWORD`
   from the env) and store the scrypt hash. The `fanaa` tracks table is created
   automatically on first insert.

4. Run it:

   ```bash
   npm run dev
   ```

## Usage

- Log in with the seeded user.
- **Add song**: pick an MP3 + a thumbnail. Both are uploaded to R2
  (`Audio/` and `Thumbs/` folders) with long-lived caching, then you fill in
  title/artist/playlist and save.
- Search by title or artist; playlists are just comma-separated tags on a track.

## Deploying

- Set the same env vars on your host (Render, Vercel, etc.) and run the normal
  Next.js build (`npm run build && npm start`).
- On Render the header version comes from the latest git tag automatically
  (fetched during the build), falling back to `package.json`.

## Scripts

- `npm run dev` — local dev
- `npm run build` — production build
- `npm run lint` / `npm run typecheck` — quality checks
- `npm run db:seed` — create/update the auth user
