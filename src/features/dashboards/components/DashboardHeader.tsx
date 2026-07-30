// Extracted 2026-07-30 (D8 Phase 2): pre-refactor Admin/Operator/Rider
// dashboards each open with a byte-for-byte duplicated <header>. This
// organism folds them into one component driven by props.
import { Logo } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Props {
  /** Optional role badge — omit for RiderDashboard which had no badge. */
  roleLabel?: string;
  /** Displayed on ≥sm; hidden on mobile. */
  userName?: string | null;
  onLogout: () => void;
}

export function DashboardHeader({ roleLabel, userName, onLogout }: Props) {
  return (
    <header className="w-full flex items-center justify-between px-6 py-4 sticky top-0 z-10 bg-card border-b border-border">
      <div className="flex items-center gap-4">
        <Logo size="sm" />
        {roleLabel && (
          <Badge
            variant="secondary"
            className="rounded-full px-2.5 py-1 bg-[color:var(--brand-bright)]/12 text-primary border border-[color:var(--brand-bright)]/25"
          >
            {roleLabel}
          </Badge>
        )}
      </div>
      <div className="flex items-center gap-3">
        {userName && (
          <span className="text-sm hidden sm:block text-muted-foreground">{userName}</span>
        )}
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={onLogout}
          className="rounded-xl px-4 h-9 text-muted-foreground hover:text-primary bg-muted hover:bg-secondary"
        >
          Sign out
        </Button>
      </div>
    </header>
  );
}
