import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router";
import { Eye, EyeOff } from "lucide-react";
import { Logo, FieldInput, Spinner } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { login as apiLogin } from "@/api/auth";
import { roleHome, type Profile } from "@/types/profile";
import { useAuth } from "@/features/auth/useAuth";
import { AuthShell } from "./AuthShell";

export default function LoginPage() {
  const { t } = useTranslation();
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [showPw, setShowPw] = useState(false);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const isValidPhone = (value: string) => /^\d{9,11}$/.test(value);

  const PHONE_ERR = t("auth.login.errors.phoneInvalid");
  const PASSWORD_ERR = t("auth.login.errors.passwordRequired");

  const validatePhone = (v: string): string => (isValidPhone(v) ? "" : PHONE_ERR);
  const validatePassword = (v: string): string => (v ? "" : PASSWORD_ERR);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const pErr = validatePhone(phone);
    const pwErr = validatePassword(password);
    setPhoneError(pErr);
    setPasswordError(pwErr);

    if (pErr) {
      // Field-level alert already announces; skip the general error message so screen readers do not read a duplicate.
      document.getElementById("phone")?.focus();
      return;
    }
    if (pwErr) {
      document.getElementById("password")?.focus();
      return;
    }

    setLoading(true);

    try {
      // The API wrapper throws an ApiError on non-ok responses whose message
      // is the server response text verbatim, matching the pre-wrapper fallback
      // ladder so the visible error copy remains identical.
      const data = (await apiLogin(phone, password)) as {
        role?: string;
        user?: { role?: string };
        profile?: Profile;
      };
      const topLevelRole: string = data.role ?? data.user?.role ?? "";
      const profile = data.profile as Profile | undefined;

      if (!profile) {
        throw new Error(t("auth.login.errors.missingProfile"));
      }

      // Normalise the role at the response boundary so downstream code can trust a single field.
      const canonicalRole = profile.role || topLevelRole;
      const normalizedProfile: Profile = { ...profile, role: canonicalRole };
      auth.login(normalizedProfile);

      const fromState = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;
      const dest = fromState && fromState !== "/login" ? fromState : roleHome(canonicalRole);
      navigate(dest, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("auth.login.errors.fallback"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <Logo subtitle={t("auth.register.loginLogoSubtitle")} />
      <Card className="w-full rounded-2xl card-elevated border-border">
        <CardContent className="p-8">
          <h2 className="text-xl font-semibold mb-1 text-card-foreground">
            {t("auth.login.headline")}
          </h2>
          <p className="text-sm mb-7 text-muted-foreground">{t("auth.login.subhead")}</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <FieldInput
              id="phone"
              label={t("auth.login.phoneLabel")}
              type="tel"
              placeholder="123-456-7890"
              value={phone}
              onChange={(v) => {
                setPhone(v);
                if (phoneError) setPhoneError("");
              }}
              onBlur={() => setPhoneError(phone === "" ? "" : validatePhone(phone))}
              errorMessage={phoneError || undefined}
              autoComplete="tel"
            />

            <FieldInput
              id="password"
              label={t("auth.login.passwordLabel")}
              type={showPw ? "text" : "password"}
              placeholder={t("auth.login.passwordPlaceholder")}
              value={password}
              onChange={(v) => {
                setPassword(v);
                if (passwordError) setPasswordError("");
              }}
              onBlur={() => setPasswordError(password === "" ? "" : validatePassword(password))}
              errorMessage={passwordError || undefined}
              autoComplete="current-password"
            >
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setShowPw((v) => !v)}
                aria-label={
                  showPw
                    ? t("auth.register.passwordToggle.hide")
                    : t("auth.register.passwordToggle.show")
                }
                aria-pressed={showPw}
                className="absolute end-2 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-primary hover:bg-transparent"
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
                  <Spinner /> {t("auth.login.submitLoading")}
                </span>
              ) : (
                t("auth.login.submit")
              )}
            </Button>
          </form>

          <div className="mt-6 flex flex-col items-center gap-3">
            <Button
              type="button"
              variant="link"
              className="text-muted-foreground hover:text-primary-text h-auto p-0"
            >
              {t("auth.login.forgotPassword")}
            </Button>
            <div className="w-full h-px bg-border" />
            <p className="text-sm text-muted-foreground">
              {t("auth.login.noAccount")}
              <Button
                type="button"
                variant="link"
                onClick={() => navigate("/register")}
                className="text-primary-text hover:text-primary-hover font-semibold h-auto p-0"
              >
                {t("auth.login.registerLink")}
              </Button>
            </p>
          </div>
        </CardContent>
      </Card>
    </AuthShell>
  );
}
