import Link from "next/link";

export default function NotFound() {
  return (
    <div className="panel flex flex-col items-center justify-center gap-6 py-24 text-center">
      <p className="font-mono text-7xl font-extrabold tracking-[0.2em] text-muted">
        404
      </p>
      <p className="label">Page not found</p>
      <p className="max-w-sm text-sm text-muted">
        The track you are looking for has left the building.
      </p>
      <Link href="/" className="btn-primary">
        Back to library
      </Link>
    </div>
  );
}