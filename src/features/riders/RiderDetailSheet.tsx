import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { AllRidersRow, RiderStatus } from "@/types/rider";

const STATUS_LABEL: Record<RiderStatus, string> = {
  active: "Active",
  pending: "Pending",
  blocked: "Blocked",
  offboarded: "Offboarded",
};

const STATUS_BADGE: Record<RiderStatus, string> = {
  active: "bg-success-muted text-success border-success/25",
  pending: "bg-warning-muted text-warning border-warning/25",
  blocked: "bg-destructive/10 text-destructive border-destructive/25",
  offboarded: "bg-muted text-muted-foreground border-border",
};

function formatDate(iso: string | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

interface Field {
  label: string;
  value: string;
  mono?: boolean;
}

export interface RiderDetailSheetProps {
  row: AllRidersRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RiderDetailSheet({ row, open, onOpenChange }: RiderDetailSheetProps) {
  const fields: Field[] = row
    ? [
        { label: "Full name", value: row.name || "—" },
        { label: "Phone", value: row.phone || "—", mono: true },
        { label: "CNIC", value: row.cnic || "—", mono: true },
        { label: "Area", value: row.area || "—" },
        { label: "Joined", value: formatDate(row.joinedAt) },
        { label: "Date of birth", value: formatDate(row.dob) },
        { label: "PIN", value: row.pin || "—", mono: true },
      ]
    : [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md overflow-y-auto data-[state=open]:duration-0 data-[state=closed]:duration-0"
        data-testid="fqa-rider-detail-sheet"
      >
        <SheetHeader>
          <SheetTitle>{row?.name || "Rider details"}</SheetTitle>
          <SheetDescription>
            Read-only view of the rider's full record.
          </SheetDescription>
        </SheetHeader>

        {row && (
          <div className="px-4 pb-6 space-y-5">
            <div>
              <Badge
                variant="outline"
                className={`gap-1.5 px-2.5 py-0.5 text-xs font-medium rounded-full ${STATUS_BADGE[row.status]}`}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full bg-current"
                  aria-hidden="true"
                />
                {STATUS_LABEL[row.status]}
              </Badge>
            </div>

            <dl className="grid grid-cols-1 gap-3 text-sm">
              {fields.map((f) => (
                <div key={f.label} className="flex flex-col gap-0.5">
                  <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                    {f.label}
                  </dt>
                  <dd
                    className={
                      "text-foreground " + (f.mono ? "font-mono text-xs" : "")
                    }
                  >
                    {f.value}
                  </dd>
                </div>
              ))}
              <div className="flex flex-col gap-0.5">
                <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                  Documents
                </dt>
                <dd className="text-foreground">
                  {row.documents && row.documents.length > 0 ? (
                    <ul className="list-disc pl-5 space-y-0.5">
                      {row.documents.map((d) => (
                        <li key={d} className="text-sm">
                          {d}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
            </dl>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
