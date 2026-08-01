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
import { registerUser } from "@/api/auth";
import { ROLES } from "@/types/profile";
import { AuthShell } from "./AuthShell";

const DOB_MAX_YEAR = new Date().getFullYear() - 18;
const DOB_MIN_YEAR = 1940;

// Parse a DD/MM/YYYY string into a Date and reject inputs whose numeric
// components do not survive round-tripping through Date (which silently rolls
// impossible dates like 31/02/2000 forward). Used both by the picker binding
// and as a defensive check on submit for the empty-string case.
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
  showRole?: boolean;
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

  type FieldKey = "name" | "email" | "phone" | "dob" | "address" | "password" | "role";
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldKey, string>>>({});

  const set =
    (field: keyof typeof form) =>
    (v: string) =>
      setForm((f) => ({ ...f, [field]: v }));

  // Each validator returns an empty string when the value is acceptable, or
  // the user-facing error copy otherwise. Date of birth is displayed as
  // DD/MM/YYYY but transmitted as ISO YYYY-MM-DD; the minimum age is 18.
  const validators: Record<FieldKey, (v: string) => string> = {
    name: (v) => (v.trim().length >= 2 ? "" : "Enter your full name."),
    email: (v) => (/.+@.+\..+/.test(v) ? "" : "Enter a valid email address."),
    phone: (v) => (/^\d{10,11}$/.test(v) ? "" : "Enter a valid phone number (10\u201311 digits)."),
    dob: (v) => (isValidDob(v) ? "" : "Enter a valid date of birth (DD/MM/YYYY)."),
    address: (v) => (v.trim().length >= 5 ? "" : "Enter your home address."),
    password: (v) => (v.length >= 8 ? "" : "Password must be at least 8 characters."),
    role: (v) => (v ? "" : "Select a role."),
  };

  function isValidDob(v: string): boolean {
    const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(v);
    if (!m) return false;
    const dd = Number(m[1]);
    const mm = Number(m[2]);
    const yyyy = Number(m[3]);
    if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return false;
    const d = new Date(yyyy, mm - 1, dd);
    if (d.getFullYear() !== yyyy || d.getMonth() !== mm - 1 || d.getDate() !== dd) return false;
    const now = new Date();
    let age = now.getFullYear() - yyyy;
    const hadBirthday =
      now.getMonth() > mm - 1 || (now.getMonth() === mm - 1 && now.getDate() >= dd);
    if (!hadBirthday) age -= 1;
    return age >= 18 && age <= 100;
  }

  function dobToIso(v: string): string {
    const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(v);
    // Defensive fallback: validation runs before this is called, so the regex
    // should always match; returning the raw value keeps the request well-formed.
    if (!m) return v;
    return m[3] + "-" + m[2] + "-" + m[1];
  }

  function validateField(key: FieldKey, value: string): string {
    if (key === "role" && !showRole) return "";
    return validators[key](value);
  }

  function handleBlur(key: FieldKey) {
    return () => {
      const value = key === "role" ? form.role : (form[key as keyof typeof form] as string);
      // Skip validation for empty untouched fields so an initial focus-then-blur
      // (for example tabbing through the form) does not surface an error yet.
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

    // The confirm-password mismatch keeps its own dedicated state and
    // reg-confirm-error alert element so that the focus flow other components
    // rely on remains unchanged.
    if (form.password !== form.confirmPassword) {
      setPwMismatch(true);
      return;
    }
    setPwMismatch(false);

    // Run every field validator synchronously and focus the first invalid
    // field so keyboard users land on the error without extra tabbing.
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
      // Only the date-of-birth value is transformed (DD/MM/YYYY to ISO
      // YYYY-MM-DD); the field names and body shape must match the backend
      // contract exactly. The API wrapper throws an ApiError on non-ok
      // responses whose message is the server response text verbatim.
      await registerUser({
        name: form.name,
        email: form.email,
        phone: form.phone,
        dob: dobToIso(form.dob),
        address: form.address,
        password: form.password,
        role: form.role,
      });
      navigate("/login", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to register. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const formBody = (
    <>
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

            {/* Native <select> is intentional: the roles regression test asserts
                against HTMLSelectElement semantics, which a Radix Select would break. */}
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
    </>
  );

  if (showRole) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
        <div className="w-full max-w-2xl">{formBody}</div>
      </div>
    );
  }

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
            <h2 className="text-xl font-semibold text-card-foreground">Register</h2>
          </div>
          <p className="text-sm mb-7 ml-8 text-muted-foreground">
            Fill in the details below to get started.
          </p>
          {formBody}
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
