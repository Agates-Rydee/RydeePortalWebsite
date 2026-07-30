// Extracted from src/App.tsx RegisterView in Checkpoint 5. Form UI and
// fetch call are copied byte-for-byte; only navigation changes
// (onNavigate → useNavigate) per ADR-0002. Serves both /register and
// /admin/register — the `showRole` variant is selected via prop, wired
// at route element level in src/router.tsx.
import { useState } from "react";
import { useNavigate } from "react-router";
import { Eye, EyeOff } from "lucide-react";
import { Logo, cardStyle, btnPrimary, btnLoading, inputBase, focusInput, blurInput, FieldInput, Spinner } from "@/components/shared";
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

  const [form, setForm] = useState({ name: "", email: "", phone: "", dob: "", address: "", password: "", confirmPassword: "", role: "rider" });
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pwMismatch, setPwMismatch] = useState(false);
  const [error, setError] = useState("");

  const set = (field: keyof typeof form) => (v: string) => setForm(f => ({ ...f, [field]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirmPassword) { setPwMismatch(true); return; }
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
      <div className="w-full rounded-2xl p-8" style={cardStyle}>
        <div className="flex items-center gap-3 mb-1">
          <button onClick={goBack} className="p-1.5 rounded-lg transition-colors duration-150"
            style={{ color: "var(--muted-foreground)", background: "none", border: "none", cursor: "pointer" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--muted)"; e.currentTarget.style.color = "#17a882"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "var(--muted-foreground)"; }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
          </button>
          <h2 className="text-xl font-semibold" style={{ color: "var(--card-foreground)" }}>
            {showRole ? "Register New User" : "Register"}
          </h2>
        </div>
        <p className="text-sm mb-7 ml-8" style={{ color: "var(--muted-foreground)" }}>Fill in the details below to get started.</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FieldInput id="reg-name" label="Name" placeholder="Your full name" value={form.name} onChange={set("name")} autoComplete="name" />
          <FieldInput id="reg-email" label="Email address" type="email" placeholder="you@example.com" value={form.email} onChange={set("email")} autoComplete="email" />
          <FieldInput id="reg-phone" label="Phone number" type="tel" placeholder="03xx-xxxxxxx" value={form.phone} onChange={set("phone")} autoComplete="tel" />
          <FieldInput id="reg-dob" label="Date of birth" type="text" inputMode="numeric" placeholder="DD/MM/YYYY" value={form.dob} onChange={set("dob")} autoComplete="bday" />
          <FieldInput id="reg-address" label="Home address" type="text" placeholder="House#100, Sultan Road, Multan" value={form.address} onChange={set("address")} autoComplete="street-address" />

          {/* Role */}
          {showRole && (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="reg-role" className="text-sm font-medium" style={{ color: "#2d5045" }}>Role</label>
              <select id="reg-role" value={form.role} onChange={(e) => set("role")(e.target.value)} required
                className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all duration-200 appearance-none"
                style={{
                  ...inputBase,
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%235a8070' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                  backgroundRepeat: "no-repeat", backgroundPosition: "right 14px center", paddingRight: "2.5rem",
                  color: form.role ? "var(--card-foreground)" : "#5a8070",
                }}
                onFocus={focusInput} onBlur={blurInput}>
                <option value="" disabled>Select a role…</option>
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          )}

          {/* Password */}
          <FieldInput id="reg-password" label="Password" type={showPw ? "text" : "password"}
            placeholder="Create a password" value={form.password} onChange={set("password")} autoComplete="new-password">
            <button type="button" onClick={() => setShowPw(v => !v)} tabIndex={-1}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg"
              style={{ color: "var(--muted-foreground)", background: "none", border: "none", cursor: "pointer" }}>
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </FieldInput>

          {/* Confirm password */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="reg-confirm" className="text-sm font-medium" style={{ color: "#2d5045" }}>Confirm password</label>
            <div className="relative">
              <input id="reg-confirm" type={showConfirm ? "text" : "password"} placeholder="Repeat your password"
                value={form.confirmPassword} autoComplete="new-password" required
                onChange={(e) => { set("confirmPassword")(e.target.value); setPwMismatch(false); }}
                className="w-full rounded-xl px-4 py-3 pr-12 text-sm outline-none transition-all duration-200"
                style={{ ...inputBase, border: pwMismatch ? "1px solid #ef4444" : "1px solid var(--border)", boxShadow: pwMismatch ? "0 0 0 3px rgba(239,68,68,0.10)" : "none" }}
                onFocus={(e) => { if (!pwMismatch) { e.currentTarget.style.border = "1px solid rgba(23,168,130,0.5)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(23,168,130,0.10)"; } }}
                onBlur={(e) => { if (!pwMismatch) { e.currentTarget.style.border = "1px solid var(--border)"; e.currentTarget.style.boxShadow = "none"; } }} />
              <button type="button" onClick={() => setShowConfirm(v => !v)} tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg"
                style={{ color: "var(--muted-foreground)", background: "none", border: "none", cursor: "pointer" }}>
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {pwMismatch && <p className="text-xs mt-0.5" style={{ color: "#ef4444" }}>Passwords do not match.</p>}
          </div>

          {error && <p className="text-sm" style={{ color: "#ef4444" }}>{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full rounded-xl py-3.5 text-sm font-semibold transition-all duration-200 mt-2"
            style={loading ? btnLoading : btnPrimary}
            onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.boxShadow = "0 4px 28px rgba(23,168,130,0.45)"; e.currentTarget.style.transform = "translateY(-1px)"; } }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 4px 20px rgba(23,168,130,0.30)"; e.currentTarget.style.transform = "translateY(0)"; }}>
            {loading
              ? <span className="flex items-center justify-center gap-2"><Spinner /> Creating account…</span>
              : "Create account"}
          </button>
        </form>

        <div className="mt-5 text-center">
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
            Already have an account?{" "}
            <button onClick={() => navigate("/login")} style={{ color: "#17a882", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#0d8f6e")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#17a882")}>
              Sign in
            </button>
          </p>
        </div>
      </div>
    </AuthShell>
  );
}
