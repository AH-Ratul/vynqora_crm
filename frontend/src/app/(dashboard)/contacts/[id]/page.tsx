'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Building2, Loader2, Mail, Pencil, Phone, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ActivityTypeBadge,
  DealStageBadge,
  LeadStatusBadge,
  TaskStatusBadge,
} from '@/components/shared/status-badge';
import { ContactDialog } from '@/components/contacts/contact-dialog';
import { useContact } from '@/hooks/use-contacts';
import { useActivities, useCreateActivity, useDeleteActivity } from '@/hooks/use-activities';
import { formatCurrency, formatDate, formatRelativeDate, getInitials } from '@/lib/utils';
import { ACTIVITY_TYPES, type ActivityType } from '@/types';

export default function ContactDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [editOpen, setEditOpen] = useState(false);
  const [actType, setActType] = useState<ActivityType>('NOTE');
  const [actSubject, setActSubject] = useState('');
  const [actBody, setActBody] = useState('');

  const contact = useContact(id);
  const activities = useActivities({ contactId: id, limit: 30 });
  const createActivity = useCreateActivity();
  const deleteActivity = useDeleteActivity();

  const handleLogActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actSubject.trim()) return;
    await createActivity.mutateAsync({
      type: actType,
      subject: actSubject.trim(),
      body: actBody.trim() || undefined,
      contactId: id,
    });
    setActSubject('');
    setActBody('');
  };

  if (contact.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl lg:col-span-2" />
        </div>
      </div>
    );
  }

  if (!contact.data) {
    return (
      <div className="py-20 text-center">
        <p className="text-sm text-muted-foreground">Contact not found.</p>
        <Link href="/contacts" className="mt-3 inline-block text-xs underline">
          Back to contacts
        </Link>
      </div>
    );
  }

  const c = contact.data;

  return (
    <div className="space-y-6">
      <Link
        href="/contacts"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-3.5" />
        Back to contacts
      </Link>

      {/* Profile Header */}
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-full bg-stone-900 text-sm font-semibold text-stone-50">
            {getInitials(c.firstName, c.lastName)}
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-foreground">
              {c.firstName} {c.lastName}
            </h1>
            <p className="text-xs text-muted-foreground">
              {[c.title, c.company?.name].filter(Boolean).join(' · ') || 'No title or company'}
            </p>
            {c.tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {c.tags.map((t) => (
                  <Badge key={t} variant="secondary" className="text-[10px] font-normal">
                    {t}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
          <Pencil className="size-3.5" />
          Edit profile
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column: Details + Linked records */}
        <div className="space-y-6">
          <Card className="shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex items-center gap-2.5">
                <Mail className="size-3.5 text-muted-foreground shrink-0" />
                <span className="truncate">{c.email || '—'}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="size-3.5 text-muted-foreground shrink-0" />
                <span>{c.phone || '—'}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Building2 className="size-3.5 text-muted-foreground shrink-0" />
                {c.company ? (
                  <Link href={`/companies/${c.company.id}`} className="underline underline-offset-2">
                    {c.company.name}
                  </Link>
                ) : (
                  <span>—</span>
                )}
              </div>
              {c.notes && (
                <div className="pt-2 border-t border-border/70">
                  <p className="text-[11px] font-medium text-muted-foreground mb-1">Notes</p>
                  <p className="text-xs text-foreground whitespace-pre-wrap">{c.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Deals */}
          <Card className="shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Deals ({c.deals?.length ?? 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {!c.deals || c.deals.length === 0 ? (
                <p className="text-xs text-muted-foreground">No linked deals.</p>
              ) : (
                c.deals.map((d) => (
                  <div
                    key={d.id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-border/70 p-2.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium">{d.title}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {formatCurrency(d.value)}
                      </p>
                    </div>
                    <DealStageBadge stage={d.stage} />
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Leads & Tasks */}
          <Card className="shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Open Tasks ({c.tasks?.length ?? 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {!c.tasks || c.tasks.length === 0 ? (
                <p className="text-xs text-muted-foreground">No open tasks.</p>
              ) : (
                c.tasks.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-border/70 p-2.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium">{t.title}</p>
                      <p className="text-[11px] text-muted-foreground">
                        Due {formatDate(t.dueDate)}
                      </p>
                    </div>
                    <TaskStatusBadge status={t.status} />
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {c.leads && c.leads.length > 0 && (
            <Card className="shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Leads ({c.leads.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {c.leads.map((l) => (
                  <div key={l.id} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{l.source || 'Direct'}</span>
                    <LeadStatusBadge status={l.status} />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column: Log Activity + Timeline */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Log Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogActivity} className="space-y-3">
                <div className="flex flex-col gap-2.5 sm:flex-row">
                  <Select
                    items={Object.fromEntries(
                      ACTIVITY_TYPES.map((t) => [t, t.charAt(0) + t.slice(1).toLowerCase()]),
                    )}
                    value={actType}
                    onValueChange={(v) => v && setActType(v as ActivityType)}
                  >
                    <SelectTrigger className="w-full sm:w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ACTIVITY_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t.charAt(0) + t.slice(1).toLowerCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Subject (e.g. Discovery call, Sent pricing...)"
                    value={actSubject}
                    onChange={(e) => setActSubject(e.target.value)}
                    className="flex-1"
                  />
                </div>
                <Textarea
                  rows={2}
                  placeholder="Optional details or meeting notes..."
                  value={actBody}
                  onChange={(e) => setActBody(e.target.value)}
                />
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!actSubject.trim() || createActivity.isPending}
                  >
                    {createActivity.isPending ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Plus className="size-3.5" />
                    )}
                    Log activity
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Activity Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              {activities.isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-14 w-full rounded-lg" />
                  ))}
                </div>
              ) : !activities.data || activities.data.data.length === 0 ? (
                <p className="py-8 text-center text-xs text-muted-foreground">
                  No interactions logged yet.
                </p>
              ) : (
                <div className="divide-y divide-border/70">
                  {activities.data.data.map((act) => (
                    <div key={act.id} className="flex items-start justify-between gap-3 py-3.5">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <ActivityTypeBadge type={act.type} />
                          <span className="text-xs font-medium text-foreground">{act.subject}</span>
                        </div>
                        {act.body && (
                          <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                            {act.body}
                          </p>
                        )}
                        <p className="text-[11px] text-muted-foreground">
                          {act.createdBy
                            ? `${act.createdBy.firstName} ${act.createdBy.lastName}`
                            : 'Team'}{' '}
                          · {formatRelativeDate(act.occurredAt)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => deleteActivity.mutate(act.id)}
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <ContactDialog open={editOpen} onOpenChange={setEditOpen} contact={c} />
    </div>
  );
}
