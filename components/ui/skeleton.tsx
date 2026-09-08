import { cn } from "@/lib/utils";

/** Neutral shimmer block used to build loading placeholders. */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-[var(--surface-subtle)]", className)} />;
}
