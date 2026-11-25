'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  ActivityTypeBadge,
  DealStageBadge,
  TaskStatusBadge,
} from '@/components/shared/status-badge';
import { useDeal } from '@/hooks/use-deals';
import { useCreateActivity } from '@/hooks/use-activities';
import { formatCurrency, formatDate, formatRelativeDate } from '@/lib/utils';
import type { Deal } from '@/types';

interface DealDetailSheetProps {
  dealId: string | null;
  onClose: () => void;
  onEdit: (deal: Deal) => void;
  onDelete: (deal: Deal) => void;
}

export function DealDetailSheet({ dealId, onClose, onEdit, onDelete }: DealDetailSheetProps) {
  const [noteSubject, setNoteSubject] = useState('');
  const deal = useDeal(dealId);
  const createActivity = useCreateActivity();

  const handleQuickNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dealId || !noteSubject.trim()) return;
    await createActivity.mutateAsync({
      type: 'NOTE',
      subject: noteSubject.trim(),
      dealId,
      contactId: deal.data?.contactId,
    });
    setNoteSubject('');
  };

  return (
    <Sheet open={Boolean(dealId)} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        {deal.isLoading || !deal.data ? (
          <div className="space-y-4 pt-6">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : (
          <div className="space-y-6 px-3">
            <SheetHeader className="space-y-2 text-left">
              <div className="flex items-center gap-2">
                <DealStageBadge stage={deal.data.stage} />
                {deal.data.probability != null && (
                  <span className="text-[11px] text-muted-foreground">
                    {deal.data.probability}% probability
                  </span>
                )}
              </div>
              <SheetTitle className="text-base">{deal.data.title}</SheetTitle>
              <SheetDescription className="text-lg font-semibold text-foreground tabular-nums">
                {formatCurrency(deal.data.value)}
              </SheetDescription>
            </SheetHeader>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => onEdit(deal.data!)}>
                <Pencil className="size-3.5" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => onDelete(deal.data!)}
              >
                <Trash2 className="size-3.5" />
                Delete
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3 rounded-xl border border-border bg-muted/30 p-3.5 text-xs">
              <div>
                <p className="text-muted-foreground">Contact</p>
                {deal.data.contact ? (
                  <Link
                    href={`/contacts/${deal.data.contact.id}`}
                    className="font-medium text-foreground underline underline-offset-2"
                  >
                    {deal.data.contact.firstName} {deal.data.contact.lastName}
                  </Link>
                ) : (
                  <p>—</p>
                )}
              </div>
              <div>
                <p className="text-muted-foreground">Company</p>
                {deal.data.company ? (
                  <Link
                    href={`/companies/${deal.data.company.id}`}
                    className="font-medium text-foreground underline underline-offset-2"
                  >
                    {deal.data.company.name}
                  </Link>
                ) : (
                  <p>—</p>
                )}
              </div>
              <div>
                <p className="text-muted-foreground">Owner</p>
                <p className="font-medium">
                  {deal.data.assignedTo
                    ? `${deal.data.assignedTo.firstName} ${deal.data.assignedTo.lastName}`
                    : 'Unassigned'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Expected Close</p>
                <p className="font-medium">{formatDate(deal.data.expectedCloseDate)}</p>
              </div>
            </div>

            {deal.data.notes && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Notes</p>
                <p className="text-xs text-foreground whitespace-pre-wrap">{deal.data.notes}</p>
              </div>
            )}

            <Separator />

            {/* Quick Note */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-foreground">Activities</p>
              <form onSubmit={handleQuickNote} className="flex gap-2">
                <Input
                  placeholder="Add a quick note..."
                  value={noteSubject}
                  onChange={(e) => setNoteSubject(e.target.value)}
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={!noteSubject.trim() || createActivity.isPending}
                >
                  {createActivity.isPending ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Plus className="size-3.5" />
                  )}
                </Button>
              </form>

              <div className="space-y-2.5">
                {!deal.data.activities || deal.data.activities.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No activities on this deal.</p>
                ) : (
                  deal.data.activities.map((a) => (
                    <div
                      key={a.id}
                      className="rounded-lg border border-border/70 p-2.5 space-y-1 text-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <ActivityTypeBadge type={a.type} />
                        <span className="text-[10px] text-muted-foreground">
                          {formatRelativeDate(a.occurredAt)}
                        </span>
                      </div>
                      <p className="font-medium text-foreground">{a.subject}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <Separator />

            {/* Tasks */}
            <div className="space-y-2.5">
              <p className="text-xs font-semibold text-foreground">
                Tasks ({deal.data.tasks?.length ?? 0})
              </p>
              {!deal.data.tasks || deal.data.tasks.length === 0 ? (
                <p className="text-xs text-muted-foreground">No tasks linked to this deal.</p>
              ) : (
                deal.data.tasks.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-border/70 p-2.5 text-xs"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{t.title}</p>
                      <p className="text-[10px] text-muted-foreground">
                        Due {formatDate(t.dueDate)}
                      </p>
                    </div>
                    <TaskStatusBadge status={t.status} />
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
