'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Building2, MoreHorizontal, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { PaginationBar } from '@/components/shared/pagination-bar';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { TableSkeleton } from '@/components/shared/table-skeleton';
import { CompanyDialog } from '@/components/companies/company-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { useCompanies, useDeleteCompany } from '@/hooks/use-companies';
import { useDebounce } from '@/hooks/use-debounce';
import type { Company } from '@/types';

export default function CompaniesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Company | null>(null);
  const [deleting, setDeleting] = useState<Company | null>(null);

  const debouncedSearch = useDebounce(search, 300);
  const companies = useCompanies({ page, limit: 15, search: debouncedSearch || undefined });
  const deleteCompany = useDeleteCompany();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Companies"
        description="Organizations and accounts linked to your contacts and deals."
        actions={
          <Button
            size="sm"
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="size-3.5" />
            New company
          </Button>
        }
      />

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search companies..."
          className="pl-8 bg-card"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </div>

      {companies.isLoading ? (
        <TableSkeleton cols={5} />
      ) : !companies.data || companies.data.data.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No companies yet"
          description="Create an account to group contacts and track deals."
          action={
            <Button
              size="sm"
              onClick={() => {
                setEditing(null);
                setDialogOpen(true);
              }}
            >
              <Plus className="size-3.5" />
              Add company
            </Button>
          }
        />
      ) : (
        <>
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead>Company</TableHead>
                  <TableHead>Industry</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Contacts</TableHead>
                  <TableHead className="text-right">Deals</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {companies.data.data.map((co) => (
                  <TableRow key={co.id}>
                    <TableCell>
                      <Link
                        href={`/companies/${co.id}`}
                        className="text-sm font-medium text-foreground hover:underline underline-offset-2"
                      >
                        {co.name}
                      </Link>
                      {co.website && (
                        <p className="text-[11px] text-muted-foreground">{co.website}</p>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {co.industry || '—'}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {[co.city, co.country].filter(Boolean).join(', ') || '—'}
                    </TableCell>
                    <TableCell className="text-right text-xs tabular-nums">
                      {co._count?.contacts ?? 0}
                    </TableCell>
                    <TableCell className="text-right text-xs tabular-nums">
                      {co._count?.deals ?? 0}
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
                              setEditing(co);
                              setDialogOpen(true);
                            }}
                          >
                            <Pencil className="size-3.5" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setDeleting(co)}
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
            page={companies.data.page}
            limit={companies.data.limit}
            total={companies.data.total}
            isFetching={companies.isFetching}
            onPageChange={setPage}
          />
        </>
      )}

      <CompanyDialog open={dialogOpen} onOpenChange={setDialogOpen} company={editing} />
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete company"
        description={`Delete ${deleting?.name}? Linked contacts and deals will be detached, not deleted.`}
        isLoading={deleteCompany.isPending}
        onConfirm={async () => {
          if (!deleting) return;
          await deleteCompany.mutateAsync(deleting.id);
          setDeleting(null);
        }}
      />
    </div>
  );
}
