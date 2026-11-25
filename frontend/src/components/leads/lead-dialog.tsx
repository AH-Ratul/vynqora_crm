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
import { useCreateLead, useUpdateLead } from '@/hooks/use-leads';
import { useContacts } from '@/hooks/use-contacts';
import { useUserOptions } from '@/hooks/use-users';
import { LEAD_STATUSES, LEAD_STATUS_LABELS, type Lead, type LeadStatus } from '@/types';

const leadSchema = z.object({
  contactId: z.string().min(1, 'Contact is required'),
  source: z.string().optional(),
  status: z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'UNQUALIFIED', 'CONVERTED']),
  score: z.string().optional(),
  assignedToId: z.string().optional(),
  notes: z.string().optional(),
});

type LeadForm = z.infer<typeof leadSchema>;

interface LeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead?: Lead | null;
}

export function LeadDialog({ open, onOpenChange, lead }: LeadDialogProps) {
  const isEditing = Boolean(lead);
  const createLead = useCreateLead();
  const updateLead = useUpdateLead();
  const contacts = useContacts({ limit: 100 });
  const users = useUserOptions();

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LeadForm>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      contactId: '',
      source: '',
      status: 'NEW',
      score: '',
      assignedToId: '',
      notes: '',
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        contactId: lead?.contactId ?? '',
        source: lead?.source ?? '',
        status: lead?.status ?? 'NEW',
        score: lead?.score != null ? String(lead.score) : '',
        assignedToId: lead?.assignedToId ?? '',
        notes: lead?.notes ?? '',
      });
    }
  }, [open, lead, reset]);

  const onSubmit = async (values: LeadForm) => {
    const scoreNum = values.score ? Number(values.score) : undefined;
    const payload = {
      contactId: values.contactId,
      source: values.source?.trim() || undefined,
      status: values.status as LeadStatus,
      score: scoreNum !== undefined && !Number.isNaN(scoreNum) ? scoreNum : undefined,
      assignedToId:
        values.assignedToId && values.assignedToId !== '__none__'
          ? values.assignedToId
          : undefined,
      notes: values.notes?.trim() || undefined,
    };

    if (lead) {
      await updateLead.mutateAsync({ id: lead.id, payload });
    } else {
      await createLead.mutateAsync(payload);
    }
    onOpenChange(false);
  };

  const isPending = createLead.isPending || updateLead.isPending;

  const contactItems: Record<string, string> = Object.fromEntries(
    (contacts.data?.data ?? []).map((c) => [
      c.id,
      `${c.firstName} ${c.lastName}${c.email ? ` (${c.email})` : ''}`,
    ]),
  );

  const userItems: Record<string, string> = {
    Unassigned: 'Unassigned',
    ...Object.fromEntries((users.data ?? []).map((u) => [u.id, `${u.firstName} ${u.lastName}`])),
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit lead' : 'New lead'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update lead status and assignment.' : 'Track an incoming prospect.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                  disabled={isEditing}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a contact" />
                  </SelectTrigger>
                  <SelectContent>
                    {(contacts.data?.data ?? []).map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.firstName} {c.lastName} {c.email ? `(${c.email})` : ''}
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

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select
                    items={LEAD_STATUS_LABELS}
                    value={field.value}
                    onValueChange={(v) => v && field.onChange(v)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LEAD_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {LEAD_STATUS_LABELS[s]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="l-score">Score (0–100)</Label>
              <Input id="l-score" type="number" min={0} max={100} {...register('score')} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="l-source">Source</Label>
              <Input id="l-source" placeholder="Website, Referral..." {...register('source')} />
            </div>
            <div className="space-y-1.5">
              <Label>Assigned to</Label>
              <Controller
                name="assignedToId"
                control={control}
                render={({ field }) => (
                  <Select
                    items={userItems}
                    value={field.value || 'Unassigned'}
                    onValueChange={(v) => field.onChange(v === 'Unassigned' ? '' : (v ?? ''))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Unassigned" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Unassigned">Unassigned</SelectItem>
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
            <Label htmlFor="l-notes">Notes</Label>
            <Textarea id="l-notes" rows={2} {...register('notes')} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="size-3.5 animate-spin" />}
              {isEditing ? 'Save changes' : 'Create lead'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
