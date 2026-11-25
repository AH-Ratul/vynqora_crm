'use client';

import Link from 'next/link';
import {
  Activity as ActivityIcon,
  ArrowUpRight,
  Building2,
  CheckCircle2,
  Clock,
  DollarSign,
  Kanban,
  Sparkles,
  Users,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { PageHeader } from '@/components/shared/page-header';
import { ActivityTypeBadge, TaskStatusBadge } from '@/components/shared/status-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useDashboardKpis,
  useDashboardPipeline,
  useDashboardRecentActivity,
  useDashboardUpcomingTasks,
} from '@/hooks/use-dashboard';
import { useAuthStore } from '@/stores/auth-store';
import { DEAL_STAGE_LABELS } from '@/types';
import { formatCurrency, formatDate, formatRelativeDate } from '@/lib/utils';

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const kpis = useDashboardKpis();
  const pipeline = useDashboardPipeline();
  const recentActivity = useDashboardRecentActivity();
  const upcomingTasks = useDashboardUpcomingTasks();

  const chartData = (pipeline.data ?? []).map((item) => ({
    name: DEAL_STAGE_LABELS[item.stage],
    value: Number(item.totalValue ?? 0),
    count: item.count,
  }));

  const primaryKpis = [
    {
      label: 'Closed Revenue',
      value: kpis.data ? formatCurrency(kpis.data.totalRevenue) : '—',
      sub: kpis.data ? `${kpis.data.wonDeals} won deals` : '',
      icon: DollarSign,
      href: '/deals',
    },
    {
      label: 'Open Deals',
      value: kpis.data?.openDeals ?? '—',
      sub: 'Active in pipeline',
      icon: Kanban,
      href: '/deals',
    },
    {
      label: 'Active Leads',
      value: kpis.data?.totalLeads ?? '—',
      sub: 'Not yet converted',
      icon: Sparkles,
      href: '/leads',
    },
    {
      label: 'Contacts',
      value: kpis.data?.totalContacts ?? '—',
      sub: kpis.data ? `${kpis.data.totalCompanies} companies` : '',
      icon: Users,
      href: '/contacts',
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Good day, ${user?.firstName ?? ''}`}
        description="A calm snapshot of your pipeline, accounts, and upcoming follow-ups."
      />

      {/* KPI Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="shadow-none">
                <CardContent className="p-5 space-y-3">
                  <Skeleton className="h-3.5 w-24" />
                  <Skeleton className="h-7 w-28" />
                  <Skeleton className="h-3 w-20" />
                </CardContent>
              </Card>
            ))
          : primaryKpis.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.label} href={item.href} className="group block">
                  <Card className="shadow-none transition-colors group-hover:border-stone-300">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span className="text-xs font-medium">{item.label}</span>
                        <Icon className="size-3.5" />
                      </div>
                      <p className="mt-2.5 text-2xl font-semibold tracking-tight tabular-nums text-foreground">
                        {item.value}
                      </p>
                      <div className="mt-1.5 flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>{item.sub}</span>
                        <ArrowUpRight className="size-3 opacity-0 transition-opacity group-hover:opacity-100" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
      </div>

      {/* Secondary strip */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
          <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
            <Building2 className="size-3.5" />
            Companies
          </div>
          <span className="text-sm font-semibold tabular-nums">
            {kpis.isLoading ? <Skeleton className="h-4 w-8" /> : kpis.data?.totalCompanies ?? 0}
          </span>
        </div>
        <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
          <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
            <Clock className="size-3.5" />
            Pending tasks
          </div>
          <span className="text-sm font-semibold tabular-nums">
            {kpis.isLoading ? <Skeleton className="h-4 w-8" /> : kpis.data?.pendingTasks ?? 0}
          </span>
        </div>
        <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
          <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
            <ActivityIcon className="size-3.5" />
            Activities (30d)
          </div>
          <span className="text-sm font-semibold tabular-nums">
            {kpis.isLoading ? <Skeleton className="h-4 w-8" /> : kpis.data?.recentActivities ?? 0}
          </span>
        </div>
      </div>

      {/* Pipeline Chart */}
      <Card className="shadow-none">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-sm font-semibold">Pipeline by Stage</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Total deal value distributed across stages
            </p>
          </div>
          <Link
            href="/deals"
            className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Open board →
          </Link>
        </CardHeader>
        <CardContent className="pt-4">
          {pipeline.isLoading ? (
            <Skeleton className="h-60 w-full rounded-lg" />
          ) : (
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E7E5E4" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#78716C', fontSize: 12 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#78716C', fontSize: 11 }}
                    tickFormatter={(v) => (v >= 1000 ? `$${Math.round(v / 1000)}k` : `$${v}`)}
                  />
                  <Tooltip
                    cursor={{ fill: '#F5F3EF' }}
                    contentStyle={{
                      background: '#FFFFFF',
                      border: '1px solid #E7E5E4',
                      borderRadius: '10px',
                      fontSize: '12px',
                    }}
                    formatter={(val) => [formatCurrency(Number(val ?? 0)), 'Total Value']}
                  />
                  <Bar dataKey="value" fill="#1C1917" radius={[6, 6, 0, 0]} maxBarSize={44} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bottom two-column grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <Card className="shadow-none">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-semibold">Recent Activity</CardTitle>
            <span className="text-xs text-muted-foreground">Latest 10</span>
          </CardHeader>
          <CardContent className="pt-0">
            {recentActivity.isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-lg" />
                ))}
              </div>
            ) : !recentActivity.data || recentActivity.data.length === 0 ? (
              <p className="py-10 text-center text-xs text-muted-foreground">
                No activities recorded yet.
              </p>
            ) : (
              <div className="divide-y divide-border/70">
                {recentActivity.data.map((act) => (
                  <div key={act.id} className="flex items-start justify-between gap-3 py-3">
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <ActivityTypeBadge type={act.type} />
                        <p className="truncate text-xs font-medium text-foreground">
                          {act.subject}
                        </p>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        {act.contact
                          ? `${act.contact.firstName} ${act.contact.lastName}`
                          : 'General'}{' '}
                        · by {act.createdBy?.firstName ?? 'Team'}
                      </p>
                    </div>
                    <span className="shrink-0 text-[11px] text-muted-foreground">
                      {formatRelativeDate(act.occurredAt)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Tasks */}
        <Card className="shadow-none">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-semibold">Upcoming Tasks</CardTitle>
            <Link
              href="/tasks"
              className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              View all →
            </Link>
          </CardHeader>
          <CardContent className="pt-0">
            {upcomingTasks.isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-lg" />
                ))}
              </div>
            ) : !upcomingTasks.data || upcomingTasks.data.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-center">
                <CheckCircle2 className="size-5 text-muted-foreground/60 mb-2" />
                <p className="text-xs text-muted-foreground">No upcoming tasks scheduled.</p>
              </div>
            ) : (
              <div className="divide-y divide-border/70">
                {upcomingTasks.data.map((task) => (
                  <div key={task.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-foreground">{task.title}</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {task.contact
                          ? `${task.contact.firstName} ${task.contact.lastName} · `
                          : ''}
                        Due {formatDate(task.dueDate)}
                      </p>
                    </div>
                    <TaskStatusBadge status={task.status} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
