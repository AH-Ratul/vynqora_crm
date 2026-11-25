'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
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
import { useCreateCompany, useUpdateCompany } from '@/hooks/use-companies';
import type { Company } from '@/types';

const companySchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  industry: z.string().optional(),
  size: z.string().optional(),
  website: z.string().optional(),
  phone: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
});

type CompanyForm = z.infer<typeof companySchema>;

interface CompanyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company?: Company | null;
}

export function CompanyDialog({ open, onOpenChange, company }: CompanyDialogProps) {
  const isEditing = Boolean(company);
  const createCompany = useCreateCompany();
  const updateCompany = useUpdateCompany();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CompanyForm>({ resolver: zodResolver(companySchema) });

  useEffect(() => {
    if (open) {
      reset({
        name: company?.name ?? '',
        industry: company?.industry ?? '',
        size: company?.size ?? '',
        website: company?.website ?? '',
        phone: company?.phone ?? '',
        city: company?.city ?? '',
        country: company?.country ?? '',
        address: company?.address ?? '',
        notes: company?.notes ?? '',
      });
    }
  }, [open, company, reset]);

  const onSubmit = async (values: CompanyForm) => {
    const payload = Object.fromEntries(
      Object.entries(values).map(([k, v]) => [k, v?.trim() || undefined]),
    ) as CompanyForm;

    if (company) {
      await updateCompany.mutateAsync({ id: company.id, payload });
    } else {
      await createCompany.mutateAsync(payload);
    }
    onOpenChange(false);
  };

  const isPending = createCompany.isPending || updateCompany.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit company' : 'New company'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update company account details.' : 'Add an organization account.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="co-name">Company name *</Label>
            <Input id="co-name" placeholder="Acme Studio" {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="co-ind">Industry</Label>
              <Input id="co-ind" placeholder="Software" {...register('industry')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="co-size">Company size</Label>
              <Input id="co-size" placeholder="50-200" {...register('size')} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="co-web">Website</Label>
              <Input id="co-web" placeholder="https://acme.com" {...register('website')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="co-phone">Phone</Label>
              <Input id="co-phone" {...register('phone')} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="co-city">City</Label>
              <Input id="co-city" {...register('city')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="co-country">Country</Label>
              <Input id="co-country" {...register('country')} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="co-notes">Notes</Label>
            <Textarea id="co-notes" rows={2} {...register('notes')} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="size-3.5 animate-spin" />}
              {isEditing ? 'Save changes' : 'Create company'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
