/** Low-opacity ambient radial glow blobs. Purely decorative. */
export function GlowBlobs() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="glow-blob absolute -top-24 -left-24 h-72 w-72 opacity-30" />
      <div className="glow-blob absolute top-1/3 right-0 h-80 w-80 opacity-25" />
      <div className="glow-blob absolute -bottom-24 left-1/2 h-72 w-72 opacity-25" />
    </div>
  );
}