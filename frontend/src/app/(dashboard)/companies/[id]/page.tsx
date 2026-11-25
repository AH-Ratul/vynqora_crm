'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Globe, MapPin, Pencil, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { DealStageBadge } from '@/components/shared/status-badge';
import { CompanyDialog } from '@/components/companies/company-dialog';
import { useCompany } from '@/hooks/use-companies';
import { formatCurrency } from '@/lib/utils';

export default function CompanyDetailPage() {
  const params = useParams<{ id: string }>();
  const [editOpen, setEditOpen] = useState(false);
  const company = useCompany(params.id);

  if (company.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-28 w-full rounded-xl" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-56 rounded-xl" />
          <Skeleton className="h-56 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!company.data) {
    return (
      <div className="py-20 text-center">
        <p className="text-sm text-muted-foreground">Company not found.</p>
        <Link href="/companies" className="mt-3 inline-block text-xs underline">
          Back to companies
        </Link>
      </div>
    );
  }

  const co = company.data;

  return (
    <div className="space-y-6">
      <Link
        href="/companies"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        Back to companies
      </Link>

      <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-lg font-semibold tracking-tight text-foreground">{co.name}</h1>
          <p className="text-xs text-muted-foreground">
            {[co.industry, co.size ? `${co.size} employees` : null].filter(Boolean).join(' · ') ||
              'Company account'}
          </p>
          <div className="flex flex-wrap gap-4 pt-1 text-xs text-muted-foreground">
            {co.website && (
              <span className="inline-flex items-center gap-1.5">
                <Globe className="size-3.5" />
                {co.website}
              </span>
            )}
            {co.phone && (
              <span className="inline-flex items-center gap-1.5">
                <Phone className="size-3.5" />
                {co.phone}
              </span>
            )}
            {(co.city || co.country) && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-3.5" />
                {[co.city, co.country].filter(Boolean).join(', ')}
              </span>
            )}
          </div>
          {co.notes && <p className="pt-2 text-xs text-foreground">{co.notes}</p>}
        </div>
        <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
          <Pencil className="size-3.5" />
          Edit
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">
              Contacts ({co.contacts?.length ?? 0})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {!co.contacts || co.contacts.length === 0 ? (
              <p className="text-xs text-muted-foreground">No contacts linked yet.</p>
            ) : (
              co.contacts.map((c) => (
                <Link
                  key={c.id}
                  href={`/contacts/${c.id}`}
                  className="flex items-center justify-between rounded-lg border border-border/70 p-3 hover:bg-muted/40 transition-colors"
                >
                  <div>
                    <p className="text-xs font-medium text-foreground">
                      {c.firstName} {c.lastName}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {[c.title, c.email].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">
              Deals ({co.deals?.length ?? 0})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {!co.deals || co.deals.length === 0 ? (
              <p className="text-xs text-muted-foreground">No deals linked yet.</p>
            ) : (
              co.deals.map((d) => (
                <div
                  key={d.id}
                  className="flex items-center justify-between rounded-lg border border-border/70 p-3"
                >
                  <div>
                    <p className="text-xs font-medium text-foreground">{d.title}</p>
                    <p className="text-[11px] text-muted-foreground">{formatCurrency(d.value)}</p>
                  </div>
                  <DealStageBadge stage={d.stage} />
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <CompanyDialog open={editOpen} onOpenChange={setEditOpen} company={co} />
    </div>
  );
}
