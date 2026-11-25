'use client';

import { useState } from 'react';
import { Kanban, List, MoreHorizontal, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { PaginationBar } from '@/components/shared/pagination-bar';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { TableSkeleton } from '@/components/shared/table-skeleton';
import { DealStageBadge } from '@/components/shared/status-badge';
import { KanbanBoard } from '@/components/deals/kanban-board';
import { DealDialog } from '@/components/deals/deal-dialog';
import { DealDetailSheet } from '@/components/deals/deal-detail-sheet';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useDeals,
  useDealsPipeline,
  useDeleteDeal,
  useMoveDealStage,
} from '@/hooks/use-deals';
import { useUserOptions } from '@/hooks/use-users';
import { useDebounce } from '@/hooks/use-debounce';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Deal } from '@/types';

export default function DealsPage() {
  const [view, setView] = useState<'board' | 'table'>('board');
  const [assignedToId, setAssignedToId] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Deal | null>(null);
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<Deal | null>(null);

  const debouncedSearch = useDebounce(search, 300);
  const users = useUserOptions();

  const userItems: Record<string, string> = {
    __all__: 'All owners',
    ...Object.fromEntries((users.data ?? []).map((u) => [u.id, `${u.firstName} ${u.lastName}`])),
  };

  const pipeline = useDealsPipeline(assignedToId || undefined);
  const dealsTable = useDeals({
    page,
    limit: 15,
    search: debouncedSearch || undefined,
    assignedToId: assignedToId || undefined,
  });
  const moveStage = useMoveDealStage(assignedToId || undefined);
  const deleteDeal = useDeleteDeal();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Deals"
        description="Drag deals across stages or switch to table view to scan details."
        actions={
          <Button
            size="sm"
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="size-3.5" />
            New deal
          </Button>
        }
      />

      {/* View Switcher & Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={view} onValueChange={(v) => setView(v as 'board' | 'table')}>
          <TabsList className="bg-muted/70">
            <TabsTrigger value="board" className="gap-1.5 text-xs">
              <Kanban className="size-3.5" />
              Board
            </TabsTrigger>
            <TabsTrigger value="table" className="gap-1.5 text-xs">
              <List className="size-3.5" />
              Table
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {view === 'table' && (
            <div className="relative w-full sm:w-56">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search deals..."
                className="pl-8 bg-card"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          )}
          <Select
            items={userItems}
            value={assignedToId || '__all__'}
            onValueChange={(v) => {
              setAssignedToId(v === '__all__' ? '' : (v ?? ''));
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-44 bg-card">
              <SelectValue placeholder="All owners" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All owners</SelectItem>
              {(users.data ?? []).map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.firstName} {u.lastName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {view === 'board' ? (
        <KanbanBoard
          board={pipeline.data}
          isLoading={pipeline.isLoading}
          onMoveStage={(id, stage) => moveStage.mutate({ id, stage })}
          onSelectDeal={(deal) => setSelectedDealId(deal.id)}
        />
      ) : dealsTable.isLoading ? (
        <TableSkeleton cols={6} />
      ) : !dealsTable.data || dealsTable.data.data.length === 0 ? (
        <EmptyState
          icon={Kanban}
          title="No deals found"
          description="Create a deal to start tracking opportunities."
          action={
            <Button
              size="sm"
              onClick={() => {
                setEditing(null);
                setDialogOpen(true);
              }}
            >
              <Plus className="size-3.5" />
              New deal
            </Button>
          }
        />
      ) : (
        <>
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead>Deal</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Expected Close</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {dealsTable.data.data.map((d) => (
                  <TableRow
                    key={d.id}
                    className="cursor-pointer"
                    onClick={() => setSelectedDealId(d.id)}
                  >
                    <TableCell>
                      <p className="text-sm font-medium text-foreground">{d.title}</p>
                      {d.company && (
                        <p className="text-[11px] text-muted-foreground">{d.company.name}</p>
                      )}
                    </TableCell>
                    <TableCell>
                      <DealStageBadge stage={d.stage} />
                    </TableCell>
                    <TableCell className="text-xs font-medium tabular-nums">
                      {formatCurrency(d.value)}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {d.contact ? `${d.contact.firstName} ${d.contact.lastName}` : '—'}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(d.expectedCloseDate)}
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
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
                              setEditing(d);
                              setDialogOpen(true);
                            }}
                          >
                            <Pencil className="size-3.5" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setDeleting(d)}
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
            page={dealsTable.data.page}
            limit={dealsTable.data.limit}
            total={dealsTable.data.total}
            isFetching={dealsTable.isFetching}
            onPageChange={setPage}
          />
        </>
      )}

      <DealDialog open={dialogOpen} onOpenChange={setDialogOpen} deal={editing} />
      <DealDetailSheet
        dealId={selectedDealId}
        onClose={() => setSelectedDealId(null)}
        onEdit={(deal) => {
          setSelectedDealId(null);
          setEditing(deal);
          setDialogOpen(true);
        }}
        onDelete={(deal) => {
          setSelectedDealId(null);
          setDeleting(deal);
        }}
      />
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete deal"
        description={`Delete "${deleting?.title}"? Linked activities and tasks will remain intact.`}
        isLoading={deleteDeal.isPending}
        onConfirm={async () => {
          if (!deleting) return;
          await deleteDeal.mutateAsync(deleting.id);
          setDeleting(null);
        }}
      />
    </div>
  );
}
