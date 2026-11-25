'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, getApiErrorMessage } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import type { Deal, DealStage, PaginatedResponse, PipelineBoard } from '@/types';

export interface DealFilters {
  page?: number;
  limit?: number;
  search?: string;
  stage?: DealStage;
  assignedToId?: string;
  contactId?: string;
  companyId?: string;
}

export interface DealPayload {
  title: string;
  value?: number;
  stage?: DealStage;
  probability?: number;
  expectedCloseDate?: string;
  notes?: string;
  contactId: string;
  companyId?: string;
  assignedToId?: string;
}

export function useDeals(filters: DealFilters = {}) {
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== undefined && v !== ''),
  );
  return useQuery({
    queryKey: queryKeys.deals.list(params),
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Deal>>('/deals', { params });
      return data;
    },
    placeholderData: keepPreviousData,
  });
}

export function useDealsPipeline(assignedToId?: string) {
  return useQuery({
    queryKey: queryKeys.deals.pipeline(assignedToId),
    queryFn: async () => {
      const { data } = await api.get<PipelineBoard>('/deals/pipeline', {
        params: assignedToId ? { assignedToId } : undefined,
      });
      return data;
    },
  });
}

export function useDeal(id: string | null) {
  return useQuery({
    queryKey: queryKeys.deals.detail(id ?? ''),
    queryFn: async () => {
      const { data } = await api.get<Deal>(`/deals/${id}`);
      return data;
    },
    enabled: Boolean(id),
  });
}

export function useCreateDeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: DealPayload) => {
      const { data } = await api.post<Deal>('/deals', payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.deals.all });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      toast.success('Deal created');
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Failed to create deal')),
  });
}

export function useUpdateDeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<DealPayload> }) => {
      const { data } = await api.patch<Deal>(`/deals/${id}`, payload);
      return data;
    },
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: queryKeys.deals.all });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      qc.setQueryData(queryKeys.deals.detail(updated.id), (prev: Deal | undefined) =>
        prev ? { ...prev, ...updated } : updated,
      );
      toast.success('Deal updated');
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Failed to update deal')),
  });
}

/** Optimistically moves a deal between Kanban stages, rolling back if the API call fails. */
export function useMoveDealStage(assignedToId?: string) {
  const qc = useQueryClient();
  const pipelineKey = queryKeys.deals.pipeline(assignedToId);

  return useMutation({
    mutationFn: async ({ id, stage }: { id: string; stage: DealStage }) => {
      const { data } = await api.patch<Deal>(`/deals/${id}`, { stage });
      return data;
    },
    onMutate: async ({ id, stage }) => {
      await qc.cancelQueries({ queryKey: pipelineKey });
      const previous = qc.getQueryData<PipelineBoard>(pipelineKey);

      if (previous) {
        const next: PipelineBoard = {
          LEAD: [...previous.LEAD],
          PROPOSAL: [...previous.PROPOSAL],
          NEGOTIATION: [...previous.NEGOTIATION],
          CLOSED_WON: [...previous.CLOSED_WON],
          CLOSED_LOST: [...previous.CLOSED_LOST],
        };

        let moved: Deal | undefined;
        for (const s of Object.keys(next) as DealStage[]) {
          const idx = next[s].findIndex((d) => d.id === id);
          if (idx !== -1) {
            [moved] = next[s].splice(idx, 1);
            break;
          }
        }
        if (moved) {
          next[stage].unshift({ ...moved, stage });
          qc.setQueryData(pipelineKey, next);
        }
      }

      return { previous };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.previous) {
        qc.setQueryData(pipelineKey, ctx.previous);
      }
      toast.error(getApiErrorMessage(err, 'Could not move deal'));
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: queryKeys.deals.all });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    },
  });
}

export function useDeleteDeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/deals/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.deals.all });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      toast.success('Deal deleted');
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Failed to delete deal')),
  });
}
