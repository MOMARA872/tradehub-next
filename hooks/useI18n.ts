import { useI18nStore } from "@/store/i18nStore";

export function useI18n() {
  const { language, setLanguage, t } = useI18nStore();
  return { language, setLanguage, t };
}
