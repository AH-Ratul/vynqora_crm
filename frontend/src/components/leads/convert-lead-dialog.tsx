'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowRightCircle, Loader2 } from 'lucide-react';
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
import { useConvertLead } from '@/hooks/use-leads';
import type { Lead } from '@/types';

const convertSchema = z.object({
  title: z.string().min(1, 'Deal title is required'),
  value: z.string().optional(),
  expectedCloseDate: z.string().optional(),
});

type ConvertForm = z.infer<typeof convertSchema>;

interface ConvertLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead | null;
}

export function ConvertLeadDialog({ open, onOpenChange, lead }: ConvertLeadDialogProps) {
  const convertLead = useConvertLead();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ConvertForm>({ resolver: zodResolver(convertSchema) });

  useEffect(() => {
    if (open && lead) {
      const name = lead.contact.company?.name || `${lead.contact.firstName} ${lead.contact.lastName}`;
      reset({
        title: `${name} — New Deal`,
        value: '',
        expectedCloseDate: '',
      });
    }
  }, [open, lead, reset]);

  const onSubmit = async (values: ConvertForm) => {
    if (!lead) return;
    const numVal = values.value ? Number(values.value) : undefined;
    await convertLead.mutateAsync({
      id: lead.id,
      payload: {
        title: values.title.trim(),
        value: numVal !== undefined && !Number.isNaN(numVal) ? numVal : undefined,
        expectedCloseDate: values.expectedCloseDate
          ? new Date(values.expectedCloseDate).toISOString()
          : undefined,
      },
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Convert lead to deal</DialogTitle>
          <DialogDescription>
            Creates a new deal in your pipeline for {lead?.contact.firstName}{' '}
            {lead?.contact.lastName} and marks this lead as Converted.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="cv-title">Deal title *</Label>
            <Input id="cv-title" {...register('title')} />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="cv-value">Value (USD)</Label>
              <Input id="cv-value" type="number" min={0} placeholder="12000" {...register('value')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cv-date">Expected close</Label>
              <Input id="cv-date" type="date" {...register('expectedCloseDate')} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={convertLead.isPending}>
              {convertLead.isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <ArrowRightCircle className="size-3.5" />
              )}
              Convert to deal
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
