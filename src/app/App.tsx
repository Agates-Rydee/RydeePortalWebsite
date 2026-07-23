import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import logoUrl from "../imports/Logo.png";
import { Bg, Logo, cardStyle, btnPrimary, btnLoading, inputBase, focusInput, blurInput, FieldInput, Spinner } from "./components/shared";
import Dashboard from "./pages/Dashboard";
import ActiveRiders from "./pages/ActiveRiders";
import PendingRiders from "./pages/PendingRiders";

type Page = "login" | "register" | "dashboard" | "active-riders" | "pending-riders";

const ROLES = ["Admin", "Operator", "Help Desk", "Driver", "Dispatcher", "Finance"];
const API_LOGIN_URL = import.meta.env.VITE_API_LOGIN_URL ?? "http://localhost:3000/auth/login";

// ─── Register ──────────────────────────────────────────────────
function RegisterView({ onNavigate }: { onNavigate: (p: Page) => void }) {
  const [form, setForm] = useState({ username: "", email: "", phone: "", password: "", confirmPassword: "", role: "" });
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pwMismatch, setPwMismatch] = useState(false);

  const set = (field: keyof typeof form) => (v: string) => setForm(f => ({ ...f, [field]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) { setPwMismatch(true); return; }
    setPwMismatch(false);
    setLoading(true);
    setTimeout(() => { setLoading(false); onNavigate("login"); }, 1800);
  };

  return (
    <>
      <Logo subtitle="Create your Rydee account" />
      <div className="w-full rounded-2xl p-8" style={cardStyle}>
        <div className="flex items-center gap-3 mb-1">
          <button onClick={() => onNavigate("login")} className="p-1.5 rounded-lg transition-colors duration-150"
            style={{ color: "var(--muted-foreground)", background: "none", border: "none", cursor: "pointer" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--muted)"; e.currentTarget.style.color = "#17a882"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "var(--muted-foreground)"; }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
          </button>
          <h2 className="text-xl font-semibold" style={{ color: "var(--card-foreground)" }}>Register</h2>
        </div>
        <p className="text-sm mb-7 ml-8" style={{ color: "var(--muted-foreground)" }}>Fill in the details below to get started.</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FieldInput id="reg-username" label="Username" placeholder="Choose a username" value={form.username} onChange={set("username")} autoComplete="username" />
          <FieldInput id="reg-email" label="Email address" type="email" placeholder="you@example.com" value={form.email} onChange={set("email")} autoComplete="email" />
          <FieldInput id="reg-phone" label="Phone number" type="tel" placeholder="03xx-xxxxxxx" value={form.phone} onChange={set("phone")} autoComplete="tel" />

          {/* Role */}
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
            <button onClick={() => onNavigate("login")} style={{ color: "#17a882", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#0d8f6e")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#17a882")}>
              Sign in
            </button>
          </p>
        </div>
      </div>
    </>
  );
}

// ─── Login ─────────────────────────────────────────────────────
function LoginView({ onNavigate }: { onNavigate: (p: Page) => void }) {
  const [showPw, setShowPw] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!isValidEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(API_LOGIN_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || response.statusText || "Login failed");
      }

      onNavigate("dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Logo subtitle="Electric rides across Karachi" />
      <div className="w-full rounded-2xl p-8" style={cardStyle}>
        <h2 className="text-xl font-semibold mb-1" style={{ color: "var(--card-foreground)" }}>Sign in</h2>
        <p className="text-sm mb-7" style={{ color: "var(--muted-foreground)" }}>Welcome back. Enter your credentials to continue.</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <FieldInput id="email" label="Email address" type="email" placeholder="you@example.com"
            value={email} onChange={setEmail} autoComplete="email" />

          <FieldInput id="password" label="Password" type={showPw ? "text" : "password"}
            placeholder="Enter your password" value={password} onChange={setPassword} autoComplete="current-password">
            <button type="button" onClick={() => setShowPw(v => !v)} tabIndex={-1}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg"
              style={{ color: "var(--muted-foreground)", background: "none", border: "none", cursor: "pointer" }}>
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </FieldInput>

          {error && <p className="text-sm text-red-500" style={{ color: "#ef4444" }}>{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full rounded-xl py-3.5 text-sm font-semibold transition-all duration-200 mt-1"
            style={loading ? btnLoading : btnPrimary}
            onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.boxShadow = "0 4px 28px rgba(23,168,130,0.45)"; e.currentTarget.style.transform = "translateY(-1px)"; } }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 4px 20px rgba(23,168,130,0.30)"; e.currentTarget.style.transform = "translateY(0)"; }}>
            {loading ? <span className="flex items-center justify-center gap-2"><Spinner /> Signing in…</span> : "Sign in"}
          </button>
        </form>

        <div className="mt-6 flex flex-col items-center gap-3">
          <button style={{ color: "var(--muted-foreground)", background: "none", border: "none", cursor: "pointer", fontSize: "0.875rem" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#17a882")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted-foreground)")}>
            Forgot password?
          </button>
          <div className="w-full h-px" style={{ background: "var(--border)" }} />
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
            {"Don't have an account? "}
            <button onClick={() => onNavigate("register")} style={{ color: "#17a882", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#0d8f6e")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#17a882")}>
              Register
            </button>
          </p>
        </div>
      </div>
    </>
  );
}

// ─── Auth shell (login / register) ────────────────────────────
function AuthShell({ page, onNavigate }: { page: Page; onNavigate: (p: Page) => void }) {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: "var(--background)" }}>
      <Bg />
      <div className="relative z-10 w-full max-w-[420px] flex flex-col items-center">
        {page === "login"
          ? <LoginView onNavigate={onNavigate} />
          : <RegisterView onNavigate={onNavigate} />}
        <p className="mt-8 text-xs text-center" style={{ color: "#5a8070" }}>
          Rydee · Karachi, Pakistan &nbsp;·&nbsp; Electric mobility for everyone
        </p>
      </div>
    </div>
  );
}

// ─── Root ──────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState<Page>("login");

  if (page === "active-riders") return <ActiveRiders onBack={() => setPage("dashboard")} />;
  if (page === "pending-riders") return <PendingRiders onBack={() => setPage("dashboard")} />;
  if (page === "dashboard") return <Dashboard onNavigate={(p) => setPage(p as Page)} onLogout={() => setPage("login")} />;
  return <AuthShell page={page} onNavigate={setPage} />;
}
