// Extracted from src/App.tsx LoginView in Checkpoint 5. Form UI and
// fetch call are copied byte-for-byte; only the navigation mechanism
// changes (onNavigate → useNavigate + auth.login) per ADR-0002.
import { useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { Eye, EyeOff } from "lucide-react";
import { Logo, cardStyle, btnPrimary, btnLoading, FieldInput, Spinner } from "@/components/shared";
import { API_LOGIN_URL } from "@/lib/config";
import { roleHome, type Profile } from "@/types/profile";
import { useAuth } from "@/features/auth/AuthProvider";
import { AuthShell } from "./AuthShell";

export default function LoginPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [showPw, setShowPw] = useState(false);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isValidPhone = (value: string) => /^\d{10}$/.test(value);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!isValidPhone(phone)) {
      setError("Please enter a valid phone number.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);

    try {
      // ─── byte-for-byte from old LoginView.handleSubmit ──────
      const response = await fetch(API_LOGIN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password }),
        credentials: "include",
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || response.statusText || "Login failed");
      }

      const data = await response.json();
      const role: string = data.role ?? data.user?.role ?? "";
      const profile = data.profile as Profile | undefined;
      // ─── end verbatim fetch ─────────────────────────────────

      if (!profile) {
        throw new Error("Login response missing profile");
      }
      // Preserve original behavior: role comes from top-level `role` field
      // (or nested user.role fallback), not from profile.role.
      auth.login({ ...profile, role: role || profile.role });

      const fromState = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;
      const dest = fromState && fromState !== "/login" ? fromState : roleHome(role || profile.role);
      navigate(dest, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <Logo subtitle="Electric rides across Karachi" />
      <div className="w-full rounded-2xl p-8" style={cardStyle}>
        <h2 className="text-xl font-semibold mb-1" style={{ color: "var(--card-foreground)" }}>Sign in</h2>
        <p className="text-sm mb-7" style={{ color: "var(--muted-foreground)" }}>Welcome back. Enter your credentials to continue.</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <FieldInput id="phone" label="Phone Number" type="phone" placeholder="123-456-7890"
            value={phone} onChange={setPhone} autoComplete="phone" />

          <FieldInput id="password" label="Password" type={showPw ? "text" : "password"}
            placeholder="Enter your password" value={password} onChange={setPassword} autoComplete="current-password">
            <button type="button" onClick={() => setShowPw(v => !v)} tabIndex={-1}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg"
              style={{ color: "var(--muted-foreground)", background: "none", border: "none", cursor: "pointer" }}>
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </FieldInput>

          {error && <p className="text-sm" style={{ color: "#ef4444" }}>{error}</p>}

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
            <button onClick={() => navigate("/register")} style={{ color: "#17a882", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#0d8f6e")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#17a882")}>
              Register
            </button>
          </p>
        </div>
      </div>
    </AuthShell>
  );
}
