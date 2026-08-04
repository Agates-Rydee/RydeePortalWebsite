import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Bg } from "@/components/shared";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export function AuthShell({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden bg-background"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      <Bg />
      <LanguageSwitcher className="absolute top-4 right-4 z-20" />
      <div className="relative z-10 w-full max-w-[420px] flex flex-col items-center">
        {children}
        <p className="mt-8 text-xs text-center text-muted-foreground">{t("auth.shell.tagline")}</p>
      </div>
    </div>
  );
}
