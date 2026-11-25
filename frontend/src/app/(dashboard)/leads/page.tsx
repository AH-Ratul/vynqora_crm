'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRightCircle,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { PaginationBar } from '@/components/shared/pagination-bar';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { TableSkeleton } from '@/components/shared/table-skeleton';
import { LeadStatusBadge } from '@/components/shared/status-badge';
import { LeadDialog } from '@/components/leads/lead-dialog';
import { ConvertLeadDialog } from '@/components/leads/convert-lead-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { useDeleteLead, useLeads } from '@/hooks/use-leads';
import { useDebounce } from '@/hooks/use-debounce';
import { formatDate } from '@/lib/utils';
import { LEAD_STATUSES, LEAD_STATUS_LABELS, type Lead, type LeadStatus } from '@/types';

export default function LeadsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('ALL');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Lead | null>(null);
  const [converting, setConverting] = useState<Lead | null>(null);
  const [deleting, setDeleting] = useState<Lead | null>(null);

  const debouncedSearch = useDebounce(search, 300);
  const leads = useLeads({
    page,
    limit: 15,
    search: debouncedSearch || undefined,
    status: status === 'ALL' ? undefined : (status as LeadStatus),
  });
  const deleteLead = useDeleteLead();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leads"
        description="Qualify incoming prospects and convert them into pipeline deals."
        actions={
          <Button
            size="sm"
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="size-3.5" />
            New lead
          </Button>
        }
      />

      {/* Filter Bar */}
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
            {LEAD_STATUSES.map((s) => (
              <TabsTrigger key={s} value={s} className="text-xs">
                {LEAD_STATUS_LABELS[s]}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="relative w-full lg:w-64">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by contact..."
            className="pl-8 bg-card"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      {/* Table */}
      {leads.isLoading ? (
        <TableSkeleton cols={6} />
      ) : !leads.data || leads.data.data.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="No leads found"
          description="Create a lead linked to a contact to begin qualifying."
          action={
            <Button
              size="sm"
              onClick={() => {
                setEditing(null);
                setDialogOpen(true);
              }}
            >
              <Plus className="size-3.5" />
              New lead
            </Button>
          }
        />
      ) : (
        <>
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.data.data.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell>
                      <Link
                        href={`/contacts/${lead.contact.id}`}
                        className="text-sm font-medium text-foreground hover:underline underline-offset-2"
                      >
                        {lead.contact.firstName} {lead.contact.lastName}
                      </Link>
                      {lead.contact.email && (
                        <p className="text-[11px] text-muted-foreground">{lead.contact.email}</p>
                      )}
                    </TableCell>
                    <TableCell>
                      <LeadStatusBadge status={lead.status} />
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {lead.source || '—'}
                    </TableCell>
                    <TableCell className="text-xs tabular-nums">
                      {lead.score != null ? `${lead.score}/100` : '—'}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {lead.assignedTo
                        ? `${lead.assignedTo.firstName} ${lead.assignedTo.lastName}`
                        : 'Unassigned'}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(lead.createdAt)}
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
                          {lead.status !== 'CONVERTED' && (
                            <DropdownMenuItem onClick={() => setConverting(lead)}>
                              <ArrowRightCircle className="size-3.5" />
                              Convert to deal
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => {
                              setEditing(lead);
                              setDialogOpen(true);
                            }}
                          >
                            <Pencil className="size-3.5" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setDeleting(lead)}
                          >
                            <Trash2 className="size-3.5" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <PaginationBar
            page={leads.data.page}
            limit={leads.data.limit}
            total={leads.data.total}
            isFetching={leads.isFetching}
            onPageChange={setPage}
          />
        </>
      )}

      <LeadDialog open={dialogOpen} onOpenChange={setDialogOpen} lead={editing} />
      <ConvertLeadDialog
        open={Boolean(converting)}
        onOpenChange={(open) => !open && setConverting(null)}
        lead={converting}
      />
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete lead"
        description={`Delete lead for ${deleting?.contact.firstName} ${deleting?.contact.lastName}?`}
        isLoading={deleteLead.isPending}
        onConfirm={async () => {
          if (!deleting) return;
          await deleteLead.mutateAsync(deleting.id);
          setDeleting(null);
        }}
      />
    </div>
  );
}
