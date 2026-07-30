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
import { API_REGISTER_URL } from "@/lib/config";
import { ROLES } from "@/types/profile";
import { AuthShell } from "./AuthShell";

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

  const set =
    (field: keyof typeof form) =>
    (v: string) =>
      setForm((f) => ({ ...f, [field]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirmPassword) {
      setPwMismatch(true);
      return;
    }
    setPwMismatch(false);
    setLoading(true);
    try {
      // ─── byte-for-byte from old RegisterView.handleSubmit ──
      const response = await fetch(API_REGISTER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phoneNumber: form.phone,
          dob: form.dob,
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
      // ─── end verbatim fetch ─────────────────────────────────
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
            <FieldInput id="reg-name" label="Name" placeholder="Your full name"
              value={form.name} onChange={set("name")} autoComplete="name" />
            <FieldInput id="reg-email" label="Email address" type="email" placeholder="you@example.com"
              value={form.email} onChange={set("email")} autoComplete="email" />
            <FieldInput id="reg-phone" label="Phone number" type="tel" placeholder="03xx-xxxxxxx"
              value={form.phone} onChange={set("phone")} autoComplete="tel" />
            <FieldInput id="reg-dob" label="Date of birth" type="text" inputMode="numeric"
              placeholder="DD/MM/YYYY" value={form.dob} onChange={set("dob")} autoComplete="bday" />
            <FieldInput id="reg-address" label="Home address" type="text"
              placeholder="House#100, Sultan Road, Multan" value={form.address}
              onChange={set("address")} autoComplete="street-address" />

            {/* Role — native <select> to preserve tests/regression/roles.test.tsx
                (HTMLSelectElement cast + within().getAllByRole("option")). */}
            {showRole && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="reg-role" className="text-foreground-label">Role</Label>
                <select
                  id="reg-role"
                  value={form.role}
                  onChange={(e) => set("role")(e.target.value)}
                  required
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
              </div>
            )}

            {/* Password */}
            <FieldInput
              id="reg-password"
              label="Password"
              type={showPw ? "text" : "password"}
              placeholder="Create a password"
              value={form.password}
              onChange={set("password")}
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
