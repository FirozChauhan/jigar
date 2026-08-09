// Receives a raw file (MP3 or image) and stores it in the R2 bucket under
// Audio/ or Thumbs/, returning the public URL. Auth-required.
import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/session";
import { uploadToR2 } from "@/lib/r2";

const AUDIO_EXTS = new Set(["mp3", "m4a", "ogg", "opus", "webm", "wav", "aac"]);
const IMAGE_EXTS = new Set(["jpg", "jpeg", "png", "webp", "avif", "gif"]);
const AUDIO_MAX = 30 * 1024 * 1024;
const IMAGE_MAX = 10 * 1024 * 1024;

const AUDIO_MIME: Record<string, string> = {
  mp3: "audio/mpeg",
  m4a: "audio/mp4",
  ogg: "audio/ogg",
  opus: "audio/ogg",
  webm: "audio/webm",
  wav: "audio/wav",
  aac: "audio/aac",
};

const IMAGE_MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
  gif: "image/gif",
};

export async function POST(req: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const folder = (req.headers.get("x-folder") ?? "").trim();
  const filename = (req.headers.get("x-filename") ?? "").trim();
  if (folder !== "Audio" && folder !== "Thumbs") {
    return NextResponse.json(
      { error: "Invalid folder (use Audio or Thumbs)." },
      { status: 400 },
    );
  }

  const dot = filename.lastIndexOf(".");
  const ext = dot >= 0 ? filename.slice(dot + 1).toLowerCase() : "";
  const allowed = folder === "Audio" ? AUDIO_EXTS : IMAGE_EXTS;
  if (!allowed.has(ext)) {
    return NextResponse.json(
      {
        error: `Unsupported ${folder === "Audio" ? "audio" : "image"} file type "${ext || "?"}".`,
      },
      { status: 400 },
    );
  }

  let bytes: ArrayBuffer;
  try {
    bytes = await req.arrayBuffer();
  } catch {
    return NextResponse.json({ error: "Could not read the request body." }, { status: 400 });
  }

  const size = bytes.byteLength;
  const max = folder === "Audio" ? AUDIO_MAX : IMAGE_MAX;
  if (size === 0) {
    return NextResponse.json({ error: "Empty file." }, { status: 400 });
  }
  if (size > max) {
    return NextResponse.json(
      {
        error: `File is too large (${(size / 1024 / 1024).toFixed(1)}MB / max ${max / 1024 / 1024}MB).`,
      },
      { status: 400 },
    );
  }

  const contentType =
    (req.headers.get("content-type") ?? "").split(";")[0]?.trim() ||
    (folder === "Audio" ? AUDIO_MIME[ext] : IMAGE_MIME[ext]);

  // Keep the uploaded file's own name, sanitized for a safe object key
  // (no path separators or hidden-dot tricks). Re-uploading the same name
  // overwrites that object.
  const safeName = filename
    .replace(/[\\/]/g, "-")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/^\.+/, "")
    .trim();
  const key = `${folder}/${safeName}`;

  try {
    const url = await uploadToR2({
      key,
      body: new Uint8Array(bytes),
      contentType,
    });
    return NextResponse.json({ url, key });
  } catch (err) {
    console.error("R2 upload failed:", err);
    return NextResponse.json(
      { error: "Upload failed. Check the R2 credentials in the environment." },
      { status: 500 },
    );
  }
}