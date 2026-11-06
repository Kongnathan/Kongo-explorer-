import React, { createContext, useContext, useState, useEffect } from "react";
import { SupportedLanguage, Translations, getTranslations, DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES, LanguageInfo } from "../i18n";

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: Translations;
  languages: LanguageInfo[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = "kongo_language";

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<SupportedLanguage>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "fr" || saved === "en") {
        return saved;
      }
      // Check browser language
      if (typeof navigator !== "undefined" && navigator.language?.startsWith("en")) {
        return "en";
      }
    } catch {
      // Fallback
    }
    return DEFAULT_LANGUAGE;
  });

  const setLanguage = (newLang: SupportedLanguage) => {
    // Only fr and en are currently active, lingala and kikongo can be activated when ready
    if (newLang === "ln" || newLang === "kg") {
      alert("Lingála et Kikôngo seront bientôt disponibles dans une prochaine mise à jour !");
      return;
    }
    setLanguageState(newLang);
    try {
      localStorage.setItem(STORAGE_KEY, newLang);
      if (typeof document !== "undefined") {
        document.documentElement.lang = newLang;
      }
    } catch {
      // Ignore storage errors
    }
  };

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = language;
    }
  }, [language]);

  const t = getTranslations(language);

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        languages: SUPPORTED_LANGUAGES,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
