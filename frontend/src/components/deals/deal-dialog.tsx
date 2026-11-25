'use client';

import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateDeal, useUpdateDeal } from '@/hooks/use-deals';
import { useContacts } from '@/hooks/use-contacts';
import { useCompanies } from '@/hooks/use-companies';
import { useUserOptions } from '@/hooks/use-users';
import { DEAL_STAGES, DEAL_STAGE_LABELS, type Deal, type DealStage } from '@/types';

const dealSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  value: z.string().optional(),
  stage: z.enum(['LEAD', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST']),
  probability: z.string().optional(),
  expectedCloseDate: z.string().optional(),
  contactId: z.string().min(1, 'Contact is required'),
  companyId: z.string().optional(),
  assignedToId: z.string().optional(),
  notes: z.string().optional(),
});

type DealForm = z.infer<typeof dealSchema>;

interface DealDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deal?: Deal | null;
}

export function DealDialog({ open, onOpenChange, deal }: DealDialogProps) {
  const isEditing = Boolean(deal);
  const createDeal = useCreateDeal();
  const updateDeal = useUpdateDeal();
  const contacts = useContacts({ limit: 100 });
  const companies = useCompanies({ limit: 100 });
  const users = useUserOptions();

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DealForm>({
    resolver: zodResolver(dealSchema),
    defaultValues: {
      title: '',
      value: '',
      stage: 'LEAD',
      probability: '',
      expectedCloseDate: '',
      contactId: '',
      companyId: '',
      assignedToId: '',
      notes: '',
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        title: deal?.title ?? '',
        value: deal?.value != null ? String(deal.value) : '',
        stage: deal?.stage ?? 'LEAD',
        probability: deal?.probability != null ? String(deal.probability) : '',
        expectedCloseDate: deal?.expectedCloseDate
          ? new Date(deal.expectedCloseDate).toISOString().slice(0, 10)
          : '',
        contactId: deal?.contactId ?? '',
        companyId: deal?.companyId ?? '',
        assignedToId: deal?.assignedToId ?? '',
        notes: deal?.notes ?? '',
      });
    }
  }, [open, deal, reset]);

  const onSubmit = async (values: DealForm) => {
    const numVal = values.value ? Number(values.value) : undefined;
    const probVal = values.probability ? Number(values.probability) : undefined;
    const payload = {
      title: values.title.trim(),
      value: numVal !== undefined && !Number.isNaN(numVal) ? numVal : undefined,
      stage: values.stage as DealStage,
      probability: probVal !== undefined && !Number.isNaN(probVal) ? probVal : undefined,
      expectedCloseDate: values.expectedCloseDate
        ? new Date(values.expectedCloseDate).toISOString()
        : undefined,
      contactId: values.contactId,
      companyId:
        values.companyId && values.companyId !== '__none__' ? values.companyId : undefined,
      assignedToId:
        values.assignedToId && values.assignedToId !== '__none__'
          ? values.assignedToId
          : undefined,
      notes: values.notes?.trim() || undefined,
    };

    if (deal) {
      await updateDeal.mutateAsync({ id: deal.id, payload });
    } else {
      await createDeal.mutateAsync(payload);
    }
    onOpenChange(false);
  };

  const isPending = createDeal.isPending || updateDeal.isPending;

  const contactItems: Record<string, string> = Object.fromEntries(
    (contacts.data?.data ?? []).map((c) => [c.id, `${c.firstName} ${c.lastName}`]),
  );
  const companyItems: Record<string, string> = {
    __none__: 'No company',
    ...Object.fromEntries((companies.data?.data ?? []).map((c) => [c.id, c.name])),
  };
  const userItems: Record<string, string> = {
    __none__: 'Unassigned',
    ...Object.fromEntries((users.data ?? []).map((u) => [u.id, `${u.firstName} ${u.lastName}`])),
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit deal' : 'New deal'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update deal details and stage.' : 'Add an opportunity to your pipeline.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="d-title">Deal title *</Label>
            <Input id="d-title" placeholder="Annual Enterprise Plan" {...register('title')} />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="d-val">Value (USD)</Label>
              <Input id="d-val" type="number" min={0} placeholder="15000" {...register('value')} />
            </div>
            <div className="space-y-1.5">
              <Label>Stage</Label>
              <Controller
                name="stage"
                control={control}
                render={({ field }) => (
                  <Select
                    items={DEAL_STAGE_LABELS}
                    value={field.value}
                    onValueChange={(v) => v && field.onChange(v)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DEAL_STAGES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {DEAL_STAGE_LABELS[s]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="d-prob">Prob. (%)</Label>
              <Input id="d-prob" type="number" min={0} max={100} placeholder="50" {...register('probability')} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Contact *</Label>
              <Controller
                name="contactId"
                control={control}
                render={({ field }) => (
                  <Select
                    items={contactItems}
                    value={field.value || null}
                    onValueChange={(v) => field.onChange(v ?? '')}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select contact" />
                    </SelectTrigger>
                    <SelectContent>
                      {(contacts.data?.data ?? []).map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.firstName} {c.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.contactId && (
                <p className="text-xs text-destructive">{errors.contactId.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Company</Label>
              <Controller
                name="companyId"
                control={control}
                render={({ field }) => (
                  <Select
                    items={companyItems}
                    value={field.value || '__none__'}
                    onValueChange={(v) => field.onChange(v === '__none__' ? '' : (v ?? ''))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="No company" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">No company</SelectItem>
                      {(companies.data?.data ?? []).map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="d-date">Expected close</Label>
              <Input id="d-date" type="date" {...register('expectedCloseDate')} />
            </div>
            <div className="space-y-1.5">
              <Label>Owner</Label>
              <Controller
                name="assignedToId"
                control={control}
                render={({ field }) => (
                  <Select
                    items={userItems}
                    value={field.value || '__none__'}
                    onValueChange={(v) => field.onChange(v === '__none__' ? '' : (v ?? ''))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Unassigned" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Unassigned</SelectItem>
                      {(users.data ?? []).map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.firstName} {u.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="d-notes">Notes</Label>
            <Textarea id="d-notes" rows={2} {...register('notes')} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="size-3.5 animate-spin" />}
              {isEditing ? 'Save changes' : 'Create deal'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
