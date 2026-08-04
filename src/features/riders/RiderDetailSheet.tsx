import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { AllRidersRow, RiderStatus } from "@/types/rider";
import { formatCnic } from "@/features/riders/cnic";

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
  const { t } = useTranslation();
  const fields: Field[] = row
    ? [
        { label: t("riders.detailSheet.fields.fullName"), value: row.name || "—" },
        { label: t("riders.detailSheet.fields.phone"), value: row.phone || "—", mono: true },
        {
          label: t("riders.detailSheet.fields.cnic"),
          value: row.cnic ? formatCnic(row.cnic) : "—",
          mono: true,
        },
        { label: t("riders.detailSheet.fields.area"), value: row.area || "—" },
        { label: t("riders.detailSheet.fields.joined"), value: formatDate(row.joinedAt) },
        { label: t("riders.detailSheet.fields.dob"), value: formatDate(row.dob) },
        { label: t("riders.detailSheet.fields.pin"), value: row.pin || "—", mono: true },
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
          <SheetTitle>{row?.name || t("riders.detailSheet.title")}</SheetTitle>
          <SheetDescription>{t("riders.detailSheet.description")}</SheetDescription>
        </SheetHeader>

        {row && (
          <div className="px-4 pb-6 space-y-6">
            <div>
              <Badge
                variant="outline"
                className={`gap-1.5 px-2.5 py-0.5 text-xs font-medium rounded-full ${STATUS_BADGE[row.status]}`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current" aria-hidden="true" />
                {t(`riders.common.badges.${row.status}`)}
              </Badge>
            </div>

            <dl className="grid grid-cols-1 gap-5 text-sm">
              {fields.map((f) => (
                <div key={f.label} className="flex flex-col gap-1">
                  <dt
                    className="text-xs uppercase tracking-wider text-muted-foreground"
                    data-fqa-field-label
                  >
                    {f.label}
                  </dt>
                  <dd
                    className={"text-foreground text-base " + (f.mono ? "font-mono text-sm" : "")}
                    data-fqa-field-value
                  >
                    {f.value}
                  </dd>
                </div>
              ))}
              <div className="flex flex-col gap-1">
                <dt
                  className="text-xs uppercase tracking-wider text-muted-foreground"
                  data-fqa-field-label
                >
                  {t("riders.detailSheet.documents")}
                </dt>
                <dd className="text-foreground text-base" data-fqa-field-value>
                  {row.documents && row.documents.length > 0 ? (
                    <ul className="list-disc pl-5 space-y-1">
                      {row.documents.map((d) => (
                        <li key={d} className="text-base">
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
