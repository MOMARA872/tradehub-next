import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { translate, type LangCode } from "@/i18n";

interface I18nState {
  language: LangCode;
  setLanguage: (lang: LangCode) => void;
  t: (key: string) => string;
}

function applyDir(lang: LangCode) {
  if (typeof document !== "undefined") {
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = lang;
  }
}

export const useI18nStore = create<I18nState>()(
  persist(
    (set, get) => ({
      language: "en",
      setLanguage: (lang: LangCode) => {
        set({ language: lang });
        applyDir(lang);
      },
      t: (key: string) => {
        return translate(key, get().language);
      },
    }),
    {
      name: "tradehub-lang",
      storage: createJSONStorage(() =>
        typeof window !== "undefined"
          ? sessionStorage
          : { getItem: () => null, setItem: () => {}, removeItem: () => {} }
      ),
    }
  )
);

// Apply dir on store rehydration (client-side only)
if (typeof window !== "undefined") {
  useI18nStore.subscribe((state) => {
    applyDir(state.language);
  });
}
