'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, getApiErrorMessage } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import type { Activity, ActivityType, PaginatedResponse } from '@/types';

export interface ActivityFilters {
  page?: number;
  limit?: number;
  search?: string;
  contactId?: string;
  dealId?: string;
  type?: ActivityType;
}

export interface ActivityPayload {
  type: ActivityType;
  subject: string;
  body?: string;
  occurredAt?: string;
  contactId?: string;
  dealId?: string;
}

export function useActivities(filters: ActivityFilters = {}) {
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== undefined && v !== ''),
  );
  return useQuery({
    queryKey: queryKeys.activities.list(params),
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Activity>>('/activities', { params });
      return data;
    },
    placeholderData: keepPreviousData,
  });
}

export function useCreateActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ActivityPayload) => {
      const { data } = await api.post<Activity>('/activities', payload);
      return data;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.activities.all });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      if (vars.contactId) {
        qc.invalidateQueries({ queryKey: queryKeys.contacts.detail(vars.contactId) });
      }
      if (vars.dealId) {
        qc.invalidateQueries({ queryKey: queryKeys.deals.detail(vars.dealId) });
      }
      toast.success('Activity logged');
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Failed to log activity')),
  });
}

export function useDeleteActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/activities/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.activities.all });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      toast.success('Activity removed');
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Failed to remove activity')),
  });
}
