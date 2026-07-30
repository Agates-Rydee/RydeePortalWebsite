// D8 Phase 2: shared stat card used by Admin + Operator dashboards.
// Extracted from the ~35-line duplicated JSX in both dashboards. The
// `href` variant renders as a Link-styled Button (click-through metric);
// otherwise renders read-only.
import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface StatCardProps {
  label: string;
  /** null/undefined shows "—" sentinel while loading (parity with pre-D8). */
  value: number | string | null | undefined;
  /** Tailwind color classname for the value (e.g. "text-primary", "text-warning"). */
  valueClassName?: string;
  /** Optional tap-through — renders value as a link-button. */
  onClick?: () => void;
  hint?: string;
  icon: ReactNode;
  iconBgClassName?: string;
}

export function StatCard({
  label,
  value,
  valueClassName = "text-foreground",
  onClick,
  hint,
  icon,
  iconBgClassName = "bg-[color:var(--brand-bright)]/10",
}: StatCardProps) {
  const display = value ?? "—";
  return (
    <Card className="rounded-2xl p-6 flex-row items-center justify-between gap-4 card-elevated border-border">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">{label}</p>
        {onClick ? (
          <Button
            type="button"
            variant="link"
            onClick={onClick}
            className={`text-4xl font-bold mt-1 h-auto p-0 no-underline hover:underline ${valueClassName}`}
            style={{ lineHeight: 1.2 }}
          >
            {display}
          </Button>
        ) : (
          <p className={`text-4xl font-bold mt-1 ${valueClassName}`}>{display}</p>
        )}
        {hint && <p className="text-xs mt-1 text-muted-foreground">{hint}</p>}
      </div>
      <div
        className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${iconBgClassName}`}
      >
        {icon}
      </div>
    </Card>
  );
}
