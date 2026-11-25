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
import { useCreateTask, useUpdateTask } from '@/hooks/use-tasks';
import { useContacts } from '@/hooks/use-contacts';
import { useDeals } from '@/hooks/use-deals';
import { useUserOptions } from '@/hooks/use-users';
import { TASK_STATUSES, TASK_STATUS_LABELS, type Task, type TaskStatus } from '@/types';

const taskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'DONE', 'CANCELLED']),
  dueDate: z.string().optional(),
  contactId: z.string().optional(),
  dealId: z.string().optional(),
  assignedToId: z.string().optional(),
});

type TaskForm = z.infer<typeof taskSchema>;

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task | null;
}

export function TaskDialog({ open, onOpenChange, task }: TaskDialogProps) {
  const isEditing = Boolean(task);
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const contacts = useContacts({ limit: 100 });
  const deals = useDeals({ limit: 100 });
  const users = useUserOptions();

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TaskForm>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: '',
      description: '',
      status: 'PENDING',
      dueDate: '',
      contactId: '',
      dealId: '',
      assignedToId: '',
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        title: task?.title ?? '',
        description: task?.description ?? '',
        status: task?.status ?? 'PENDING',
        dueDate: task?.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : '',
        contactId: task?.contactId ?? '',
        dealId: task?.dealId ?? '',
        assignedToId: task?.assignedToId ?? '',
      });
    }
  }, [open, task, reset]);

  const onSubmit = async (values: TaskForm) => {
    const payload = {
      title: values.title.trim(),
      description: values.description?.trim() || undefined,
      status: values.status as TaskStatus,
      dueDate: values.dueDate ? new Date(values.dueDate).toISOString() : undefined,
      contactId:
        values.contactId && values.contactId !== '__none__' ? values.contactId : undefined,
      dealId: values.dealId && values.dealId !== '__none__' ? values.dealId : undefined,
      assignedToId:
        values.assignedToId && values.assignedToId !== '__none__'
          ? values.assignedToId
          : undefined,
    };

    if (task) {
      await updateTask.mutateAsync({ id: task.id, payload });
    } else {
      await createTask.mutateAsync(payload);
    }
    onOpenChange(false);
  };

  const isPending = createTask.isPending || updateTask.isPending;

  const userItems: Record<string, string> = {
    __none__: 'Unassigned',
    ...Object.fromEntries((users.data ?? []).map((u) => [u.id, `${u.firstName} ${u.lastName}`])),
  };
  const contactItems: Record<string, string> = {
    __none__: 'None',
    ...Object.fromEntries(
      (contacts.data?.data ?? []).map((c) => [c.id, `${c.firstName} ${c.lastName}`]),
    ),
  };
  const dealItems: Record<string, string> = {
    __none__: 'None',
    ...Object.fromEntries((deals.data?.data ?? []).map((d) => [d.id, d.title])),
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit task' : 'New task'}</DialogTitle>
          <DialogDescription>
            Assigning a task to a teammate automatically sends them a notification.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="t-title">Title *</Label>
            <Input id="t-title" placeholder="Follow up on proposal" {...register('title')} />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select
                    items={TASK_STATUS_LABELS}
                    value={field.value}
                    onValueChange={(v) => v && field.onChange(v)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TASK_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {TASK_STATUS_LABELS[s]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="t-due">Due date</Label>
              <Input id="t-due" type="date" {...register('dueDate')} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Assigned to</Label>
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
            <div className="space-y-1.5">
              <Label>Contact</Label>
              <Controller
                name="contactId"
                control={control}
                render={({ field }) => (
                  <Select
                    items={contactItems}
                    value={field.value || '__none__'}
                    onValueChange={(v) => field.onChange(v === '__none__' ? '' : (v ?? ''))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">None</SelectItem>
                      {(contacts.data?.data ?? []).map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.firstName} {c.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Deal</Label>
            <Controller
              name="dealId"
              control={control}
              render={({ field }) => (
                <Select
                  items={dealItems}
                  value={field.value || '__none__'}
                  onValueChange={(v) => field.onChange(v === '__none__' ? '' : (v ?? ''))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">None</SelectItem>
                    {(deals.data?.data ?? []).map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="t-desc">Description</Label>
            <Textarea id="t-desc" rows={2} {...register('description')} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="size-3.5 animate-spin" />}
              {isEditing ? 'Save changes' : 'Create task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
