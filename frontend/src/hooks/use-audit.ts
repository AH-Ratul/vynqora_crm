'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import type { AuditLog, PaginatedResponse } from '@/types';

export interface AuditFilters {
  page?: number;
  limit?: number;
  entity?: string;
  userId?: string;
}

export function useAuditLogs(filters: AuditFilters = {}) {
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== undefined && v !== ''),
  );
  return useQuery({
    queryKey: queryKeys.audit.list(params),
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<AuditLog>>('/audit', { params });
      return data;
    },
    placeholderData: keepPreviousData,
  });
}
