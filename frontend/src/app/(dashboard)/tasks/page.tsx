'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CheckSquare, MoreHorizontal, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { PaginationBar } from '@/components/shared/pagination-bar';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { TableSkeleton } from '@/components/shared/table-skeleton';
import { TaskStatusBadge } from '@/components/shared/status-badge';
import { TaskDialog } from '@/components/tasks/task-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useDeleteTask, useTasks, useUpdateTask } from '@/hooks/use-tasks';
import { useUserOptions } from '@/hooks/use-users';
import { useDebounce } from '@/hooks/use-debounce';
import { cn, formatDate } from '@/lib/utils';
import { TASK_STATUSES, TASK_STATUS_LABELS, type Task, type TaskStatus } from '@/types';

export default function TasksPage() {
  const [now] = useState(() => Date.now());
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('ALL');
  const [assignedToId, setAssignedToId] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [deleting, setDeleting] = useState<Task | null>(null);

  const debouncedSearch = useDebounce(search, 300);
  const users = useUserOptions();

  const userItems: Record<string, string> = {
    __all__: 'All assignees',
    ...Object.fromEntries((users.data ?? []).map((u) => [u.id, `${u.firstName} ${u.lastName}`])),
  };
  const tasks = useTasks({
    page,
    limit: 15,
    search: debouncedSearch || undefined,
    status: status === 'ALL' ? undefined : (status as TaskStatus),
    assignedToId: assignedToId || undefined,
  });
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const toggleDone = (task: Task, checked: boolean) => {
    updateTask.mutate({
      id: task.id,
      payload: { status: checked ? 'DONE' : 'PENDING' },
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tasks"
        description="Follow-ups, calls, and reminders tied to your contacts and deals."
        actions={
          <Button
            size="sm"
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="size-3.5" />
            New task
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Tabs
          value={status}
          onValueChange={(v) => {
            setStatus(v);
            setPage(1);
          }}
        >
          <TabsList className="bg-muted/70">
            <TabsTrigger value="ALL" className="text-xs">
              All
            </TabsTrigger>
            {TASK_STATUSES.map((s) => (
              <TabsTrigger key={s} value={s} className="text-xs">
                {TASK_STATUS_LABELS[s]}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-52">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              className="pl-8 bg-card"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <Select
            items={userItems}
            value={assignedToId || '__all__'}
            onValueChange={(v) => {
              setAssignedToId(v === '__all__' ? '' : (v ?? ''));
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-44 bg-card">
              <SelectValue placeholder="All assignees" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All assignees</SelectItem>
              {(users.data ?? []).map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.firstName} {u.lastName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {tasks.isLoading ? (
        <TableSkeleton cols={6} />
      ) : !tasks.data || tasks.data.data.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="No tasks found"
          description="Create a task to keep track of your next customer follow-up."
          action={
            <Button
              size="sm"
              onClick={() => {
                setEditing(null);
                setDialogOpen(true);
              }}
            >
              <Plus className="size-3.5" />
              New task
            </Button>
          }
        />
      ) : (
        <>
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="w-10" />
                  <TableHead>Task</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Related</TableHead>
                  <TableHead>Assignee</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.data.data.map((t) => {
                  const isDone = t.status === 'DONE';
                  const isOverdue =
                    !isDone && t.dueDate && new Date(t.dueDate).getTime() < now;
                  return (
                    <TableRow key={t.id}>
                      <TableCell>
                        <Checkbox
                          checked={isDone}
                          onCheckedChange={(checked) => toggleDone(t, Boolean(checked))}
                          aria-label={`Mark ${t.title} as done`}
                        />
                      </TableCell>
                      <TableCell>
                        <p
                          className={cn(
                            'text-sm font-medium text-foreground',
                            isDone && 'line-through text-muted-foreground',
                          )}
                        >
                          {t.title}
                        </p>
                        {t.description && (
                          <p className="text-[11px] text-muted-foreground line-clamp-1">
                            {t.description}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <TaskStatusBadge status={t.status} />
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {t.contact ? (
                          <Link
                            href={`/contacts/${t.contact.id}`}
                            className="text-foreground hover:underline underline-offset-2"
                          >
                            {t.contact.firstName} {t.contact.lastName}
                          </Link>
                        ) : t.deal ? (
                          <span>{t.deal.title}</span>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {t.assignedTo
                          ? `${t.assignedTo.firstName} ${t.assignedTo.lastName}`
                          : 'Unassigned'}
                      </TableCell>
                      <TableCell
                        className={cn(
                          'text-xs tabular-nums',
                          isOverdue ? 'text-destructive font-medium' : 'text-muted-foreground',
                        )}
                      >
                        {formatDate(t.dueDate)}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button variant="ghost" size="icon-sm">
                                <MoreHorizontal className="size-4" />
                              </Button>
                            }
                          />
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setEditing(t);
                                setDialogOpen(true);
                              }}
                            >
                              <Pencil className="size-3.5" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setDeleting(t)}
                            >
                              <Trash2 className="size-3.5" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <PaginationBar
            page={tasks.data.page}
            limit={tasks.data.limit}
            total={tasks.data.total}
            isFetching={tasks.isFetching}
            onPageChange={setPage}
          />
        </>
      )}

      <TaskDialog open={dialogOpen} onOpenChange={setDialogOpen} task={editing} />
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete task"
        description={`Delete "${deleting?.title}"?`}
        isLoading={deleteTask.isPending}
        onConfirm={async () => {
          if (!deleting) return;
          await deleteTask.mutateAsync(deleting.id);
          setDeleting(null);
        }}
      />
    </div>
  );
}
