'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { useMe } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';
import type { Role } from '@/types';

interface AuthGuardProps {
  children: ReactNode;
  allowedRoles?: Role[];
}

export function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const router = useRouter();
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const clearSession = useAuthStore((s) => s.clearSession);

  const { isError } = useMe(hasHydrated && Boolean(accessToken));

  useEffect(() => {
    if (!hasHydrated) return;
    if (!accessToken || isError) {
      if (isError) clearSession();
      router.replace('/login');
    }
  }, [hasHydrated, accessToken, isError, clearSession, router]);

  if (!hasHydrated || !accessToken || !user) {
    return (
      <div className="flex min-h-screen bg-background">
        <div className="hidden w-60 border-r border-border bg-sidebar p-5 md:block space-y-4">
          <Skeleton className="h-6 w-28" />
          <div className="space-y-2 pt-4">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        </div>
        <div className="flex-1 p-8 space-y-6">
          <Skeleton className="h-7 w-48" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <h2 className="text-base font-semibold text-foreground">Access restricted</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          You don&apos;t have permission to view this section.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
