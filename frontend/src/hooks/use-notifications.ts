'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import type { Notification } from '@/types';

export function useNotifications(enabled = true) {
  return useQuery({
    queryKey: queryKeys.notifications.all,
    queryFn: async () => {
      const { data } = await api.get<Notification[]>('/notifications');
      return data;
    },
    enabled,
  });
}

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: queryKeys.notifications.unreadCount,
    queryFn: async () => {
      const { data } = await api.get<{ count: number }>('/notifications/unread-count');
      return data.count;
    },
    refetchInterval: 60_000,
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.patch<Notification>(`/notifications/${id}/read`);
      return data;
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: queryKeys.notifications.all });
      const prevList = qc.getQueryData<Notification[]>(queryKeys.notifications.all);
      const prevCount = qc.getQueryData<number>(queryKeys.notifications.unreadCount);

      if (prevList) {
        const target = prevList.find((n) => n.id === id);
        qc.setQueryData<Notification[]>(
          queryKeys.notifications.all,
          prevList.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
        );
        if (target && !target.isRead && typeof prevCount === 'number') {
          qc.setQueryData(queryKeys.notifications.unreadCount, Math.max(0, prevCount - 1));
        }
      }
      return { prevList, prevCount };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prevList) qc.setQueryData(queryKeys.notifications.all, ctx.prevList);
      if (typeof ctx?.prevCount === 'number') {
        qc.setQueryData(queryKeys.notifications.unreadCount, ctx.prevCount);
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: queryKeys.notifications.all });
      qc.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await api.patch('/notifications/mark-all-read');
    },
    onMutate: async () => {
      const prevList = qc.getQueryData<Notification[]>(queryKeys.notifications.all);
      const prevCount = qc.getQueryData<number>(queryKeys.notifications.unreadCount);
      if (prevList) {
        qc.setQueryData<Notification[]>(
          queryKeys.notifications.all,
          prevList.map((n) => ({ ...n, isRead: true })),
        );
      }
      qc.setQueryData(queryKeys.notifications.unreadCount, 0);
      return { prevList, prevCount };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prevList) qc.setQueryData(queryKeys.notifications.all, ctx.prevList);
      if (typeof ctx?.prevCount === 'number') {
        qc.setQueryData(queryKeys.notifications.unreadCount, ctx.prevCount);
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: queryKeys.notifications.all });
      qc.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount });
    },
  });
}
