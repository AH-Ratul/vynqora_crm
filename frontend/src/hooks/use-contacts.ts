'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, getApiErrorMessage } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import type { Contact, PaginatedResponse } from '@/types';
import type { ParsedContactRow } from '@/lib/csv';

export interface ContactFilters {
  page?: number;
  limit?: number;
  search?: string;
  companyId?: string;
  tag?: string;
}

export interface ContactPayload {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  title?: string;
  tags?: string[];
  notes?: string;
  companyId?: string;
}

export function useContacts(filters: ContactFilters = {}) {
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== undefined && v !== ''),
  );
  return useQuery({
    queryKey: queryKeys.contacts.list(params),
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Contact>>('/contacts', { params });
      return data;
    },
    placeholderData: keepPreviousData,
  });
}

export function useContact(id: string) {
  return useQuery({
    queryKey: queryKeys.contacts.detail(id),
    queryFn: async () => {
      const { data } = await api.get<Contact>(`/contacts/${id}`);
      return data;
    },
    enabled: Boolean(id),
  });
}

export function useCreateContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ContactPayload) => {
      const { data } = await api.post<Contact>('/contacts', payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.contacts.all });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      toast.success('Contact created');
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Failed to create contact')),
  });
}

export function useUpdateContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<ContactPayload> }) => {
      const { data } = await api.patch<Contact>(`/contacts/${id}`, payload);
      return data;
    },
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: queryKeys.contacts.all });
      qc.setQueryData(queryKeys.contacts.detail(updated.id), updated);
      toast.success('Contact updated');
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Failed to update contact')),
  });
}

export function useDeleteContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/contacts/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.contacts.all });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      toast.success('Contact deleted');
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Failed to delete contact')),
  });
}

export function useImportContacts() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (rows: ParsedContactRow[]) => {
      const { data } = await api.post<{ created: number; updated: number; total: number }>(
        '/contacts/import',
        { rows },
      );
      return data;
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: queryKeys.contacts.all });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      toast.success(`Imported ${res.created} new and updated ${res.updated} contacts`);
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Import failed')),
  });
}

export async function downloadContactsCsv(filters: ContactFilters = {}) {
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== undefined && v !== ''),
  );
  const { data } = await api.get<Blob>('/contacts/export', {
    params,
    responseType: 'blob',
  });
  const url = URL.createObjectURL(data);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'contacts.csv';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
