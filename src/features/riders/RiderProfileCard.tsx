import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { KARACHI_AREAS, VERIFICATION_DOCS } from "@/features/riders/constants";
import { formatCnic, normalizeCnicInput } from "@/features/riders/cnic";
import type { PendingRider } from "@/types/rider";
import { DatePickerField } from "@/components/DatePickerField";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const AREA_ITEMS = KARACHI_AREAS.map((a) => (
  <SelectItem key={a} value={a}>
    {a}
  </SelectItem>
));

function calcAge(dob: string): number {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function generatePin(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export interface RiderProfileCardProps {
  form: PendingRider;
  onChange: (next: PendingRider) => void;
  onSave: () => void;
  onActivate?: () => void;
  activating?: boolean;
  actions?: ReactNode;
}

export function RiderProfileCard({
  form,
  onChange,
  onSave,
  onActivate,
  activating = false,
  actions,
}: RiderProfileCardProps) {
  const { t } = useTranslation();
  const setField = (field: keyof PendingRider, value: string | string[]) => {
    onChange({ ...form, [field]: value } as PendingRider);
  };

  const toggleDoc = (doc: string) => {
    const docs = form.documents.includes(doc)
      ? form.documents.filter((d) => d !== doc)
      : [...form.documents, doc];
    setField("documents", docs);
  };

  const handleGeneratePin = () => setField("pin", generatePin());

  return (
    <Card className="rounded-2xl p-7 gap-5 card-elevated border-border">
      <h2 className="text-lg font-semibold text-card-foreground mb-1">
        {t("riders.profileCard.heading")}
      </h2>

      <Field id="pr-name" label={t("riders.profileCard.fields.fullName")}>
        <Input
          id="pr-name"
          value={form.name}
          onChange={(e) => setField("name", e.target.value)}
          className="h-auto rounded-xl px-4 py-3 text-sm"
        />
      </Field>

      <Field id="pr-phone" label={t("riders.profileCard.fields.phoneNumber")}>
        <Input
          id="pr-phone"
          type="tel"
          value={form.phone}
          onChange={(e) => setField("phone", e.target.value)}
          className="h-auto rounded-xl px-4 py-3 text-sm"
        />
      </Field>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="pr-area" className="text-foreground-label">
          {t("riders.profileCard.fields.geographicArea")}
        </Label>
        <Select value={form.area || undefined} onValueChange={(v) => setField("area", v)}>
          <SelectTrigger id="pr-area" className="w-full h-auto rounded-xl px-4 py-3 text-sm">
            <SelectValue placeholder={t("riders.profileCard.selectArea")} />
          </SelectTrigger>
          <SelectContent className="duration-0">{AREA_ITEMS}</SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field id="pr-dob" label={t("riders.profileCard.fields.dob")}>
          <DatePickerField
            id="pr-dob"
            value={form.dob ? new Date(form.dob) : undefined}
            onChange={(d) =>
              setField(
                "dob",
                d
                  ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
                  : "",
              )
            }
            fromYear={1940}
            toYear={new Date().getFullYear()}
            placeholder="DD/MM/YYYY"
            ariaLabel={t("riders.profileCard.fields.dob")}
          />
        </Field>
        <Field id="pr-age" label={t("riders.profileCard.fields.age")}>
          <Input
            id="pr-age"
            readOnly
            value={form.dob ? t("riders.profileCard.ageValue", { age: calcAge(form.dob) }) : "—"}
            className="h-auto rounded-xl px-4 py-3 text-sm opacity-70 cursor-default read-only:focus-visible:ring-0 read-only:focus-visible:border-input"
            tabIndex={-1}
            aria-readonly="true"
          />
        </Field>
      </div>

      <Field id="pr-cnic" label={t("riders.profileCard.fields.cnic")}>
        <Input
          id="pr-cnic"
          value={formatCnic(form.cnic)}
          onChange={(e) => setField("cnic", normalizeCnicInput(e.target.value))}
          placeholder="XXXXX-XXXXXXX-X"
          inputMode="numeric"
          maxLength={15}
          className="h-auto rounded-xl px-4 py-3 text-sm"
        />
      </Field>

      <fieldset className="flex flex-col gap-2 border-0 p-0 m-0">
        <legend className="text-sm font-medium text-foreground-label mb-1">
          {t("riders.profileCard.fields.verificationDocs")}
        </legend>
        <div className="rounded-xl p-4 flex flex-col gap-2.5 bg-input-background border border-border">
          {VERIFICATION_DOCS.map((doc) => {
            const cid = `pr-doc-${doc.replace(/\s+/g, "-").toLowerCase()}`;
            const checked = form.documents.includes(doc);
            return (
              <div key={doc} className="flex items-center gap-3">
                <Checkbox id={cid} checked={checked} onCheckedChange={() => toggleDoc(doc)} />
                <Label
                  htmlFor={cid}
                  className={
                    "text-sm flex-1 cursor-pointer " +
                    (checked ? "text-foreground" : "text-muted-foreground")
                  }
                >
                  {t(`riders.profileCard.docLabels.${doc}`)}
                </Label>
                {checked && (
                  <Badge
                    variant="secondary"
                    className="ms-auto rounded-full px-2 py-0.5 text-xs bg-[color:var(--brand-bright)]/12 text-primary border-transparent"
                  >
                    {t("riders.profileCard.received")}
                  </Badge>
                )}
              </div>
            );
          })}
        </div>
      </fieldset>

      <Field id="pr-pin" label={t("riders.profileCard.fields.accessPin")}>
        <Input
          id="pr-pin"
          value={form.pin}
          readOnly
          placeholder={t("riders.profileCard.pinNotGenerated")}
          className={
            "h-auto rounded-xl px-4 py-3 text-sm font-mono tracking-[0.25em] cursor-default read-only:focus-visible:ring-0 read-only:focus-visible:border-input " +
            (form.pin ? "" : "opacity-50")
          }
          aria-readonly="true"
        />
      </Field>

      <div className="flex gap-3 mt-2 flex-wrap">
        <Button
          type="button"
          onClick={handleGeneratePin}
          size="lg"
          className="flex-1 rounded-xl py-3 h-auto text-sm font-semibold shadow-[0_4px_20px_rgba(13,143,110,0.30)] hover:bg-primary-hover active:bg-primary-active hover:shadow-[0_4px_28px_rgba(13,143,110,0.45)]"
        >
          {form.pin ? t("riders.profileCard.regeneratePin") : t("riders.profileCard.generatePin")}
        </Button>

        <Button
          type="button"
          variant="secondary"
          size="lg"
          onClick={onSave}
          className="flex-1 rounded-xl py-3 h-auto text-sm font-semibold bg-muted hover:bg-secondary text-foreground"
        >
          {t("riders.profileCard.saveChanges")}
        </Button>

        {onActivate && (
          <Button
            type="button"
            size="lg"
            onClick={onActivate}
            disabled={activating || !/^\d{6}$/.test(form.pin)}
            className="flex-1 rounded-xl py-3 h-auto text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {activating
              ? t("riders.profileCard.activating")
              : t("riders.profileCard.activateRider")}
          </Button>
        )}

        {actions}
      </div>
    </Card>
  );
}

export interface BlockRiderActionProps {
  riderName: string;
  onConfirm: () => void;
}

export function BlockRiderAction({ riderName, onConfirm }: BlockRiderActionProps) {
  const { t } = useTranslation();
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="rounded-xl px-5 py-3 h-auto text-sm font-semibold bg-destructive/10 text-destructive border-destructive/25 hover:bg-destructive/20 hover:text-destructive"
        >
          {t("riders.profileCard.blockRider")}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t("riders.profileCard.blockDialog.title", { name: riderName })}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t("riders.profileCard.blockDialog.description")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("riders.common.cancel")}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {t("riders.profileCard.blockDialog.confirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function Field({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="text-foreground-label">
        {label}
      </Label>
      {children}
    </div>
  );
}
