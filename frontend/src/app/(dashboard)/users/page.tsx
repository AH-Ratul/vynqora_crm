'use client';

import { useState } from 'react';
import { Plus, Search, UserCog, UserX } from 'lucide-react';
import { AuthGuard } from '@/components/layout/auth-guard';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { PaginationBar } from '@/components/shared/pagination-bar';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { TableSkeleton } from '@/components/shared/table-skeleton';
import { RoleBadge } from '@/components/shared/status-badge';
import { CreateUserDialog } from '@/components/users/create-user-dialog';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useDeactivateUser, useUpdateUser, useUsers } from '@/hooks/use-users';
import { useDebounce } from '@/hooks/use-debounce';
import { useAuthStore } from '@/stores/auth-store';
import { formatDate, getInitials } from '@/lib/utils';
import { ROLES, ROLE_LABELS, type Role, type User } from '@/types';

function UsersPageContent() {
  const currentUser = useAuthStore((s) => s.user);
  const isAdmin = currentUser?.role === 'ADMIN';

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [deactivating, setDeactivating] = useState<User | null>(null);

  const debouncedSearch = useDebounce(search, 300);
  const users = useUsers({ page, limit: 15, search: debouncedSearch || undefined });
  const updateUser = useUpdateUser();
  const deactivateUser = useDeactivateUser();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Team"
        description="Manage workspace members, roles, and access."
        actions={
          isAdmin && (
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="size-3.5" />
              Add member
            </Button>
          )
        }
      />

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search team members..."
          className="pl-8 bg-card"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </div>

      {users.isLoading ? (
        <TableSkeleton cols={5} />
      ) : !users.data || users.data.data.length === 0 ? (
        <EmptyState
          icon={UserCog}
          title="No team members found"
          description="Add staff accounts to collaborate on leads and deals."
        />
      ) : (
        <>
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead>Member</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  {isAdmin && <TableHead className="w-24 text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.data.data.map((u) => {
                  const isSelf = u.id === currentUser?.id;
                  return (
                    <TableRow key={u.id}>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <span className="flex size-7 items-center justify-center rounded-full bg-stone-100 text-[11px] font-medium text-stone-700">
                            {getInitials(u.firstName, u.lastName)}
                          </span>
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {u.firstName} {u.lastName}
                              {isSelf && (
                                <span className="ml-1.5 text-[10px] text-muted-foreground">
                                  (you)
                                </span>
                              )}
                            </p>
                            <p className="text-[11px] text-muted-foreground">{u.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {isAdmin && !isSelf ? (
                          <Select
                            items={ROLE_LABELS}
                            value={u.role}
                            onValueChange={(val) =>
                              val && updateUser.mutate({ id: u.id, payload: { role: val as Role } })
                            }
                          >
                            <SelectTrigger className="h-7 w-36 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ROLES.map((r) => (
                                <SelectItem key={r} value={r}>
                                  {ROLE_LABELS[r]}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <RoleBadge role={u.role} />
                        )}
                      </TableCell>
                      <TableCell>
                        <span
                          className={
                            u.isActive
                              ? 'text-xs font-medium text-emerald-700'
                              : 'text-xs text-muted-foreground'
                          }
                        >
                          {u.isActive ? 'Active' : 'Deactivated'}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(u.createdAt)}
                      </TableCell>
                      {isAdmin && (
                        <TableCell className="text-right">
                          {!isSelf && u.isActive && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs text-destructive hover:text-destructive"
                              onClick={() => setDeactivating(u)}
                            >
                              <UserX className="size-3.5" />
                              Deactivate
                            </Button>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <PaginationBar
            page={users.data.page}
            limit={users.data.limit}
            total={users.data.total}
            isFetching={users.isFetching}
            onPageChange={setPage}
          />
        </>
      )}

      <CreateUserDialog open={createOpen} onOpenChange={setCreateOpen} />
      <ConfirmDialog
        open={Boolean(deactivating)}
        onOpenChange={(open) => !open && setDeactivating(null)}
        title="Deactivate member"
        description={`Deactivate ${deactivating?.firstName} ${deactivating?.lastName}? They will be signed out immediately.`}
        confirmLabel="Deactivate"
        isLoading={deactivateUser.isPending}
        onConfirm={async () => {
          if (!deactivating) return;
          await deactivateUser.mutateAsync(deactivating.id);
          setDeactivating(null);
        }}
      />
    </div>
  );
}

export default function UsersPage() {
  return (
    <AuthGuard allowedRoles={['ADMIN', 'MANAGER']}>
      <UsersPageContent />
    </AuthGuard>
  );
}
