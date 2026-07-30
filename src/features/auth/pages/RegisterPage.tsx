// D8 restyle Phase 1: hand-rolled buttons/inputs → shadcn primitives.
// Fetch call unchanged. Role dropdown DELIBERATELY kept as native <select>
// (deviation from spec §2.1): regression test tests/regression/roles.test.tsx
// casts the label target to HTMLSelectElement and uses within().getAllByRole(
// "option"). Migrating to Radix Select breaks that assertion; spec's
// DO-NOT-CHANGE rule (§6.4) preserves test-visible contracts, so we keep the
// native <select> here. Other Radix Select swaps happen in Phase 3.
import { useState } from "react";
import { useNavigate } from "react-router";
import { Eye, EyeOff } from "lucide-react";
import { Logo, FieldInput, Spinner } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePickerField } from "@/components/DatePickerField";
import { formatDobDisplay } from "@/components/date-helpers";
import { API_REGISTER_URL } from "@/lib/config";
import { ROLES } from "@/types/profile";
import { AuthShell } from "./AuthShell";

// Iter 4 §2: min age 18 per product decision 2.
const DOB_MAX_YEAR = new Date().getFullYear() - 18;
const DOB_MIN_YEAR = 1940;

// Parse DD/MM/YYYY -> Date for defensive submit-time validation. The picker
// itself never produces an invalid or out-of-range string, but the validator
// runs regardless (belt-and-suspenders + covers the empty state).
function parseDobDisplay(v: string): Date | undefined {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(v);
  if (!m) return undefined;
  const dd = Number(m[1]);
  const mm = Number(m[2]);
  const yyyy = Number(m[3]);
  const d = new Date(yyyy, mm - 1, dd);
  if (d.getFullYear() !== yyyy || d.getMonth() !== mm - 1 || d.getDate() !== dd) return undefined;
  return d;
}

interface RegisterPageProps {
  /** When true, renders the admin variant with a role dropdown. */
  showRole?: boolean;
  /** Back-button destination override (used by /admin/register). */
  backTo?: string;
}

export default function RegisterPage({ showRole = false, backTo }: RegisterPageProps) {
  const navigate = useNavigate();
  const goBack = () => navigate(backTo ?? "/login");

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    dob: "",
    address: "",
    password: "",
    confirmPassword: "",
    role: "rider",
  });
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pwMismatch, setPwMismatch] = useState(false);
  const [error, setError] = useState("");

  // Iter 4 §1: per-field error map. Keys mirror form field ids.
  type FieldKey = "name" | "email" | "phone" | "dob" | "address" | "password" | "role";
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldKey, string>>>({});

  const set =
    (field: keyof typeof form) =>
    (v: string) =>
      setForm((f) => ({ ...f, [field]: v }));

  // ─── Validation helpers (Iter 4 §1.3 + decisions 1/2) ─────────────────
  //
  // DOB is displayed as DD/MM/YYYY (user-facing) but submitted as ISO
  // YYYY-MM-DD per product decision 1. Age minimum 18 per decision 2.
  //
  // Return empty string when valid; else the user-facing error copy.

  const validators: Record<FieldKey, (v: string) => string> = {
    name: (v) => (v.trim().length >= 2 ? "" : "Enter your full name."),
    email: (v) => (/.+@.+\..+/.test(v) ? "" : "Enter a valid email address."),
    phone: (v) => (/^\d{10,11}$/.test(v) ? "" : "Enter a valid phone number (10\u201311 digits)."),
    dob: (v) => (isValidDob(v) ? "" : "Enter a valid date of birth (DD/MM/YYYY)."),
    address: (v) => (v.trim().length >= 5 ? "" : "Enter your home address."),
    password: (v) => (v.length >= 8 ? "" : "Password must be at least 8 characters."),
    role: (v) => (v ? "" : "Select a role."),
  };

  // Validate DD/MM/YYYY, real calendar date, age 18\u2013100 inclusive.
  function isValidDob(v: string): boolean {
    const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(v);
    if (!m) return false;
    const dd = Number(m[1]);
    const mm = Number(m[2]);
    const yyyy = Number(m[3]);
    if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return false;
    const d = new Date(yyyy, mm - 1, dd);
    if (d.getFullYear() !== yyyy || d.getMonth() !== mm - 1 || d.getDate() !== dd) return false;
    // Age 18\u2013100 inclusive.
    const now = new Date();
    let age = now.getFullYear() - yyyy;
    const hadBirthday =
      now.getMonth() > mm - 1 || (now.getMonth() === mm - 1 && now.getDate() >= dd);
    if (!hadBirthday) age -= 1;
    return age >= 18 && age <= 100;
  }

  // DD/MM/YYYY \u2192 ISO YYYY-MM-DD for the fetch payload (decision 1).
  function dobToIso(v: string): string {
    const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(v);
    if (!m) return v; // never happens post-validation; defensive
    return m[3] + "-" + m[2] + "-" + m[1];
  }

  function validateField(key: FieldKey, value: string): string {
    if (key === "role" && !showRole) return "";
    return validators[key](value);
  }

  function handleBlur(key: FieldKey) {
    return () => {
      const value = key === "role" ? form.role : (form[key as keyof typeof form] as string);
      // On blur, only validate if the field has been touched (has a value)
      // to avoid firing on initial focus\u2192blur.
      if (value === "") {
        setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
        return;
      }
      const msg = validateField(key, value);
      setFieldErrors((prev) => ({ ...prev, [key]: msg || undefined }));
    };
  }

  function clearFieldError(key: FieldKey) {
    setFieldErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Confirm-password mismatch keeps its existing dedicated state
    // (\u2018reg-confirm-error\u2019 <p> + role="alert") to preserve the
    // pre-Iter-4 focus flow already relied on downstream.
    if (form.password !== form.confirmPassword) {
      setPwMismatch(true);
      return;
    }
    setPwMismatch(false);

    // Iter 4 §1.5: run all field rules synchronously; focus the first invalid.
    const keys: FieldKey[] = ["name", "email", "phone", "dob", "address", "password"];
    if (showRole) keys.push("role");
    const next: Partial<Record<FieldKey, string>> = {};
    let firstInvalid: FieldKey | null = null;
    for (const k of keys) {
      const val = k === "role" ? form.role : (form[k as keyof typeof form] as string);
      const msg = validateField(k, val);
      if (msg) {
        next[k] = msg;
        if (firstInvalid == null) firstInvalid = k;
      }
    }
    if (firstInvalid) {
      setFieldErrors(next);
      const id = firstInvalid === "role" ? "reg-role" : "reg-" + firstInvalid;
      document.getElementById(id)?.focus();
      return;
    }
    setFieldErrors({});

    setLoading(true);
    try {
      // ─── H1 fetch: field NAMES + shape byte-identical. Only the dob VALUE
      //     format is canonicalized (DD/MM/YYYY \u2192 ISO YYYY-MM-DD) per
      //     product decision 1 (see docs/adr/0003-mock-api-msw.md dob row).
      const response = await fetch(API_REGISTER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phoneNumber: form.phone,
          dob: dobToIso(form.dob),
          address: form.address,
          password: form.password,
          role: form.role,
        }),
        credentials: "include",
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || response.statusText || "Registration failed");
      }
      // ─── end fetch ─────────────────────────────────────────
      navigate("/login", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to register. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <Logo subtitle="Create your Rydee account" />
      <Card className="w-full rounded-2xl card-elevated border-border">
        <CardContent className="p-8">
          <div className="flex items-center gap-3 mb-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={goBack}
              aria-label="Back"
              className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-muted"
            >
              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M19 12H5M12 5l-7 7 7 7" />
              </svg>
            </Button>
            <h2 className="text-xl font-semibold text-card-foreground">
              {showRole ? "Register New User" : "Register"}
            </h2>
          </div>
          <p className="text-sm mb-7 ml-8 text-muted-foreground">
            Fill in the details below to get started.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <FieldInput
              id="reg-name"
              label="Name"
              placeholder="Your full name"
              value={form.name}
              onChange={(v) => { set("name")(v); clearFieldError("name"); }}
              onBlur={handleBlur("name")}
              errorMessage={fieldErrors.name}
              autoComplete="name"
            />
            <FieldInput
              id="reg-email"
              label="Email address"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(v) => { set("email")(v); clearFieldError("email"); }}
              onBlur={handleBlur("email")}
              errorMessage={fieldErrors.email}
              autoComplete="email"
            />
            <FieldInput
              id="reg-phone"
              label="Phone number"
              type="tel"
              placeholder="03xx-xxxxxxx"
              value={form.phone}
              onChange={(v) => { set("phone")(v); clearFieldError("phone"); }}
              onBlur={handleBlur("phone")}
              errorMessage={fieldErrors.phone}
              autoComplete="tel"
            />
            {/* Iter 4.1 hotfix: shadcn-canonical DOB DatePickerField.
                Owner feedback: the previous typeable-input + ghost-icon trigger
                failed discoverability. Now the trigger IS the field — a full-
                width outline <Button> with a CalendarIcon showing DD/MM/YYYY or
                the muted "DD/MM/YYYY" placeholder. Typed entry is REMOVED
                (owner-approved trade). Age constraints enforced by the picker
                bounds (fromYear/toYear = 1940..currentYear-18) so the picker
                cannot produce an out-of-range value; the validator still runs
                on submit as a defensive check + to cover the empty state.
                Iter 4.4 (owner decision 2026-07-30): datepicker lazy split
                dropped in favor of the canonical static shadcn pattern —
                Popover + Calendar are imported eagerly with the rest of the
                DatePickerField (single ~224 kB main bundle, zero loading
                states). Route-level splitting will be reconsidered when the
                app genuinely grows. */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="reg-dob" className="text-foreground-label">
                Date of birth
              </Label>
              <DatePickerField
                id="reg-dob"
                value={parseDobDisplay(form.dob)}
                onChange={(d) => {
                  set("dob")(d ? formatDobDisplay(d) : "");
                  clearFieldError("dob");
                }}
                onClose={handleBlur("dob")}
                fromYear={DOB_MIN_YEAR}
                toYear={DOB_MAX_YEAR}
                placeholder="DD/MM/YYYY"
                errorId="reg-dob-error"
                errorMessage={fieldErrors.dob}
              />
            </div>
            <FieldInput
              id="reg-address"
              label="Home address"
              type="text"
              placeholder="House#100, Sultan Road, Multan"
              value={form.address}
              onChange={(v) => { set("address")(v); clearFieldError("address"); }}
              onBlur={handleBlur("address")}
              errorMessage={fieldErrors.address}
              autoComplete="street-address"
            />

            {/* Role — native <select> to preserve tests/regression/roles.test.tsx
                (HTMLSelectElement cast + within().getAllByRole("option")). */}
            {showRole && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="reg-role" className="text-foreground-label">Role</Label>
                <select
                  id="reg-role"
                  value={form.role}
                  onChange={(e) => { set("role")(e.target.value); clearFieldError("role"); }}
                  onBlur={handleBlur("role")}
                  required
                  aria-invalid={fieldErrors.role ? true : undefined}
                  aria-describedby={fieldErrors.role ? "reg-role-error" : undefined}
                  className="w-full rounded-xl px-4 py-3 pr-10 text-sm bg-input-background border border-input text-card-foreground appearance-none outline-none transition-colors focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%234a6b5e' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 14px center",
                  }}
                >
                  <option value="" disabled>Select a role…</option>
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                {fieldErrors.role && (
                  <p id="reg-role-error" role="alert" className="text-xs mt-0.5 text-destructive">
                    {fieldErrors.role}
                  </p>
                )}
              </div>
            )}

            {/* Password */}
            <FieldInput
              id="reg-password"
              label="Password"
              type={showPw ? "text" : "password"}
              placeholder="Create a password"
              value={form.password}
              onChange={(v) => { set("password")(v); clearFieldError("password"); }}
              onBlur={handleBlur("password")}
              errorMessage={fieldErrors.password}
              autoComplete="new-password"
            >
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setShowPw((v) => !v)}
                aria-label={showPw ? "Hide password" : "Show password"}
                aria-pressed={showPw}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-primary hover:bg-transparent"
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </Button>
            </FieldInput>

            {/* Confirm password */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="reg-confirm" className="text-foreground-label">Confirm password</Label>
              <div className="relative">
                <Input
                  id="reg-confirm"
                  type={showConfirm ? "text" : "password"}
                  placeholder="Repeat your password"
                  value={form.confirmPassword}
                  autoComplete="new-password"
                  required
                  aria-invalid={pwMismatch || undefined}
                  aria-describedby={pwMismatch ? "reg-confirm-error" : undefined}
                  onChange={(e) => {
                    set("confirmPassword")(e.target.value);
                    setPwMismatch(false);
                  }}
                  className="h-auto rounded-xl px-4 py-3 pr-12 text-sm"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowConfirm((v) => !v)}
                  aria-label={showConfirm ? "Hide password" : "Show password"}
                  aria-pressed={showConfirm}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-primary hover:bg-transparent"
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </Button>
              </div>
              {pwMismatch && (
                <p id="reg-confirm-error" role="alert" className="text-xs mt-0.5 text-destructive">
                  Passwords do not match.
                </p>
              )}
            </div>

            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={loading}
              aria-busy={loading}
              size="lg"
              className="w-full rounded-xl py-3.5 h-auto text-sm font-semibold shadow-[0_4px_20px_rgba(13,143,110,0.30)] hover:bg-primary-hover active:bg-primary-active hover:shadow-[0_4px_28px_rgba(13,143,110,0.45)] mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Spinner /> Creating account…
                </span>
              ) : (
                "Create account"
              )}
            </Button>
          </form>

          <div className="mt-5 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Button
                type="button"
                variant="link"
                onClick={() => navigate("/login")}
                className="text-primary-text hover:text-primary-hover font-semibold h-auto p-0"
              >
                Sign in
              </Button>
            </p>
          </div>
        </CardContent>
      </Card>
    </AuthShell>
  );
}
