'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, getApiErrorMessage } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import type { PaginatedResponse, Task, TaskStatus } from '@/types';

export interface TaskFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: TaskStatus;
  assignedToId?: string;
  contactId?: string;
  dealId?: string;
}

export interface TaskPayload {
  title: string;
  description?: string;
  status?: TaskStatus;
  dueDate?: string;
  contactId?: string;
  dealId?: string;
  assignedToId?: string;
}

export function useTasks(filters: TaskFilters = {}) {
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== undefined && v !== ''),
  );
  return useQuery({
    queryKey: queryKeys.tasks.list(params),
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Task>>('/tasks', { params });
      return data;
    },
    placeholderData: keepPreviousData,
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: TaskPayload) => {
      const { data } = await api.post<Task>('/tasks', payload);
      return data;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.tasks.all });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      if (vars.contactId) {
        qc.invalidateQueries({ queryKey: queryKeys.contacts.detail(vars.contactId) });
      }
      if (vars.dealId) {
        qc.invalidateQueries({ queryKey: queryKeys.deals.detail(vars.dealId) });
      }
      toast.success('Task created');
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Failed to create task')),
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<TaskPayload> }) => {
      const { data } = await api.patch<Task>(`/tasks/${id}`, payload);
      return data;
    },
    onMutate: async ({ id, payload }) => {
      if (!payload.status) return;
      await qc.cancelQueries({ queryKey: queryKeys.tasks.all });
      const snapshots = qc.getQueriesData<PaginatedResponse<Task>>({
        queryKey: queryKeys.tasks.all,
      });
      snapshots.forEach(([key, cached]) => {
        if (!cached?.data) return;
        qc.setQueryData<PaginatedResponse<Task>>(key, {
          ...cached,
          data: cached.data.map((t) => (t.id === id ? { ...t, ...payload } : t)),
        });
      });
      return { snapshots };
    },
    onError: (err, _vars, ctx) => {
      ctx?.snapshots?.forEach(([key, data]) => qc.setQueryData(key, data));
      toast.error(getApiErrorMessage(err, 'Failed to update task'));
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: queryKeys.tasks.all });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    },
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/tasks/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.tasks.all });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      toast.success('Task deleted');
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Failed to delete task')),
  });
}
