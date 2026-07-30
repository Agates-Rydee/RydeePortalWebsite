// D8 restyle Phase 1: `cardStyle` retained for dashboards + PendingRiders
// while Phases 2-3 migrate them. Legacy helpers below (`btnPrimary`,
// `btnLoading`, `inputBase`, `focusInput`, `blurInput`) are DEPRECATED —
// only PendingRiders still consumes them and is migrated in Phase 3. Once
// no consumer remains, this file is deleted in Phase 4.
import type React from "react";

export const cardStyle: React.CSSProperties = {
  background: "var(--card)",
  border: "1px solid var(--border)",
  boxShadow: "0 0 0 1px rgba(23,168,130,0.06), 0 8px 40px rgba(23,168,130,0.10)",
};

/** @deprecated Removed in Phase 3 (PendingRiders migration). */
export const btnPrimary: React.CSSProperties = {
  background: "linear-gradient(135deg, #0d8f6e 0%, #0a7c5f 100%)",
  color: "#ffffff",
  boxShadow: "0 4px 20px rgba(13,143,110,0.30)",
  cursor: "pointer",
};

/** @deprecated Removed in Phase 3. */
export const btnLoading: React.CSSProperties = {
  background: "rgba(13,143,110,0.5)",
  color: "#ffffff",
  boxShadow: "none",
  cursor: "not-allowed",
};

/** @deprecated Removed in Phase 3. */
export const inputBase: React.CSSProperties = {
  background: "var(--input-background)",
  border: "1px solid var(--border)",
  color: "var(--card-foreground)",
  caretColor: "#0d8f6e",
};

/** @deprecated Removed in Phase 3. */
export function focusInput(
  e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
) {
  e.currentTarget.style.border = "1px solid rgba(13,143,110,0.5)";
  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(13,143,110,0.10)";
}

/** @deprecated Removed in Phase 3. */
export function blurInput(
  e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
) {
  e.currentTarget.style.border = "1px solid var(--border)";
  e.currentTarget.style.boxShadow = "none";
}
