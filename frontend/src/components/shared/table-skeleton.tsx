import { Skeleton } from '@/components/ui/skeleton';

export function TableSkeleton({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="border-b border-border bg-muted/40 px-4 py-3 flex gap-6">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-3.5 w-24" />
        ))}
      </div>
      <div className="divide-y divide-border/70">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex items-center gap-6 px-4 py-3.5">
            {Array.from({ length: cols }).map((__, c) => (
              <Skeleton
                key={c}
                className={c === 0 ? 'h-4 w-36' : c === cols - 1 ? 'h-4 w-16 ml-auto' : 'h-4 w-28'}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
