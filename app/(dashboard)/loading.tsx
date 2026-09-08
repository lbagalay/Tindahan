import { Skeleton } from "@/components/ui/skeleton";

/**
 * Instant loading UI shown while a dashboard route streams in. The persistent
 * app shell (sidebar/header) stays mounted via the layout; only this content
 * area is replaced by the skeleton, so navigation feels immediate.
 */
export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-[1500px]" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading…</span>

      {/* Page header */}
      <div className="flex flex-col gap-4 border-b border-[var(--border)] pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="w-full max-w-md">
          <Skeleton className="mb-2 h-3 w-24" />
          <Skeleton className="h-7 w-56" />
          <Skeleton className="mt-2 h-4 w-full max-w-sm" />
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Skeleton className="h-9 w-28 rounded-lg" />
          <Skeleton className="h-9 w-24 rounded-lg" />
        </div>
      </div>

      {/* Filter / tab row */}
      <div className="mt-6 flex flex-wrap gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-20 rounded-full" />
        ))}
      </div>

      {/* Card grid */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
            <div className="flex items-start justify-between">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="mt-4 h-4 w-3/4" />
            <Skeleton className="mt-2 h-4 w-1/2" />
            <Skeleton className="mt-5 h-6 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}
