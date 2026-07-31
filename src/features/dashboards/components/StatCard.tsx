import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";

interface StatCardProps {
  label: string;
  // A null or undefined value renders the em-dash sentinel used as the
  // loading placeholder.
  value: number | string | null | undefined;
  valueClassName?: string;
  onClick?: () => void;
  hint?: string;
  icon: ReactNode;
  iconBgClassName?: string;
}

const CARD_BASE =
  "rounded-2xl p-6 flex-row items-center justify-between gap-4 card-elevated border-border";

// The motion-reduce utility classes duplicate the prefers-reduced-motion
// override in theme.css so the animation is still guaranteed to be disabled
// even if this element is rendered outside the base layer for any reason.
const CARD_INTERACTIVE =
  "text-left w-full transition-all duration-200 " +
  "hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98] " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 " +
  "motion-reduce:transform-none motion-reduce:transition-none";

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
  const interactive = onClick != null && value != null;

  const body = (
    <>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">{label}</p>
        <p className={`text-4xl font-bold mt-1 ${valueClassName}`} style={{ lineHeight: 1.2 }}>
          {display}
        </p>
        {hint && <p className="text-xs mt-1 text-muted-foreground">{hint}</p>}
      </div>
      <div
        className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${iconBgClassName}`}
      >
        {icon}
      </div>
    </>
  );

  if (interactive) {
    // Render a native <button> and re-apply the Card visual classes so the
    // interactive element is itself the semantic root, without a wrapping
    // <div> that would nest interactive controls or add an extra tab stop.
    const ariaLabel = `View ${display} ${label.toLowerCase()}`;
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={ariaLabel}
        className={
          "bg-card text-card-foreground flex flex-row items-center justify-between gap-4 " +
          "rounded-2xl border card-elevated border-border p-6 " +
          CARD_INTERACTIVE
        }
      >
        {body}
      </button>
    );
  }

  return <Card className={CARD_BASE}>{body}</Card>;
}