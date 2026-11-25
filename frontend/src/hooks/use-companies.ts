'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, getApiErrorMessage } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import type { Company, PaginatedResponse } from '@/types';

export interface CompanyFilters {
  page?: number;
  limit?: number;
  search?: string;
}

export interface CompanyPayload {
  name: string;
  industry?: string;
  size?: string;
  website?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  notes?: string;
}

export function useCompanies(filters: CompanyFilters = {}) {
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== undefined && v !== ''),
  );
  return useQuery({
    queryKey: queryKeys.companies.list(params),
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Company>>('/companies', { params });
      return data;
    },
    placeholderData: keepPreviousData,
  });
}

export function useCompany(id: string) {
  return useQuery({
    queryKey: queryKeys.companies.detail(id),
    queryFn: async () => {
      const { data } = await api.get<Company>(`/companies/${id}`);
      return data;
    },
    enabled: Boolean(id),
  });
}

export function useCreateCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CompanyPayload) => {
      const { data } = await api.post<Company>('/companies', payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.companies.all });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      toast.success('Company created');
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Failed to create company')),
  });
}

export function useUpdateCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<CompanyPayload> }) => {
      const { data } = await api.patch<Company>(`/companies/${id}`, payload);
      return data;
    },
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: queryKeys.companies.all });
      qc.setQueryData(queryKeys.companies.detail(updated.id), updated);
      toast.success('Company updated');
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Failed to update company')),
  });
}

export function useDeleteCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/companies/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.companies.all });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      toast.success('Company deleted');
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Failed to delete company')),
  });
}
