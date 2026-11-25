'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useUnreadNotificationCount,
} from '@/hooks/use-notifications';
import { cn, formatRelativeDate } from '@/lib/utils';

export function NotificationPopover() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { data: unreadCount = 0 } = useUnreadNotificationCount();
  const { data: notifications, isLoading } = useNotifications(open);
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
            <Bell className="size-4" />
            {unreadCount > 0 && (
              <span className="absolute right-1.5 top-1.5 flex size-2 rounded-full bg-stone-900 ring-2 ring-background" />
            )}
            <span className="sr-only">Notifications</span>
          </Button>
        }
      />
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border px-3.5 py-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-foreground">Notifications</span>
            {unreadCount > 0 && (
              <span className="rounded-full bg-stone-900 px-1.5 py-0.5 text-[10px] font-medium text-stone-50">
                {unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={() => markAllRead.mutate()}
              className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
            >
              <CheckCheck className="size-3" />
              Mark all read
            </button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto divide-y divide-border/70">
          {isLoading ? (
            <div className="space-y-3 p-3.5">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <Skeleton className="h-3.5 w-32" />
                  <Skeleton className="h-3 w-full" />
                </div>
              ))}
            </div>
          ) : !notifications || notifications.length === 0 ? (
            <div className="py-10 text-center text-xs text-muted-foreground">
              You&apos;re all caught up.
            </div>
          ) : (
            notifications.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => {
                  if (!n.isRead) markRead.mutate(n.id);
                  if (n.link) {
                    setOpen(false);
                    router.push(n.link);
                  }
                }}
                className={cn(
                  'w-full px-3.5 py-3 text-left transition-colors hover:bg-muted/60',
                  !n.isRead && 'bg-stone-50/90',
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-medium text-foreground">{n.title}</span>
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {formatRelativeDate(n.createdAt)}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{n.message}</p>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
