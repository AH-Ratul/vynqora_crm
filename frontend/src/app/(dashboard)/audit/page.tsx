'use client';

import { useState } from 'react';
import { FileClock } from 'lucide-react';
import { AuthGuard } from '@/components/layout/auth-guard';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { PaginationBar } from '@/components/shared/pagination-bar';
import { TableSkeleton } from '@/components/shared/table-skeleton';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuditLogs } from '@/hooks/use-audit';
import { formatRelativeDate } from '@/lib/utils';

const ENTITIES = ['contacts', 'companies', 'leads', 'deals', 'tasks', 'activities', 'users'];
const ENTITY_ITEMS: Record<string, string> = {
  __all__: 'All entities',
  ...Object.fromEntries(ENTITIES.map((e) => [e, e.charAt(0).toUpperCase() + e.slice(1)])),
};

function AuditPageContent() {
  const [page, setPage] = useState(1);
  const [entity, setEntity] = useState('');
  const logs = useAuditLogs({ page, limit: 20, entity: entity || undefined });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Log"
        description="Chronological record of write actions performed across the workspace."
        actions={
          <Select
            items={ENTITY_ITEMS}
            value={entity || '__all__'}
            onValueChange={(v) => {
              setEntity(v === '__all__' ? '' : (v ?? ''));
              setPage(1);
            }}
          >
            <SelectTrigger className="w-40 bg-card">
              <SelectValue placeholder="All entities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All entities</SelectItem>
              {ENTITIES.map((e) => (
                <SelectItem key={e} value={e}>
                  {e.charAt(0).toUpperCase() + e.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      {logs.isLoading ? (
        <TableSkeleton cols={5} />
      ) : !logs.data || logs.data.data.length === 0 ? (
        <EmptyState
          icon={FileClock}
          title="No audit events yet"
          description="State changes (create, update, delete) will appear here automatically."
        />
      ) : (
        <>
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Payload</TableHead>
                  <TableHead className="text-right">When</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.data.data.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-[10px]">
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs font-medium capitalize">
                      {log.entity}
                      <span className="ml-1.5 font-mono text-[10px] text-muted-foreground">
                        {log.entityId.slice(0, 8)}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {log.user ? `${log.user.firstName} ${log.user.lastName}` : '—'}
                    </TableCell>
                    <TableCell className="max-w-xs truncate font-mono text-[11px] text-muted-foreground">
                      {log.newValues ? JSON.stringify(log.newValues) : '—'}
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">
                      {formatRelativeDate(log.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <PaginationBar
            page={logs.data.page}
            limit={logs.data.limit}
            total={logs.data.total}
            isFetching={logs.isFetching}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}

export default function AuditPage() {
  return (
    <AuthGuard allowedRoles={['ADMIN', 'MANAGER']}>
      <AuditPageContent />
    </AuthGuard>
  );
}
