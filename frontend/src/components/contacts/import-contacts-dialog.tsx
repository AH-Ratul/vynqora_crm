'use client';

import { useState, type ChangeEvent } from 'react';
import { FileUp, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { parseContactsCsv, type ParsedContactRow } from '@/lib/csv';
import { useImportContacts } from '@/hooks/use-contacts';

interface ImportContactsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImportContactsDialog({ open, onOpenChange }: ImportContactsDialogProps) {
  const [rows, setRows] = useState<ParsedContactRow[]>([]);
  const [skipped, setSkipped] = useState(0);
  const [fileName, setFileName] = useState('');
  const importContacts = useImportContacts();

  const handleFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const text = await file.text();
    const parsed = parseContactsCsv(text);
    setRows(parsed.rows);
    setSkipped(parsed.skipped);
  };

  const handleImport = async () => {
    if (rows.length === 0) return;
    await importContacts.mutateAsync(rows);
    setRows([]);
    setSkipped(0);
    setFileName('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import contacts from CSV</DialogTitle>
          <DialogDescription>
            Include headers: <code className="text-xs">firstName, lastName, email, phone, title, tags</code>.
            Existing emails will be updated.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 px-4 py-8 text-center transition-colors hover:bg-muted/60">
            <FileUp className="size-5 text-muted-foreground mb-2" />
            <span className="text-xs font-medium text-foreground">
              {fileName || 'Choose a .csv file'}
            </span>
            <span className="mt-1 text-[11px] text-muted-foreground">Up to 5,000 rows</span>
            <input type="file" accept=".csv,text/csv" className="hidden" onChange={handleFile} />
          </label>

          {fileName && (
            <div className="rounded-lg border border-border bg-muted/30 px-3.5 py-2.5 text-xs">
              <p className="font-medium text-foreground">{rows.length} valid contacts ready</p>
              {skipped > 0 && (
                <p className="mt-0.5 text-muted-foreground">
                  {skipped} row(s) skipped (missing first or last name)
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={rows.length === 0 || importContacts.isPending}
          >
            {importContacts.isPending && <Loader2 className="size-3.5 animate-spin" />}
            Import {rows.length > 0 ? `(${rows.length})` : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
