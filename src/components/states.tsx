import { LumeMark } from "./brand";
import { cn } from "./ui";

/**
 * Shared loading and error surfaces.
 *
 * Skeletons mirror the shape of what is arriving so the page does not jump
 * when it lands, and error surfaces always offer a way forward rather than
 * dead-ending on a stack trace.
 */

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("shimmer rounded-xl", className)} aria-hidden />;
}

/** Page-level skeleton: header, stat row, then content blocks. */
export function PageSkeleton({
  stats = 4,
  blocks = 2,
  label = "Loading",
}: {
  stats?: number;
  blocks?: number;
  label?: string;
}) {
  return (
    <div role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">{label}</span>

      <div className="mb-6">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="mt-3 h-8 w-72" />
        <Skeleton className="mt-3 h-4 w-full max-w-xl" />
      </div>

      {stats > 0 ? (
        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: stats }, (_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      ) : null}

      <div className="grid gap-5">
        {Array.from({ length: blocks }, (_, i) => (
          <Skeleton key={i} className="h-56 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

/** Brand loader for routes with nothing meaningful to skeleton. */
export function RouteLoader({ label = "Loading Lume AI" }: { label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center justify-center gap-3 py-24"
    >
      <span className="relative flex size-12 items-center justify-center text-brand">
        <span className="pulse-ring absolute inset-0 rounded-full" />
        <LumeMark className="size-10" />
      </span>
      <p className="text-sm text-muted">{label}</p>
    </div>
  );
}
