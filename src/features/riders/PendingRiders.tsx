import { useState, useEffect } from "react";
import { getUnregisteredRiders } from "@/api/riders";
import { KARACHI_AREAS, VERIFICATION_DOCS } from "@/features/riders/constants";
import type { PendingRider } from "@/types/rider";
import { BackButton, Logo } from "@/components/shared";
import { DatePickerField } from "@/components/DatePickerField";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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

interface UnregisteredRidersResponse {
  riders?: Array<Record<string, unknown>>;
}

function toPendingRider(raw: Record<string, unknown>, idx: number): PendingRider {
  // Only name, phone, and activation status are firmly guaranteed by the
  // backend; every other field falls back to a safe local default so the review
  // form can still render when optional data is missing from the response.
  const id = typeof raw.id === "number" ? raw.id : idx + 1;
  const documents = Array.isArray(raw.documents)
    ? (raw.documents as unknown[]).filter((d): d is string => typeof d === "string")
    : [];
  return {
    id,
    name: typeof raw.name === "string" ? raw.name : "",
    phone: typeof raw.phone === "string" ? raw.phone : "",
    dob: typeof raw.dob === "string" ? raw.dob : "",
    cnic: typeof raw.cnic === "string" ? raw.cnic : "",
    // Accept either area or the rideArea alias returned by some backend paths.
    area:
      typeof raw.area === "string"
        ? raw.area
        : typeof raw.rideArea === "string"
          ? raw.rideArea
          : "",
    documents,
    pin: typeof raw.pin === "string" ? raw.pin : "",
  };
}

function isPending(raw: Record<string, unknown>): boolean {
  // Three-tier pending resolution: a non-empty activation status string always
  // wins and is compared case-insensitively; otherwise a boolean activated flag
  // of true means the rider is active (not pending); otherwise the rider is
  // treated as pending, which matches the semantics of this endpoint returning
  // the unregistered subset when neither field is populated.
  const rawStatus = raw.activation_status ?? raw.activationStatus;
  const status = String(rawStatus ?? "").toLowerCase().trim();
  if (status !== "") {
    return status === "pending";
  }
  if (raw.activated === true) {
    return false;
  }
  return true;
}

export default function PendingRiders({ onBack }: { onBack: () => void }) {
  const [riders, setRiders] = useState<PendingRider[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [form, setForm] = useState<PendingRider | null>(null);
  const [blocked, setBlocked] = useState<number[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async (): Promise<void> => {
      try {
        // The API wrapper throws an ApiError on non-ok responses whose
        // message is the server response text verbatim, preserving the
        // exact error copy the loadError alert used to render.
        const data = (await getUnregisteredRiders()) as UnregisteredRidersResponse;
        if (!data || !Array.isArray(data.riders)) {
          throw new Error("Invalid response shape");
        }

        const pending = data.riders
          .filter(isPending)
          .map((r, i) => toPendingRider(r, i));

        if (cancelled) return;
        setRiders(pending);
        setLoadError(null);
      } catch (err) {
        if (cancelled) return;
        setLoadError(err instanceof Error ? err.message : "Failed to load riders");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 2000);
    return () => clearTimeout(t);
  }, [notice]);

  const selectRider = (id: number) => {
    const rider = riders.find((r) => r.id === id) ?? null;
    setSelectedId(id);
    setForm(rider ? { ...rider } : null);
  };

  const setField = (field: keyof PendingRider, value: string | string[]) => {
    setForm((f) => (f ? { ...f, [field]: value } : f));
  };

  const toggleDoc = (doc: string) => {
    if (!form) return;
    const docs = form.documents.includes(doc)
      ? form.documents.filter((d) => d !== doc)
      : [...form.documents, doc];
    setField("documents", docs);
  };

  const handleGeneratePin = () => {
    setField("pin", generatePin());
  };

  const confirmBlock = () => {
    if (!form) return;
    setBlocked((b) => [...b, form.id]);
    setRiders((r) => r.filter((x) => x.id !== form.id));
    setSelectedId(null);
    setForm(null);
    setNotice("Rider blocked");
  };

  const handleSave = () => {
    if (!form) return;
    setRiders((r) => r.map((x) => (x.id === form.id ? { ...form } : x)));
    setNotice("Changes saved");
  };

  const activeRiders = riders.filter((r) => !blocked.includes(r.id));

  return (
    <div
      className="min-h-screen flex flex-col bg-background"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      <header className="w-full flex items-center justify-between px-6 py-4 bg-card border-b border-border">
        <div className="flex items-center gap-4">
          <BackButton onClick={onBack} label="Dashboard" />
          <Logo size="sm" />
        </div>
        <Badge
          variant="outline"
          className="rounded-full px-3 py-1.5 text-xs font-semibold bg-warning-muted text-warning border-warning/25"
        >
          {activeRiders.length} pending
        </Badge>
      </header>

      <main className="flex-1 px-6 py-8 max-w-2xl mx-auto w-full">
        <h1 className="text-2xl font-bold mb-1 text-foreground">Pending Riders</h1>
        <p className="text-sm mb-6 text-muted-foreground">
          Select a rider to review and complete their registration.
        </p>

        {loading && (
          <div
            role="status"
            aria-live="polite"
            className="rounded-2xl border border-border bg-card px-6 py-10 text-center text-sm text-muted-foreground"
          >
            Loading pending riders…
          </div>
        )}

        {!loading && loadError && (
          <div
            role="alert"
            className="rounded-2xl border border-destructive/25 bg-destructive/10 px-6 py-6 text-sm text-destructive"
          >
            {loadError}
          </div>
        )}

        {!loading && !loadError && activeRiders.length === 0 && (
          <Card className="rounded-2xl p-10 flex-col items-center justify-center text-center border-border shadow-none">
            <p className="text-sm font-medium text-foreground">No pending riders</p>
            <p className="text-xs mt-1 text-muted-foreground">
              All rider applications have been reviewed.
            </p>
          </Card>
        )}

        {!loading && !loadError && activeRiders.length > 0 && (
        <>
        <div className="flex flex-col gap-1.5 mb-8">
          <Label htmlFor="rider-select" className="text-foreground-label">
            Select pending rider
          </Label>
          <select
            id="rider-select"
            value={selectedId != null ? String(selectedId) : ""}
            onChange={(e) => selectRider(Number(e.target.value))}
            className="select-field"
          >
            <option value="" disabled>Choose a rider to review…</option>
            {activeRiders.map((r) => (
              <option key={r.id} value={String(r.id)}>
                {r.name} — {r.phone}
              </option>
            ))}
          </select>
        </div>

        {form && (
          <Card className="rounded-2xl p-7 gap-5 card-elevated border-border">
            <h2 className="text-lg font-semibold text-card-foreground mb-1">Rider Profile</h2>

            <FormField id="pr-name" label="Full name">
              <Input
                id="pr-name"
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                className="h-auto rounded-xl px-4 py-3 text-sm"
              />
            </FormField>

            <FormField id="pr-phone" label="Phone number">
              <Input
                id="pr-phone"
                type="tel"
                value={form.phone}
                onChange={(e) => setField("phone", e.target.value)}
                className="h-auto rounded-xl px-4 py-3 text-sm"
              />
            </FormField>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pr-area" className="text-foreground-label">
                Geographic area of interest
              </Label>
              <select
                id="pr-area"
                value={form.area || ""}
                onChange={(e) => setField("area", e.target.value)}
                className="select-field"
              >
                <option value="" disabled>Select area…</option>
                {KARACHI_AREAS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField id="pr-dob" label="Date of birth">
                <DatePickerField
                  id="pr-dob"
                  value={form.dob ? new Date(form.dob) : undefined}
                  onChange={(d) => setField("dob", d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}` : "")}
                  fromYear={1940}
                  toYear={new Date().getFullYear() - 18}
                  placeholder="DD/MM/YYYY"
                  ariaLabel="Date of birth"
                />
              </FormField>
              <FormField id="pr-age" label="Age (calculated)">
                <Input
                  id="pr-age"
                  readOnly
                  value={form.dob ? `${calcAge(form.dob)} years` : "—"}
                  className="h-auto rounded-xl px-4 py-3 text-sm opacity-70 cursor-default read-only:focus-visible:ring-0 read-only:focus-visible:border-input"
                  tabIndex={-1}
                  aria-readonly="true"
                />
              </FormField>
            </div>

            <FormField id="pr-cnic" label="CNIC number">
              <Input
                id="pr-cnic"
                value={form.cnic}
                onChange={(e) => setField("cnic", e.target.value)}
                placeholder="XXXXX-XXXXXXX-X"
                className="h-auto rounded-xl px-4 py-3 text-sm"
              />
            </FormField>

            <fieldset className="flex flex-col gap-2 border-0 p-0 m-0">
              <legend className="text-sm font-medium text-foreground-label mb-1">
                Verification documents
              </legend>
              <div className="rounded-xl p-4 flex flex-col gap-2.5 bg-input-background border border-border">
                {VERIFICATION_DOCS.map((doc) => {
                  const cid = `pr-doc-${doc.replace(/\s+/g, "-").toLowerCase()}`;
                  const checked = form.documents.includes(doc);
                  return (
                    <div key={doc} className="flex items-center gap-3">
                      <Checkbox
                        id={cid}
                        checked={checked}
                        onCheckedChange={() => toggleDoc(doc)}
                      />
                      <Label
                        htmlFor={cid}
                        className={
                          "text-sm flex-1 cursor-pointer " +
                          (checked ? "text-foreground" : "text-muted-foreground")
                        }
                      >
                        {doc}
                      </Label>
                      {checked && (
                        <Badge
                          variant="secondary"
                          className="ml-auto rounded-full px-2 py-0.5 text-xs bg-[color:var(--brand-bright)]/12 text-primary border-transparent"
                        >
                          Received
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </fieldset>

            <FormField id="pr-pin" label="Access PIN">
              <Input
                id="pr-pin"
                value={form.pin}
                readOnly
                placeholder="Not yet generated"
                className={
                  "h-auto rounded-xl px-4 py-3 text-sm font-mono tracking-[0.25em] cursor-default read-only:focus-visible:ring-0 read-only:focus-visible:border-input " +
                  (form.pin ? "" : "opacity-50")
                }
                aria-readonly="true"
              />
            </FormField>

            <div className="flex gap-3 mt-2 flex-wrap">
              <Button
                type="button"
                onClick={handleGeneratePin}
                size="lg"
                className="flex-1 rounded-xl py-3 h-auto text-sm font-semibold shadow-[0_4px_20px_rgba(13,143,110,0.30)] hover:bg-primary-hover active:bg-primary-active hover:shadow-[0_4px_28px_rgba(13,143,110,0.45)]"
              >
                {form.pin ? "Regenerate PIN" : "Generate PIN"}
              </Button>

              <Button
                type="button"
                variant="secondary"
                size="lg"
                onClick={handleSave}
                className="flex-1 rounded-xl py-3 h-auto text-sm font-semibold bg-muted hover:bg-secondary text-foreground"
              >
                Save changes
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    className="rounded-xl px-5 py-3 h-auto text-sm font-semibold bg-destructive/10 text-destructive border-destructive/25 hover:bg-destructive/20 hover:text-destructive"
                  >
                    Block rider
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Block rider {form.name}?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This rider will not be able to register. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={confirmBlock}
                      className="bg-destructive text-white hover:bg-destructive/90"
                    >
                      Block rider
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </Card>
        )}

        {!form && (
          <Card className="rounded-2xl p-10 flex-col items-center justify-center text-center border-border shadow-none">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 bg-warning-muted">
              <svg
                width="26" height="26" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                className="text-warning" aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <p className="text-sm font-medium text-foreground">No rider selected</p>
            <p className="text-xs mt-1 text-muted-foreground">
              Choose a rider from the dropdown above to review their application.
            </p>
          </Card>
        )}
        </>
        )}
      </main>

      {notice && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 rounded-md border bg-success-muted text-success border-success/25 px-4 py-2 text-sm font-medium shadow-md"
        >
          {notice}
        </div>
      )}
    </div>
  );
}

function FormField({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="text-foreground-label">
        {label}
      </Label>
      {children}
    </div>
  );
}
