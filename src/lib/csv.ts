/**
 * RFC 4180 CSV parser: handles quoted fields, escaped quotes, commas and
 * newlines inside quotes. Fully empty rows are dropped.
 */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  const pushRow = () => {
    row.push(cell.trim());
    if (row.some((c) => c.length > 0)) rows.push(row);
    row = [];
    cell = "";
  };

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (char === '"') {
      if (inQuotes && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      row.push(cell.trim());
      cell = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && text[i + 1] === "\n") i++;
      pushRow();
    } else {
      cell += char;
    }
  }

  if (cell.length > 0 || row.length > 0) pushRow();
  return rows;
}

/** Lower-cases a header and strips spaces/underscores ("Started Date" → "starteddate"). */
export function normalizeHeader(header: string): string {
  return header.toLowerCase().replace(/[\s_]+/g, "");
}
