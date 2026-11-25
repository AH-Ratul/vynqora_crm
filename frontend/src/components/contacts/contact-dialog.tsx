'use client';

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
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
import { useCreateContact, useUpdateContact } from '@/hooks/use-contacts';
import { useCompanies } from '@/hooks/use-companies';
import type { Contact } from '@/types';

const contactSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Enter a valid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  title: z.string().optional(),
  companyId: z.string().optional(),
  tags: z.string().optional(),
  notes: z.string().optional(),
});

type ContactForm = z.infer<typeof contactSchema>;

interface ContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact?: Contact | null;
}

export function ContactDialog({ open, onOpenChange, contact }: ContactDialogProps) {
  const isEditing = Boolean(contact);
  const createContact = useCreateContact();
  const updateContact = useUpdateContact();
  const companies = useCompanies({ limit: 100 });

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactForm>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      title: '',
      companyId: '',
      tags: '',
      notes: '',
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        firstName: contact?.firstName ?? '',
        lastName: contact?.lastName ?? '',
        email: contact?.email ?? '',
        phone: contact?.phone ?? '',
        title: contact?.title ?? '',
        companyId: contact?.companyId ?? '',
        tags: contact?.tags?.join(', ') ?? '',
        notes: contact?.notes ?? '',
      });
    }
  }, [open, contact, reset]);

  const onSubmit = async (values: ContactForm) => {
    const payload = {
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      email: values.email?.trim() || undefined,
      phone: values.phone?.trim() || undefined,
      title: values.title?.trim() || undefined,
      companyId: values.companyId && values.companyId !== '__none__' ? values.companyId : undefined,
      tags: values.tags
        ? values.tags
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean)
        : [],
      notes: values.notes?.trim() || undefined,
    };

    if (contact) {
      await updateContact.mutateAsync({ id: contact.id, payload });
    } else {
      await createContact.mutateAsync(payload);
    }
    onOpenChange(false);
  };

  const isPending = createContact.isPending || updateContact.isPending;

  const companyItems: Record<string, string> = {
    __none__: 'No company',
    ...Object.fromEntries((companies.data?.data ?? []).map((comp) => [comp.id, comp.name])),
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit contact' : 'New contact'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update this contact’s profile information.'
              : 'Add a person to your CRM directory.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="c-first">First name *</Label>
              <Input id="c-first" {...register('firstName')} />
              {errors.firstName && (
                <p className="text-xs text-destructive">{errors.firstName.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-last">Last name *</Label>
              <Input id="c-last" {...register('lastName')} />
              {errors.lastName && (
                <p className="text-xs text-destructive">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="c-email">Email</Label>
              <Input id="c-email" type="email" {...register('email')} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-phone">Phone</Label>
              <Input id="c-phone" {...register('phone')} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="c-title">Job title</Label>
              <Input id="c-title" placeholder="Head of Operations" {...register('title')} />
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
                    onValueChange={(val) => field.onChange(val === '__none__' ? '' : (val ?? ''))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="No company" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">No company</SelectItem>
                      {(companies.data?.data ?? []).map((comp) => (
                        <SelectItem key={comp.id} value={comp.id}>
                          {comp.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="c-tags">Tags (comma-separated)</Label>
            <Input id="c-tags" placeholder="vip, enterprise, inbound" {...register('tags')} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="c-notes">Notes</Label>
            <Textarea id="c-notes" rows={3} {...register('notes')} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="size-3.5 animate-spin" />}
              {isEditing ? 'Save changes' : 'Create contact'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
