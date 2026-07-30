// D8 restyle Phase 1: hand-rolled buttons/inputs → shadcn primitives.
// Fetch call + all test-visible text (labels "Phone Number" / "Password",
// button "Sign in", client error "valid phone number", server error
// passthrough) is unchanged — see docs/ux/restyle-spec.md §6.4.
import { useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { Eye, EyeOff } from "lucide-react";
import { Logo, FieldInput, Spinner } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { API_LOGIN_URL } from "@/lib/config";
import { roleHome, type Profile } from "@/types/profile";
import { useAuth } from "@/features/auth/useAuth";
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
      const topLevelRole: string = data.role ?? data.user?.role ?? "";
      const profile = data.profile as Profile | undefined;
      // ─── end verbatim fetch ─────────────────────────────────

      if (!profile) {
        throw new Error("Login response missing profile");
      }

      // D15: normalize role at the response boundary (see original commit).
      const canonicalRole = profile.role || topLevelRole;
      const normalizedProfile: Profile = { ...profile, role: canonicalRole };
      auth.login(normalizedProfile);

      const fromState = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;
      const dest = fromState && fromState !== "/login" ? fromState : roleHome(canonicalRole);
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
      <Card className="w-full rounded-2xl card-elevated border-border">
        <CardContent className="p-8">
          <h2 className="text-xl font-semibold mb-1 text-card-foreground">Sign in</h2>
          <p className="text-sm mb-7 text-muted-foreground">
            Welcome back. Enter your credentials to continue.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <FieldInput
              id="phone"
              label="Phone Number"
              type="tel"
              placeholder="123-456-7890"
              value={phone}
              onChange={setPhone}
              autoComplete="tel"
            />

            <FieldInput
              id="password"
              label="Password"
              type={showPw ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={setPassword}
              autoComplete="current-password"
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
              className="w-full rounded-xl py-3.5 h-auto text-sm font-semibold shadow-[0_4px_20px_rgba(13,143,110,0.30)] hover:bg-primary-hover active:bg-primary-active hover:shadow-[0_4px_28px_rgba(13,143,110,0.45)] mt-1"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Spinner /> Signing in…
                </span>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>

          <div className="mt-6 flex flex-col items-center gap-3">
            <Button
              type="button"
              variant="link"
              className="text-muted-foreground hover:text-primary-text h-auto p-0"
            >
              Forgot password?
            </Button>
            <div className="w-full h-px bg-border" />
            <p className="text-sm text-muted-foreground">
              {"Don't have an account? "}
              <Button
                type="button"
                variant="link"
                onClick={() => navigate("/register")}
                className="text-primary-text hover:text-primary-hover font-semibold h-auto p-0"
              >
                Register
              </Button>
            </p>
          </div>
        </CardContent>
      </Card>
    </AuthShell>
  );
}
