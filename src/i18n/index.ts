import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import ur from "./locales/ur.json";

export const LANG_STORAGE_KEY = "rydee.lang";

export type SupportedLanguage = "en" | "ur";

function readInitialLanguage(): SupportedLanguage {
  if (typeof window === "undefined") return "en";
  const stored = window.localStorage.getItem(LANG_STORAGE_KEY);
  return stored === "ur" || stored === "en" ? stored : "en";
}

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ur: { translation: ur },
  },
  lng: readInitialLanguage(),
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

function syncHtmlLang(lang: string): void {
  if (typeof document === "undefined") return;
  document.documentElement.lang = lang === "ur" ? "ur" : "en";
}

syncHtmlLang(i18n.language);
i18n.on("languageChanged", syncHtmlLang);

export function setLanguage(lang: SupportedLanguage): void {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(LANG_STORAGE_KEY, lang);
  }
  void i18n.changeLanguage(lang);
}

export default i18n;
