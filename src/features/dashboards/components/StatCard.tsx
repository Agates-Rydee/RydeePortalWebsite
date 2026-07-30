// D8 Phase 2: shared stat card used by Admin + Operator dashboards.
// Iter 4 §5: when `onClick` is provided AND `value` is non-null, the entire
// card is rendered as a semantic <button> for a full-size click target with
// hover elevation, active-scale, focus-visible ring, and a dynamic aria-label.
// The inner value renders as a plain <p> in that case — no nested interactives.
// When `value` is null (loading) OR `onClick` is absent, the card is a static
// <div>, matching the pre-Iter-4 read-only appearance.
import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";

interface StatCardProps {
  label: string;
  /** null/undefined shows "—" sentinel while loading (parity with pre-D8). */
  value: number | string | null | undefined;
  /** Tailwind color classname for the value (e.g. "text-primary", "text-warning"). */
  valueClassName?: string;
  /** Optional tap-through — makes the entire card an interactive <button>. */
  onClick?: () => void;
  hint?: string;
  icon: ReactNode;
  iconBgClassName?: string;
}

// Base visual chrome shared by static + interactive variants.
const CARD_BASE =
  "rounded-2xl p-6 flex-row items-center justify-between gap-4 card-elevated border-border";

// Interactive-only additions: motion, focus ring, hover elevation, press scale.
// motion-reduce:* guards defer to the prefers-reduced-motion override already
// in theme.css, but we set them explicitly for defensiveness on this element.
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
    // Rendered as a <Card asChild-equivalent> via the underlying div-vs-button
    // switch: we render a real <button> and re-apply the Card visual classes
    // (bg-card / text-card-foreground / gap-6 / rounded-xl / border) so the
    // semantic root becomes the interactive element without wrapping/nesting.
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