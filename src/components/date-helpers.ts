// Iter 4.1 hotfix: shared date helpers for the DatePickerField.
// Split out so the field module only exports components (react-refresh
// rule react-refresh/only-export-components).

export function formatDobDisplay(d: Date): string {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = String(d.getFullYear());
  return `${dd}/${mm}/${yyyy}`;
}
