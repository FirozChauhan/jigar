#!/usr/bin/env node
/* Seeds the `users` auth table with one username/password.
   Credentials come from DATABASE_URL + JIGAR_USERNAME + JIGAR_PASSWORD.
   Passwords are stored as an scrypt hash with a random per-user salt. */

const { Pool } = require("pg");
const { scryptSync, randomBytes, timingSafeEqual } = require("crypto");
const readline = require("readline");
const fs = require("fs");
const path = require("path");

/* Node alone does not load Next-style env files — read them and merge in. */
function loadEnv(file) {
  try {
    const raw = fs.readFileSync(path.join(process.cwd(), file), "utf8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      let val = m[2].trim();
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
      if (process.env[m[1]] === undefined) process.env[m[1]] = val;
    }
  } catch {
    // env file missing — rely on the shell environment instead
  }
}
loadEnv(".env.local");
loadEnv(".env");

const connectionString = process.env.DATABASE_URL || "";
let username = process.env.JIGAR_USERNAME || "";
let password = process.env.JIGAR_PASSWORD || "";

function ask(prompt) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(prompt, (a) => { rl.close(); resolve(a.trim()); }));
}

(async () => {
  if (!connectionString) {
    console.error("Missing DATABASE_URL in environment.");
    process.exit(1);
  }
  if (!username) username = await ask("Username: ");
  if (!password) password = await ask("Password: ");

  const pool = new Pool({
    connectionString,
    ssl: connectionString.includes("sslmode=require")
      ? { rejectUnauthorized: process.env.ALLOW_SELF_SIGNED_DB_SSL !== "true" }
      : false,
  });

  try {
    // Ensure the users table exists first (fused no-migrations fanaa DB).
    await pool.query(
      `CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`,
    );

    const salt = randomBytes(16).toString("hex");
    const password_hash = `${salt}$${scryptSync(password, salt, 64).toString("hex")}`;

    await pool.query(
      `INSERT INTO users (username, password_hash)
       VALUES ($1, $2)
       ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash`,
      [username, password_hash],
    );

    // Verify round-trip.
    const { rows } = await pool.query(
      "SELECT username, password_hash FROM users WHERE username = $1",
      [username],
    );
    const [s, h] = String(rows[0].password_hash).split("$");
    const ok =
      rows[0].username === username &&
      timingSafeEqual(scryptSync(password, s, 64), Buffer.from(h, "hex"));
    console.log(ok ? `Seeded user '${username}' (scrypt hash verified).` : "FAILED");
    if (!ok) process.exitCode = 1;
  } catch (err) {
    console.error("Seed failed:", err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
})();