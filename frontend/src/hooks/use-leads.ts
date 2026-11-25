'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, getApiErrorMessage } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import type { Deal, Lead, LeadStatus, PaginatedResponse } from '@/types';

export interface LeadFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: LeadStatus;
  assignedToId?: string;
}

export interface LeadPayload {
  contactId: string;
  source?: string;
  status?: LeadStatus;
  score?: number;
  notes?: string;
  assignedToId?: string;
}

export interface ConvertLeadPayload {
  title: string;
  value?: number;
  expectedCloseDate?: string;
}

export function useLeads(filters: LeadFilters = {}) {
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== undefined && v !== ''),
  );
  return useQuery({
    queryKey: queryKeys.leads.list(params),
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Lead>>('/leads', { params });
      return data;
    },
    placeholderData: keepPreviousData,
  });
}

export function useCreateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: LeadPayload) => {
      const { data } = await api.post<Lead>('/leads', payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.leads.all });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      toast.success('Lead created');
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Failed to create lead')),
  });
}

export function useUpdateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<LeadPayload> }) => {
      const { data } = await api.patch<Lead>(`/leads/${id}`, payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.leads.all });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      toast.success('Lead updated');
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Failed to update lead')),
  });
}

export function useConvertLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: ConvertLeadPayload }) => {
      const { data } = await api.post<Deal>(`/leads/${id}/convert`, payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.leads.all });
      qc.invalidateQueries({ queryKey: queryKeys.deals.all });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      toast.success('Lead converted to deal');
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Could not convert lead')),
  });
}

export function useDeleteLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/leads/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.leads.all });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      toast.success('Lead deleted');
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Failed to delete lead')),
  });
}
