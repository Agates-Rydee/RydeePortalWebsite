import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { setLanguage, type SupportedLanguage } from "@/i18n";

export function LanguageSwitcher({ className }: { className?: string }) {
  const { t, i18n } = useTranslation();
  const current: SupportedLanguage = i18n.language === "ur" ? "ur" : "en";
  const next: SupportedLanguage = current === "ur" ? "en" : "ur";
  const label = current === "ur" ? "اردو" : "English";
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => setLanguage(next)}
      aria-label={t("common.languageSwitcher.ariaLabel")}
      className={`border-primary/40 bg-background text-foreground hover:bg-accent hover:text-accent-foreground ${className ?? ""}`}
    >
      {label}
    </Button>
  );
}
