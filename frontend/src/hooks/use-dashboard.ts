'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import type { Activity, DashboardKpis, PipelineSummaryItem, Task } from '@/types';

export function useDashboardKpis() {
  return useQuery({
    queryKey: queryKeys.dashboard.kpis,
    queryFn: async () => {
      const { data } = await api.get<DashboardKpis>('/dashboard/kpis');
      return data;
    },
  });
}

export function useDashboardPipeline() {
  return useQuery({
    queryKey: queryKeys.dashboard.pipeline,
    queryFn: async () => {
      const { data } = await api.get<PipelineSummaryItem[]>('/dashboard/pipeline');
      return data;
    },
  });
}

export function useDashboardRecentActivity() {
  return useQuery({
    queryKey: queryKeys.dashboard.recentActivity,
    queryFn: async () => {
      const { data } = await api.get<Activity[]>('/dashboard/recent-activity');
      return data;
    },
  });
}

export function useDashboardUpcomingTasks() {
  return useQuery({
    queryKey: queryKeys.dashboard.upcomingTasks,
    queryFn: async () => {
      const { data } = await api.get<Task[]>('/dashboard/upcoming-tasks');
      return data;
    },
  });
}
