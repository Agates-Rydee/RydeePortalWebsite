const NEEDS_QUOTE = /[",\r\n]/;

export function csvEscape(field: string): string {
  if (NEEDS_QUOTE.test(field)) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

// When rows is empty the output is just the header line with no trailing CRLF, so callers that assert byte-level output see the exact same bytes for an empty export.
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
  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
