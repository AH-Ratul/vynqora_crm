'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Download,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { PaginationBar } from '@/components/shared/pagination-bar';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { TableSkeleton } from '@/components/shared/table-skeleton';
import { ContactDialog } from '@/components/contacts/contact-dialog';
import { ImportContactsDialog } from '@/components/contacts/import-contacts-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import { downloadContactsCsv, useContacts, useDeleteContact } from '@/hooks/use-contacts';
import { useCompanies } from '@/hooks/use-companies';
import { useDebounce } from '@/hooks/use-debounce';
import { getApiErrorMessage } from '@/lib/api';
import { getInitials } from '@/lib/utils';
import type { Contact } from '@/types';

export default function ContactsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [tag, setTag] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [deleting, setDeleting] = useState<Contact | null>(null);

  const debouncedSearch = useDebounce(search, 300);
  const debouncedTag = useDebounce(tag, 300);

  const contacts = useContacts({
    page,
    limit: 15,
    search: debouncedSearch || undefined,
    companyId: companyId || undefined,
    tag: debouncedTag || undefined,
  });
  const companies = useCompanies({ limit: 100 });
  const deleteContact = useDeleteContact();

  const companyItems: Record<string, string> = {
    __all__: 'All companies',
    ...Object.fromEntries((companies.data?.data ?? []).map((c) => [c.id, c.name])),
  };

  const handleExport = async () => {
    try {
      await downloadContactsCsv({
        search: debouncedSearch || undefined,
        companyId: companyId || undefined,
        tag: debouncedTag || undefined,
      });
      toast.success('Contacts exported');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Export failed'));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contacts"
        description="People across your accounts, leads, and deals."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
              <Upload className="size-3.5" />
              Import
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="size-3.5" />
              Export
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setEditing(null);
                setDialogOpen(true);
              }}
            >
              <Plus className="size-3.5" />
              New contact
            </Button>
          </>
        }
      />

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, phone..."
            className="pl-8 bg-card"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <Select
          items={companyItems}
          value={companyId || '__all__'}
          onValueChange={(val) => {
            setCompanyId(val === '__all__' ? '' : (val ?? ''));
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full sm:w-48 bg-card">
            <SelectValue placeholder="All companies" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All companies</SelectItem>
            {(companies.data?.data ?? []).map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          placeholder="Filter by tag..."
          className="w-full sm:w-40 bg-card"
          value={tag}
          onChange={(e) => {
            setTag(e.target.value);
            setPage(1);
          }}
        />
      </div>

      {/* Table */}
      {contacts.isLoading ? (
        <TableSkeleton cols={5} />
      ) : !contacts.data || contacts.data.data.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No contacts found"
          description="Add your first contact or import an existing CSV list."
          action={
            <Button
              size="sm"
              onClick={() => {
                setEditing(null);
                setDialogOpen(true);
              }}
            >
              <Plus className="size-3.5" />
              Add contact
            </Button>
          }
        />
      ) : (
        <>
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead>Name</TableHead>
                  <TableHead>Email &amp; Phone</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts.data.data.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <Link
                        href={`/contacts/${c.id}`}
                        className="flex items-center gap-2.5 group"
                      >
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-stone-100 text-[11px] font-medium text-stone-700">
                          {getInitials(c.firstName, c.lastName)}
                        </span>
                        <div>
                          <p className="text-sm font-medium text-foreground group-hover:underline underline-offset-2">
                            {c.firstName} {c.lastName}
                          </p>
                          {c.title && (
                            <p className="text-[11px] text-muted-foreground">{c.title}</p>
                          )}
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <p className="text-xs text-foreground">{c.email || '—'}</p>
                      {c.phone && <p className="text-[11px] text-muted-foreground">{c.phone}</p>}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {c.company ? (
                        <Link
                          href={`/companies/${c.company.id}`}
                          className="text-foreground hover:underline underline-offset-2"
                        >
                          {c.company.name}
                        </Link>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {c.tags.length > 0
                          ? c.tags.slice(0, 3).map((t) => (
                              <Badge key={t} variant="secondary" className="text-[10px] font-normal">
                                {t}
                              </Badge>
                            ))
                          : <span className="text-xs text-muted-foreground">—</span>}
                      </div>
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
                              setEditing(c);
                              setDialogOpen(true);
                            }}
                          >
                            <Pencil className="size-3.5" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setDeleting(c)}
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
            page={contacts.data.page}
            limit={contacts.data.limit}
            total={contacts.data.total}
            isFetching={contacts.isFetching}
            onPageChange={setPage}
          />
        </>
      )}

      <ContactDialog open={dialogOpen} onOpenChange={setDialogOpen} contact={editing} />
      <ImportContactsDialog open={importOpen} onOpenChange={setImportOpen} />
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete contact"
        description={`Remove ${deleting?.firstName} ${deleting?.lastName}? Contacts with active deals cannot be deleted.`}
        isLoading={deleteContact.isPending}
        onConfirm={async () => {
          if (!deleting) return;
          await deleteContact.mutateAsync(deleting.id);
          setDeleting(null);
        }}
      />
    </div>
  );
}
