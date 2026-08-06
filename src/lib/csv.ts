const NEEDS_QUOTE = /[",\r\n]/;
const DANGEROUS_PREFIX = /^[=+\-@\t\r]/;

export function csvEscape(field: string): string {
  const neutralised = DANGEROUS_PREFIX.test(field) ? `'${field}` : field;
  if (NEEDS_QUOTE.test(neutralised) || neutralised !== field) {
    return `"${neutralised.replace(/"/g, '""')}"`;
  }
  return neutralised;
}

export function serializeCsv(
  headers: readonly string[],
  rows: readonly (readonly string[])[],
): string {
  const headerLine = headers.map(csvEscape).join(",");
  const bodyLines = rows.map((row) => row.map(csvEscape).join(","));
  return [headerLine, ...bodyLines].join("\r\n");
}

export function downloadCsv(csv: string, filename: string): void {
  // The leading \uFEFF byte-order mark makes Excel open non-ASCII fields with the correct UTF-8 encoding.
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
