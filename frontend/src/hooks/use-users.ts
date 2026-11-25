'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, getApiErrorMessage } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import type { PaginatedResponse, Role, User, UserOption } from '@/types';

export interface UserFilters {
  page?: number;
  limit?: number;
  search?: string;
}

export function useUsers(filters: UserFilters = {}) {
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== undefined && v !== ''),
  );
  return useQuery({
    queryKey: queryKeys.users.list(params),
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<User>>('/users', { params });
      return data;
    },
    placeholderData: keepPreviousData,
  });
}

export function useUserOptions() {
  return useQuery({
    queryKey: queryKeys.users.options,
    queryFn: async () => {
      const { data } = await api.get<UserOption[]>('/users/options');
      return data;
    },
    staleTime: 5 * 60_000,
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      firstName: string;
      lastName: string;
      email: string;
      password: string;
      role: Role;
    }) => {
      const { data } = await api.post<User>('/users', payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.users.all });
      toast.success('User created');
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Failed to create user')),
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: { firstName?: string; lastName?: string; role?: Role; isActive?: boolean };
    }) => {
      const { data } = await api.patch<User>(`/users/${id}`, payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.users.all });
      toast.success('User updated');
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Failed to update user')),
  });
}

export function useDeactivateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete<User>(`/users/${id}`);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.users.all });
      toast.success('User deactivated');
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Failed to deactivate user')),
  });
}
