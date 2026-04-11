import { en, type TranslationKeys } from "./translations/en";
import { es } from "./translations/es";
import { th } from "./translations/th";
import { ar } from "./translations/ar";

export type LangCode = "en" | "es" | "th" | "ar";

export const SUPPORTED_LANGUAGES: { code: LangCode; label: string; flag: string; dir: "ltr" | "rtl" }[] = [
  { code: "en", label: "English", flag: "🇺🇸", dir: "ltr" },
  { code: "es", label: "Español", flag: "🇪🇸", dir: "ltr" },
  { code: "th", label: "ไทย", flag: "🇹🇭", dir: "ltr" },
  { code: "ar", label: "العربية", flag: "🇸🇦", dir: "rtl" },
];

const TRANSLATIONS: Record<LangCode, TranslationKeys> = { en, es, th, ar };

export function getTranslations(lang: LangCode): TranslationKeys {
  return TRANSLATIONS[lang] || TRANSLATIONS.en;
}

/**
 * Translate a key using dot notation: t("nav.home", "en") -> "Home"
 */
export function translate(key: string, lang: LangCode): string {
  const keys = key.split(".");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let value: any = TRANSLATIONS[lang];

  for (const k of keys) {
    if (value && typeof value === "object" && k in value) {
      value = value[k];
    } else {
      // Fallback to English
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let fallback: any = TRANSLATIONS.en;
      for (const fk of keys) {
        fallback = fallback?.[fk];
      }
      return (fallback as string) || key;
    }
  }

  return (value as string) || key;
}
