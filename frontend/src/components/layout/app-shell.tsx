'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useIsFetching } from '@tanstack/react-query';
import {
  Building2,
  CheckSquare,
  FileClock,
  Kanban,
  LayoutDashboard,
  LogOut,
  Menu,
  Sparkles,
  UserCog,
  Users,
} from 'lucide-react';
import { cn, getInitials } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';
import { useLogout } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { NotificationPopover } from '@/components/layout/notification-popover';
import { RoleBadge } from '@/components/shared/status-badge';
import type { Role } from '@/types';

interface NavItem {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  roles?: Role[];
}

const MAIN_NAV: NavItem[] = [
  { label: 'Overview', href: '/', icon: LayoutDashboard },
  { label: 'Contacts', href: '/contacts', icon: Users },
  { label: 'Companies', href: '/companies', icon: Building2 },
  { label: 'Leads', href: '/leads', icon: Sparkles },
  { label: 'Deals', href: '/deals', icon: Kanban },
  { label: 'Tasks', href: '/tasks', icon: CheckSquare },
];

const ADMIN_NAV: NavItem[] = [
  { label: 'Team', href: '/users', icon: UserCog, roles: ['ADMIN', 'MANAGER'] },
  { label: 'Audit Log', href: '/audit', icon: FileClock, roles: ['ADMIN', 'MANAGER'] },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);

  const visibleAdminNav = ADMIN_NAV.filter(
    (item) => !item.roles || (user && item.roles.includes(user.role)),
  );

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-14 items-center gap-2.5 px-5 border-b border-sidebar-border">
        <div className="flex size-7 items-center justify-center rounded-lg bg-stone-900 text-xs font-semibold tracking-tight text-stone-50">
          A
        </div>
        <span className="text-sm font-semibold tracking-tight">Vynqora CRM</span>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
        <div className="space-y-0.5">
          {MAIN_NAV.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  'flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors',
                  active
                    ? 'bg-sidebar-accent text-foreground'
                    : 'text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground',
                )}
              >
                <Icon className={cn('size-4', active ? 'text-foreground' : 'text-muted-foreground')} />
                {item.label}
              </Link>
            );
          })}
        </div>

        {visibleAdminNav.length > 0 && (
          <div className="space-y-1">
            <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">
              Administration
            </p>
            <div className="space-y-0.5">
              {visibleAdminNav.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                      'flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors',
                      active
                        ? 'bg-sidebar-accent text-foreground'
                        : 'text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground',
                    )}
                  >
                    <Icon
                      className={cn('size-4', active ? 'text-foreground' : 'text-muted-foreground')}
                    />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      {user && (
        <div className="border-t border-sidebar-border p-3">
          <div className="flex items-center gap-2.5 rounded-lg px-2 py-1.5">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-stone-200 text-[11px] font-semibold text-stone-700">
              {getInitials(user.firstName, user.lastName)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-foreground">
                {user.firstName} {user.lastName}
              </p>
              <p className="truncate text-[11px] text-muted-foreground">{user.email}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const isFetching = useIsFetching();

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden w-56 shrink-0 border-r border-sidebar-border md:block">
        <div className="sticky top-0 h-screen">
          <SidebarContent />
        </div>
      </aside>

      {/* Main Column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Subtle top fetching bar */}
        <div className="h-[2px] w-full overflow-hidden bg-transparent">
          {isFetching > 0 && (
            <div className="h-full w-1/3 animate-pulse bg-stone-900/70 transition-all" />
          )}
        </div>

        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border/80 bg-background/85 px-4 backdrop-blur-sm sm:px-8">
          <div className="flex items-center gap-2 md:hidden">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger
                render={
                  <Button variant="ghost" size="icon">
                    <Menu className="size-4" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                }
              />
              <SheetContent side="left" className="w-60 p-0">
                <SheetTitle className="sr-only">Navigation</SheetTitle>
                <SidebarContent onNavigate={() => setMobileOpen(false)} />
              </SheetContent>
            </Sheet>
            <span className="text-sm font-semibold tracking-tight">Atelier CRM</span>
          </div>

          <div className="hidden md:block" />

          <div className="flex items-center gap-2">
            <NotificationPopover />

            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button variant="ghost" size="sm" className="gap-2 px-2">
                      <span className="flex size-6 items-center justify-center rounded-full bg-stone-200 text-[11px] font-semibold text-stone-700">
                        {getInitials(user.firstName, user.lastName)}
                      </span>
                      <span className="hidden text-xs font-medium sm:inline">
                        {user.firstName}
                      </span>
                    </Button>
                  }
                />
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-2 space-y-1.5">
                    <p className="text-xs font-medium text-foreground">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
                    <RoleBadge role={user.role} />
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => logout.mutate()}
                    className="text-destructive focus:text-destructive cursor-pointer"
                  >
                    <LogOut className="size-3.5" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-7 sm:px-8">{children}</main>
      </div>
    </div>
  );
}
