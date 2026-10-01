function Shimmer({ className = "" }: { className?: string }) {
  return (
    <span
      className={`block overflow-hidden rounded-full bg-[color-mix(in_oklab,var(--foreground)_8%,transparent)] ${className}`}
    >
      <span className="block h-full w-full animate-[shimmer_1.6s_infinite] bg-[linear-gradient(90deg,transparent,color-mix(in_oklab,var(--card)_85%,transparent),transparent)]" />
    </span>
  );
}

export function MaterialCardSkeleton() {
  return (
    <article className="rounded-[28px] bg-card p-5 shadow-sm" aria-hidden="true">
      <div className="flex items-start gap-3">
        <Shimmer className="h-12 w-12 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1 space-y-2.5">
          <Shimmer className="h-4 w-3/5 rounded-md" />
          <Shimmer className="h-3 w-2/5 rounded-md" />
          <Shimmer className="mt-4 h-1.5 w-full" />
        </div>
      </div>
      <div className="mt-5 flex gap-2">
        <Shimmer className="h-10 w-28 rounded-full" />
        <Shimmer className="h-10 w-28 rounded-full" />
      </div>
    </article>
  );
}

export function MaterialListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2" role="status" aria-label="Carregando materiais">
      {Array.from({ length: count }, (_, index) => (
        <MaterialCardSkeleton key={index} />
      ))}
      <span className="sr-only">Carregando materiais…</span>
    </div>
  );
}

export function StatSkeleton() {
  return (
    <div className="rounded-3xl bg-card p-5 shadow-sm" aria-hidden="true">
      <Shimmer className="h-3 w-20 rounded-md" />
      <Shimmer className="mt-3 h-7 w-14 rounded-md" />
    </div>
  );
}
