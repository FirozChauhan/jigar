// Small presentational bits: spinners, skeletons and the empty state.

export function Spinner({ className = "size-4" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent ${className}`}
    />
  );
}

export function LoadingDots({ className = "" }: { className?: string }) {
  return (
    <span className={`loading-dots ${className}`} aria-hidden="true">
      <span />
      <span />
      <span />
    </span>
  );
}

export function EmptyState({
  icon,
  title,
  hint,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  hint?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="panel flex flex-col items-center justify-center gap-3 border border-dashed border-line bg-card/40 py-24 px-6 text-center">
      {icon && (
        <div className="flex size-12 items-center justify-center rounded-full bg-line/10 text-muted">
          {icon}
        </div>
      )}
      <p className="section-label">{title}</p>
      {hint && <p className="max-w-sm text-sm text-muted">{hint}</p>}
      {action}
    </div>
  );
}

export function CardSkeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`card flex animate-pulse flex-col justify-between gap-3 p-3 ${className}`}
      aria-hidden="true"
    >
      <div className="h-3 w-3/4 bg-card2/70" />
      <div className="h-2.5 w-1/3 bg-card2/60" />
    </div>
  );
}

export function ListSkeleton({ rows = 8, withCover = true }: { rows?: number; withCover?: boolean }) {
  return (
    <div className="space-y-3" aria-hidden="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex animate-pulse items-center gap-3 border border-line bg-card p-3">
          {withCover && <div className="size-16 shrink-0 bg-card2/70" />}
          <div className="flex-1 space-y-2">
            <div className="h-3 w-4/5 bg-card2/70" />
            <div className="h-3 w-1/2 bg-card2/70" />
          </div>
        </div>
      ))}
    </div>
  );
}