export function formatCnic(raw: string | undefined): string {
  const digits = (raw ?? "").replace(/\D/g, "");
  if (digits.length !== 13) return raw ?? "";
  return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`;
}

export function normalizeCnicInput(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 13);
}
