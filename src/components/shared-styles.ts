// Style constants + focus/blur helpers shared across auth pages,
// dashboards, and rider-management screens. Split out of shared.tsx
// in Iteration 2 so shared.tsx contains only React components — needed
// for Vite/React-Refresh's `only-export-components` rule to hold.
import type React from "react";

export const cardStyle: React.CSSProperties = {
  background: "var(--card)",
  border: "1px solid var(--border)",
  boxShadow: "0 0 0 1px rgba(23,168,130,0.06), 0 8px 40px rgba(23,168,130,0.10)",
};

export const btnPrimary: React.CSSProperties = {
  background: "linear-gradient(135deg, #17a882 0%, #0d8f6e 100%)",
  color: "#ffffff",
  boxShadow: "0 4px 20px rgba(23,168,130,0.30)",
  cursor: "pointer",
};

export const btnLoading: React.CSSProperties = {
  background: "rgba(23,168,130,0.5)",
  color: "#ffffff",
  boxShadow: "none",
  cursor: "not-allowed",
};

export const inputBase: React.CSSProperties = {
  background: "var(--input-background)",
  border: "1px solid var(--border)",
  color: "var(--card-foreground)",
  caretColor: "#17a882",
};

export function focusInput(
  e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
) {
  e.currentTarget.style.border = "1px solid rgba(23,168,130,0.5)";
  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(23,168,130,0.10)";
}

export function blurInput(
  e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
) {
  e.currentTarget.style.border = "1px solid var(--border)";
  e.currentTarget.style.boxShadow = "none";
}
