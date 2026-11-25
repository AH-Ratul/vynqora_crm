'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { api, getApiErrorMessage } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import { useAuthStore } from '@/stores/auth-store';
import type { User } from '@/types';

export function useMe(enabled = true) {
  const setUser = useAuthStore((s) => s.setUser);
  const accessToken = useAuthStore((s) => s.accessToken);

  return useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: async () => {
      const { data } = await api.get<User>('/auth/me');
      setUser(data);
      return data;
    },
    enabled: enabled && Boolean(accessToken),
    staleTime: 60_000,
  });
}

export function useLogin() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { email: string; password: string }) => {
      const { data } = await api.post<{
        accessToken: string;
        refreshToken: string;
        user: User;
      }>('/auth/login', payload);
      return data;
    },
    onSuccess: (data) => {
      setSession(data);
      queryClient.setQueryData(queryKeys.auth.me, data.user);
      toast.success(`Welcome back, ${data.user.firstName}`);
      router.replace('/');
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, 'Invalid email or password'));
    },
  });
}

export function useRegister() {
  const router = useRouter();

  return useMutation({
    mutationFn: async (payload: {
      firstName: string;
      lastName: string;
      email: string;
      password: string;
    }) => {
      const { data } = await api.post<User>('/auth/register', payload);
      return data;
    },
    onSuccess: () => {
      toast.success('Account created. Please sign in.');
      router.push('/login');
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, 'Could not create account'));
    },
  });
}

export function useLogout() {
  const router = useRouter();
  const clearSession = useAuthStore((s) => s.clearSession);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      try {
        await api.post('/auth/logout');
      } catch {
        // Always clear local session even if server call fails
      }
    },
    onSettled: () => {
      clearSession();
      queryClient.clear();
      router.replace('/login');
    },
  });
}
