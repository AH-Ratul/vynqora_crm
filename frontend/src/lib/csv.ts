export interface ParsedContactRow {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  title?: string;
  tags?: string[];
  notes?: string;
}

function splitCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Parses a CSV string with headers (firstName, lastName, email, phone, title, tags, notes).
 * Tags can be pipe-separated (e.g. "vip|enterprise").
 */
export function parseContactsCsv(text: string): {
  rows: ParsedContactRow[];
  skipped: number;
} {
  const lines = text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return { rows: [], skipped: 0 };
  }

  const headers = splitCsvLine(lines[0]).map((h) => h.toLowerCase().replace(/[^a-z]/g, ''));
  const idx = (names: string[]) => headers.findIndex((h) => names.includes(h));

  const firstIdx = idx(['firstname', 'first']);
  const lastIdx = idx(['lastname', 'last']);
  const emailIdx = idx(['email', 'emailaddress']);
  const phoneIdx = idx(['phone', 'phonenumber']);
  const titleIdx = idx(['title', 'jobtitle', 'role']);
  const tagsIdx = idx(['tags', 'tag']);
  const notesIdx = idx(['notes', 'note']);

  const rows: ParsedContactRow[] = [];
  let skipped = 0;

  for (let i = 1; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i]);
    const firstName = firstIdx >= 0 ? cols[firstIdx] : '';
    const lastName = lastIdx >= 0 ? cols[lastIdx] : '';

    if (!firstName || !lastName) {
      skipped++;
      continue;
    }

    const row: ParsedContactRow = { firstName, lastName };
    const email = emailIdx >= 0 ? cols[emailIdx] : '';
    const phone = phoneIdx >= 0 ? cols[phoneIdx] : '';
    const title = titleIdx >= 0 ? cols[titleIdx] : '';
    const rawTags = tagsIdx >= 0 ? cols[tagsIdx] : '';
    const notes = notesIdx >= 0 ? cols[notesIdx] : '';

    if (email) row.email = email;
    if (phone) row.phone = phone;
    if (title) row.title = title;
    if (rawTags) {
      row.tags = rawTags
        .split(/[|;]/)
        .map((t) => t.trim())
        .filter(Boolean);
    }
    if (notes) row.notes = notes;
    rows.push(row);
  }

  return { rows, skipped };
}
